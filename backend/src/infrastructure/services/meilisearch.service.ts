import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MeiliSearch, Index } from 'meilisearch';
import { BookAggregate } from '../../domain/aggregates/book.aggregate';
import { meilisearchConfig } from '../config/meilisearch.config';
import { SearchService, BookSearchDocument, SearchOptions, SearchHit, SearchResponse } from '../../domain/services/search.interface';

@Injectable()
export class MeilisearchService implements SearchService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: MeiliSearch;
  private index: Index;
  private readonly indexName: string;
  private readonly enabled: boolean;

  constructor() {
    this.enabled = meilisearchConfig.enabled;
    this.indexName = meilisearchConfig.indexName;
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV !== 'test') {
      this.logger.log(`Meilisearch config: enabled=${this.enabled}, host=${meilisearchConfig.host}, apiKey=${meilisearchConfig.apiKey ? '[SET]' : '[NOT SET]'}, indexName=${this.indexName}`);
    }
    if (this.enabled) {
      // Initialize Meilisearch client
      const clientOptions: any = {
        host: meilisearchConfig.host,
      };
      
      // Only add apiKey if it's explicitly set and not empty
      if (meilisearchConfig.apiKey && meilisearchConfig.apiKey.trim() !== '') {
        clientOptions.apiKey = meilisearchConfig.apiKey;
      }
      
      this.client = new MeiliSearch(clientOptions);
    }
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Meilisearch is disabled - search functionality will be limited');
      return;
    }

    try {
      await this.initializeIndex();
      this.logger.log('Meilisearch service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Meilisearch service', error);
      // Don't throw - allow app to start even if search is unavailable
    }
  }

  async onModuleDestroy() {
    if (this.enabled && this.client) {
      // Cleanup if needed
      this.logger.log('Meilisearch service destroyed');
    }
  }

  /**
   * Check if Meilisearch service is healthy and available
   */
  async isHealthy(): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      await this.client.health();
      return true;
    } catch (error) {
      this.logger.warn('Meilisearch health check failed', error);
      return false;
    }
  }

  /**
   * Initialize the books index with proper configuration
   */
  private async initializeIndex(): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      // Create or get the index
      this.index = this.client.index(this.indexName);

      // Wait for index to be created
      await this.client.createIndex(this.indexName).catch(() => {
        // Index might already exist, that's fine
      });

      // Configure searchable attributes (order matters for ranking)
      await this.index.updateSearchableAttributes([
        'title',
        'author',
        'subject',
        'keywords',
        'content'
      ]);

      // Configure sortable attributes
      await this.index.updateSortableAttributes([
        'addedAt',
        'title',
        'author',
        'fileSize',
        'totalPages'
      ]);

      // Configure filterable attributes
      await this.index.updateFilterableAttributes([
        'bookId',
        'author',
        'subject',
        'fileSize',
        'totalPages',
        'addedAt'
      ]);

      // Configure ranking rules (BM25 + custom rules)
      await this.index.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness'
      ]);

      // Configure synonyms
      await this.index.updateSynonyms({
        'book': ['ebook', 'e-book', 'publication'],
        'author': ['writer', 'creator'],
        'programming': ['coding', 'development', 'software'],
      });

      // Configure typo tolerance
      await this.index.updateTypoTolerance({
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4,
          twoTypos: 8
        },
        disableOnWords: [],
        disableOnAttributes: []
      });

      this.logger.log(`Index "${this.indexName}" initialized with configuration`);
    } catch (error) {
      this.logger.error('Failed to initialize Meilisearch index', error);
      throw error;
    }
  }

  /**
   * Index a single book document with page-specific content
   */
  async indexBook(book: BookAggregate, fullTextContent?: string, pageContents?: Array<{pageNumber: number, textContent: string}>): Promise<void> {
    if (!this.enabled || !this.index) {
      return;
    }

    try {
      const documents: BookSearchDocument[] = [];

      if (pageContents && pageContents.length > 0) {
        // Index each page as a separate document
        pageContents.forEach(pageContent => {
          documents.push({
            id: `${book.id.value}-page-${pageContent.pageNumber}`,
            bookId: book.id.value,
            title: book.metadata.title,
            author: book.metadata.author,
            subject: book.metadata.subject || '',
            keywords: book.metadata.keywords || '',
            content: pageContent.textContent,
            pageNumber: pageContent.pageNumber,
            filePath: book.filePath,
            fileSize: book.fileSize,
            totalPages: book.totalPages || 0,
            addedAt: book.addedAt.toISOString(),
            lastOpened: book.lastOpened?.toISOString(),
          });
        });
      } else {
        // Fallback: index as single document if no page contents
        documents.push({
          id: book.id.value,
          bookId: book.id.value,
          title: book.metadata.title,
          author: book.metadata.author,
          subject: book.metadata.subject || '',
          keywords: book.metadata.keywords || '',
          content: fullTextContent || book.searchableText || '',
          pageNumber: undefined,
          filePath: book.filePath,
          fileSize: book.fileSize,
          totalPages: book.totalPages || 0,
          addedAt: book.addedAt.toISOString(),
          lastOpened: book.lastOpened?.toISOString(),
        });
      }

      await this.index.addDocuments(documents);
      this.logger.debug(`Indexed book with ${documents.length} documents: ${book.metadata.title}`);
    } catch (error) {
      this.logger.error(`Failed to index book: ${book.metadata.title}`, error);
      throw error;
    }
  }

  /**
   * Index multiple books in batch
   */
  async indexBooks(books: Array<{ book: BookAggregate; fullTextContent?: string }>): Promise<void> {
    if (!this.enabled || !this.index || books.length === 0) {
      return;
    }

    try {
      const documents: BookSearchDocument[] = books.map(({ book, fullTextContent }) => ({
        id: book.id.value,
        bookId: book.id.value,
        title: book.metadata.title,
        author: book.metadata.author,
        subject: book.metadata.subject || '',
        keywords: book.metadata.keywords || '',
        content: fullTextContent || book.searchableText || '',
        pageNumber: undefined,
        filePath: book.filePath,
        fileSize: book.fileSize,
        totalPages: book.totalPages || 0,
        addedAt: book.addedAt.toISOString(),
        lastOpened: book.lastOpened?.toISOString(),
      }));

      const task = await this.index.addDocuments(documents);
      this.logger.log(`Batch indexed ${documents.length} books (task ${task.taskUid})`);
    } catch (error) {
      this.logger.error(`Failed to batch index books`, error);
      throw error;
    }
  }

  /**
   * Search for books with advanced options
   */
  async searchBooks(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    if (!this.enabled || !this.index) {
      return {
        hits: [],
        query,
        processingTimeMs: 0,
        limit: options.limit || 20,
        offset: options.offset || 0,
        estimatedTotalHits: 0,
      };
    }

    try {
      const searchResult = await this.index.search(query, {
        limit: options.limit || 20,
        offset: options.offset || 0,
        filter: options.filter,
        sort: options.sort,
        attributesToHighlight: ['title', 'author', 'content'],
        highlightPreTag: options.highlightPreTag || '<em>',
        highlightPostTag: options.highlightPostTag || '</em>',
        attributesToCrop: ['content'],
        cropLength: options.cropLength || 200,
        showMatchesPosition: options.showMatchesPosition || false,
        attributesToRetrieve: ['*'],
      });

      // Extract snippets from highlighted content
      const hits: SearchHit[] = searchResult.hits.map((hit: any) => ({
        ...hit,
        _score: hit._rankingScore,
        _snippets: hit._formatted?.content ? [hit._formatted.content] : [],
      }));

      return {
        hits,
        query: searchResult.query,
        processingTimeMs: searchResult.processingTimeMs,
        limit: searchResult.limit,
        offset: searchResult.offset,
        estimatedTotalHits: searchResult.estimatedTotalHits,
      };
    } catch (error) {
      this.logger.error(`Search failed for query: "${query}"`, error);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(query: string, limit = 5): Promise<string[]> {
    if (!this.enabled || !this.index) {
      return [];
    }

    try {
      // Use search with a small limit to get suggestions
      const searchResult = await this.index.search(query, {
        limit,
        attributesToRetrieve: ['title', 'author'],
        attributesToHighlight: [],
      });

      // Extract unique suggestions from titles and authors
      const suggestions = new Set<string>();
      
      searchResult.hits.forEach((hit: any) => {
        if (hit.title) suggestions.add(hit.title);
        if (hit.author) suggestions.add(hit.author);
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get suggestions for: "${query}"`, error);
      return [];
    }
  }

  /**
   * Update a book document
   */
  async updateBook(book: BookAggregate, fullTextContent?: string): Promise<void> {
    // For Meilisearch, update is the same as add (upsert behavior)
    await this.indexBook(book, fullTextContent);
  }

  /**
   * Delete a book document and all its page-based documents
   */
  async deleteBook(bookId: string): Promise<void> {
    if (!this.enabled || !this.index) {
      return;
    }

    try {
      // Delete all documents related to this book (both main document and page-based documents)
      // First try to find all documents with this bookId
      const searchResult = await this.index.search('', {
        filter: [`bookId = "${bookId}"`],
        limit: 10000, // High limit to get all pages
        attributesToRetrieve: ['id']
      });

      if (searchResult.hits.length > 0) {
        // Extract document IDs and delete them in batch
        const documentIds = searchResult.hits.map((hit: any) => hit.id);
        await this.index.deleteDocuments(documentIds);
        this.logger.debug(`Deleted ${documentIds.length} documents for book: ${bookId}`);
      } else {
        // Fallback: try to delete the main document
        await this.index.deleteDocument(bookId);
        this.logger.debug(`Deleted main document for book: ${bookId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete book from index: ${bookId}`, error);
      // Don't throw error to prevent blocking the deletion process
    }
  }

  /**
   * Clear all documents from the index
   */
  async clearIndex(): Promise<void> {
    if (!this.enabled || !this.index) {
      return;
    }

    try {
      await this.index.deleteAllDocuments();
      this.logger.warn('Cleared all documents from search index');
    } catch (error) {
      this.logger.error('Failed to clear search index', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<any> {
    if (!this.enabled || !this.index) {
      return null;
    }

    try {
      const stats = await this.index.getStats();
      return {
        numberOfDocuments: stats.numberOfDocuments,
        isIndexing: stats.isIndexing,
        fieldDistribution: stats.fieldDistribution,
      };
    } catch (error) {
      this.logger.error('Failed to get index stats', error);
      return null;
    }
  }
}