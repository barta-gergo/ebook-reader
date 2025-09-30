import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TextIndexingService as ITextIndexingService } from '../../domain/services/text-indexing.interface';
import { PDF_METADATA_SERVICE, FILE_SYSTEM_SERVICE, BOOK_AGGREGATE_REPOSITORY } from '../../domain/repositories/tokens';
import { PdfMetadataService } from '../../domain/services/pdf-metadata.interface';
import { FileSystemService } from '../../domain/services/file-system.interface';
import { BookAggregateRepository } from '../../domain/repositories/book-aggregate.repository.interface';
import { BookId } from '../../domain/value-objects';

@Injectable()
export class TextIndexingService implements ITextIndexingService {

  constructor(
    @Inject(PDF_METADATA_SERVICE)
    private readonly pdfMetadataService: PdfMetadataService,
    @Inject(FILE_SYSTEM_SERVICE)
    private readonly fileSystemService: FileSystemService,
    @Inject(BOOK_AGGREGATE_REPOSITORY)
    private readonly bookRepository: BookAggregateRepository,
  ) {}

  /**
   * Extract searchable text from full PDF content
   * This creates a condensed searchable index instead of storing full text
   */
  createSearchableIndex(fullText: string): string {
    if (!fullText) return '';

    // Remove excessive whitespace and normalize
    const normalized = fullText
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // Extract meaningful phrases and keywords
    const searchableContent = this.extractKeyPhrases(normalized);
    
    // Limit to reasonable size (e.g., 10KB instead of potential MBs)
    const maxLength = 10000;
    return searchableContent.substring(0, maxLength);
  }

  /**
   * Extract key phrases, important words, and searchable content
   */
  private extractKeyPhrases(text: string): string {
    // Split into sentences and paragraphs
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    const importantPhrases: string[] = [];
    const keyWords = new Set<string>();

    // Extract sentences that likely contain important information
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      
      // Skip very short or very long sentences
      if (words.length < 3 || words.length > 50) continue;
      
      // Count meaningful words (not stop words)
      const meaningfulWords = words.filter(word => 
        word.length > 2 && !stopWords.has(word.toLowerCase())
      );
      
      // If sentence has good ratio of meaningful words, include it
      if (meaningfulWords.length >= Math.min(3, words.length * 0.3)) {
        importantPhrases.push(sentence.trim());
        
        // Also collect individual meaningful words
        meaningfulWords.forEach(word => {
          if (word.length > 3) {
            keyWords.add(word.toLowerCase());
          }
        });
      }
    }

    // Combine important phrases and key words
    const keyWordsList = Array.from(keyWords).slice(0, 200); // Limit keywords
    const selectedPhrases = importantPhrases.slice(0, 50); // Limit phrases
    
    return [...selectedPhrases, ...keyWordsList].join(' ');
  }

  /**
   * Search within searchable text using fuzzy matching
   */
  searchInText(searchableText: string, query: string): boolean {
    if (!searchableText || !query) return false;
    
    const normalizedQuery = query.toLowerCase().trim();
    const normalizedText = searchableText.toLowerCase();
    
    // Direct substring match
    if (normalizedText.includes(normalizedQuery)) {
      return true;
    }
    
    // Split query into words and check if most words are present
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return false;
    
    const matchedWords = queryWords.filter(word => 
      normalizedText.includes(word)
    );
    
    // Return true if at least 70% of query words are found
    return matchedWords.length >= Math.ceil(queryWords.length * 0.7);
  }

  /**
   * Extract text snippets that match the search query
   */
  extractSearchSnippets(searchableText: string, query: string, maxSnippets: number = 3): string[] {
    if (!this.searchInText(searchableText, query)) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    const sentences = searchableText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const snippets: string[] = [];
    
    for (const sentence of sentences) {
      if (snippets.length >= maxSnippets) break;
      
      const normalizedSentence = sentence.toLowerCase();
      if (normalizedSentence.includes(normalizedQuery)) {
        // Trim and add context
        const snippet = sentence.trim().substring(0, 200);
        snippets.push(snippet + (sentence.length > 200 ? '...' : ''));
      }
    }

    return snippets;
  }

  /**
   * Get text content for a specific page of a PDF book
   */
  async getPageText(bookId: string, pageNumber: number): Promise<string> {
    try {
      // Get the book to find its file path
      const book = await this.bookRepository.findById(BookId.create(bookId));
      if (!book) {
        throw new NotFoundException(`Book not found with ID: ${bookId}`);
      }

      const pdfPath = book.filePath;

      // Basic validation
      if (pageNumber < 1) {
        throw new NotFoundException(`Invalid page number: ${pageNumber}. Must be greater than 0.`);
      }

      // Extract text using pdf-parse (simpler and already installed)
      const fs = require('fs');
      const pdfParse = require('pdf-parse');

      const dataBuffer = fs.readFileSync(pdfPath);

      // Parse the entire PDF to get all text
      const pdfData = await pdfParse(dataBuffer);

      // Get actual page count from PDF
      const actualPageCount = pdfData.numpages;

      // Check if page number is valid
      if (pageNumber > actualPageCount) {
        throw new NotFoundException(
          `Page ${pageNumber} out of range. PDF has ${actualPageCount} pages. ` +
          `(Note: Database shows ${book.totalPages} pages - may need re-indexing)`
        );
      }

      // Split text by form feed character (page separator)
      const pages = pdfData.text.split('\f');

      // Get the specific page (convert to 0-based index)
      const pageIndex = pageNumber - 1;
      const pageText = pages[pageIndex] || '';

      if (!pageText || pageText.trim().length === 0) {
        // If we can't split by form feed, try to extract a portion of the full text
        // This is a fallback for PDFs that don't use form feed separators
        const avgCharsPerPage = pdfData.text.length / actualPageCount;
        const startPos = Math.floor(pageIndex * avgCharsPerPage);
        const endPos = Math.floor((pageIndex + 1) * avgCharsPerPage);
        const approximatePageText = pdfData.text.substring(startPos, endPos).trim();

        if (!approximatePageText) {
          throw new NotFoundException(`No text content found on page ${pageNumber}`);
        }

        return approximatePageText;
      }

      return pageText.trim();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to extract page text: ${error.message}`);
    }
  }
}