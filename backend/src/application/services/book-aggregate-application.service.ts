import { Injectable, Logger, Inject } from '@nestjs/common';
import { BookAggregate } from '../../domain/aggregates/book.aggregate';
import { BookAggregateRepository } from '../../domain/repositories/book-aggregate.repository.interface';
import { BookId, UserId, BookMetadata } from '../../domain/value-objects';
import { TableOfContents } from '../../domain/value-objects/table-of-contents.value-object';
import { BookDomainService } from '../../domain/services/book-domain.service';
import { SearchService } from '../../domain/services/search.interface';
import { TextIndexingService } from '../../domain/services/text-indexing.interface';
import { PdfMetadataService } from '../../domain/services/pdf-metadata.interface';
import { FileSystemService } from '../../domain/services/file-system.interface';
import { TocExtractionService } from '../../domain/services/toc-extraction.interface';
import { 
  BOOK_AGGREGATE_REPOSITORY,
  SEARCH_SERVICE, 
  TEXT_INDEXING_SERVICE, 
  PDF_METADATA_SERVICE, 
  FILE_SYSTEM_SERVICE,
  TOC_EXTRACTION_SERVICE 
} from '../../domain/repositories/tokens';

/**
 * Proper Application Service for Book Aggregate
 * Orchestrates use cases and coordinates with infrastructure
 */
@Injectable()
export class BookAggregateApplicationService {
  private readonly logger = new Logger(BookAggregateApplicationService.name);
  private readonly activityLogger = new Logger('UserActivity');

  constructor(
    @Inject(BOOK_AGGREGATE_REPOSITORY)
    private readonly bookRepository: BookAggregateRepository,
    @Inject(SEARCH_SERVICE)
    private readonly searchService: SearchService,
    @Inject(TEXT_INDEXING_SERVICE)
    private readonly textIndexingService: TextIndexingService,
    @Inject(PDF_METADATA_SERVICE)
    private readonly pdfMetadataService: PdfMetadataService,
    @Inject(FILE_SYSTEM_SERVICE)
    private readonly fileSystemService: FileSystemService,
    @Inject(TOC_EXTRACTION_SERVICE)
    private readonly tocExtractionService: TocExtractionService,
  ) {}

  /**
   * Use Case: Upload and process a new book
   */
  async uploadBook(file: Express.Multer.File, userId: UserId): Promise<BookAggregate> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    let extractedMetadata: any = null;

    try {
      // 1. Extract PDF metadata
      extractedMetadata = await this.pdfMetadataService.extractMetadata(file.path);
      
      // 2. Create searchable index from full text
      const searchableText = extractedMetadata.textContent 
        ? this.textIndexingService.createSearchableIndex(extractedMetadata.textContent)
        : undefined;

      // 3. Create metadata value object
      const metadata = BookMetadata.create({
        title: extractedMetadata.title || file.originalname.replace('.pdf', ''),
        author: extractedMetadata.author || 'Unknown Author',
        subject: extractedMetadata.subject,
        keywords: extractedMetadata.keywords,
        creator: extractedMetadata.creator,
        producer: extractedMetadata.producer,
        creationDate: extractedMetadata.creationDate,
        modificationDate: extractedMetadata.modificationDate,
        version: extractedMetadata.version,
      });

      // 4. Use domain service for validation
      BookDomainService.validateBookCreationData(
        metadata.title,
        metadata.author,
        file.path,
        file.size,
        file.mimetype,
        extractedMetadata.pages || 0
      );

      // 5. Create book aggregate
      const book = BookAggregate.create(
        userId,
        metadata,
        file.path,
        file.size,
        file.mimetype,
        extractedMetadata.pages || 0,
        extractedMetadata.textLength,
        searchableText,
      );

      // 6. Add table of contents if available
      let bookWithToc = book;
      if (extractedMetadata.outline && extractedMetadata.outline.length > 0) {
        const toc = BookDomainService.createTableOfContentsFromExternal(extractedMetadata.outline);
        bookWithToc = book.setTableOfContents(toc);
      }

      // 7. Save to repository
      const savedBook = await this.bookRepository.save(bookWithToc);
      
      // 8. Index for search (infrastructure concern)
      try {
        if (extractedMetadata?.textContent) {
          await this.searchService.indexBook(
            savedBook, 
            extractedMetadata.textContent, 
            extractedMetadata.pageContents
          );
          this.logger.log(`Successfully indexed book "${savedBook.metadata.title}"`);
        }
      } catch (error) {
        this.logger.error(`Failed to index book "${savedBook.metadata.title}":`, error);
        // Don't fail the upload if indexing fails
      }

      return savedBook;

    } catch (error) {
      this.logger.error('Error processing PDF:', error);
      
      // Fallback book creation with minimal data
      const fallbackMetadata = BookMetadata.create({
        title: file.originalname.replace('.pdf', ''),
        author: 'Unknown Author',
      });

      const fallbackBook = BookAggregate.create(
        userId,
        fallbackMetadata,
        file.path,
        file.size,
        file.mimetype,
        0
      );

      return await this.bookRepository.save(fallbackBook);
    }
  }

  /**
   * Use Case: Open a book (updates last opened timestamp)
   */
  async openBook(bookId: BookId): Promise<BookAggregate> {
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId.value} not found`);
    }

    const openedBook = book.open();
    return await this.bookRepository.save(openedBook);
  }

  /**
   * Use Case: Update reading progress
   */
  async updateReadingProgress(
    bookId: BookId,
    currentPage: number,
    scrollPosition: number,
    additionalReadingTime: number = 0,
  ): Promise<BookAggregate> {
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId.value} not found`);
    }

    const updatedBook = book.updateReadingProgress(currentPage, scrollPosition, additionalReadingTime);
    return await this.bookRepository.save(updatedBook);
  }

  /**
   * Use Case: Mark page as read
   */
  async markPageAsRead(bookId: BookId, pageNumber: number): Promise<BookAggregate> {
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId.value} not found`);
    }

    const updatedBook = book.markPageAsRead(pageNumber);
    return await this.bookRepository.save(updatedBook);
  }

  /**
   * Use Case: Unmark page as read
   */
  async unmarkPageAsRead(bookId: BookId, pageNumber: number): Promise<BookAggregate> {
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId.value} not found`);
    }

    const updatedBook = book.unmarkPageAsRead(pageNumber);
    return await this.bookRepository.save(updatedBook);
  }

  /**
   * Use Case: Delete book with all related data
   */
  async deleteBook(bookId: BookId): Promise<void> {
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId.value} not found`);
    }

    // Business rule check
    if (!book.canBeDeleted()) {
      throw new Error('Book cannot be deleted due to business rules');
    }

    // Remove from search index
    try {
      await this.searchService.deleteBook(bookId.value);
    } catch (error) {
      this.logger.error(`Failed to remove book from search index:`, error);
    }

    // Delete physical file
    try {
      if (await this.fileSystemService.fileExists(book.filePath)) {
        await this.fileSystemService.deleteFile(book.filePath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file:`, error);
    }

    // Mark as deleted (fires domain event)
    book.delete();

    // Delete from repository
    await this.bookRepository.delete(bookId);
  }

  /**
   * Use Case: Get all books
   */
  async getAllBooks(): Promise<BookAggregate[]> {
    return await this.bookRepository.findAll();
  }

  /**
   * Use Case: Get all books for a specific user
   */
  async getAllBooksByUser(userId: UserId): Promise<BookAggregate[]> {
    return await this.bookRepository.findAllByUserId(userId);
  }

  /**
   * Use Case: Get book by ID
   */
  async getBookById(bookId: BookId): Promise<BookAggregate | null> {
    return await this.bookRepository.findById(bookId);
  }

  /**
   * Use Case: Search books by title
   */
  async searchBooksByTitle(title: string): Promise<BookAggregate[]> {
    return await this.bookRepository.findByTitle(title);
  }

  /**
   * Use Case: Search books by title for a specific user
   */
  async searchBooksByTitleForUser(title: string, userId: UserId): Promise<BookAggregate[]> {
    return await this.bookRepository.findByTitleAndUserId(title, userId);
  }

  /**
   * Use Case: Search books by author
   */
  async searchBooksByAuthor(author: string): Promise<BookAggregate[]> {
    return await this.bookRepository.findByAuthor(author);
  }

  /**
   * Use Case: Search books by author for a specific user
   */
  async searchBooksByAuthorForUser(author: string, userId: UserId): Promise<BookAggregate[]> {
    return await this.bookRepository.findByAuthorAndUserId(author, userId);
  }

  /**
   * Use Case: Get books by progress status
   */
  async getBooksByProgressStatus(status: 'completed' | 'in-progress' | 'not-started'): Promise<BookAggregate[]> {
    switch (status) {
      case 'completed':
        return await this.bookRepository.findCompleted();
      case 'in-progress':
        return await this.bookRepository.findInProgress();
      case 'not-started':
        return await this.bookRepository.findByProgressRange(0, 0);
      default:
        throw new Error(`Invalid status: ${status}`);
    }
  }

  /**
   * Use Case: Get books by progress status for a specific user
   */
  async getBooksByProgressStatusForUser(status: 'completed' | 'in-progress' | 'not-started', userId: UserId): Promise<BookAggregate[]> {
    switch (status) {
      case 'completed':
        return await this.bookRepository.findCompletedByUserId(userId);
      case 'in-progress':
        return await this.bookRepository.findInProgressByUserId(userId);
      case 'not-started':
        return await this.bookRepository.findByProgressRangeAndUserId(0, 0, userId);
      default:
        throw new Error(`Invalid status: ${status}`);
    }
  }

  /**
   * Use Case: Add a book manually (for direct book creation)
   */
  async addBook(
    userId: UserId,
    title: string,
    author: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
    totalPages: number,
    subject?: string,
    keywords?: string,
    creator?: string,
    producer?: string,
    creationDate?: Date,
    modificationDate?: Date,
    version?: string,
    textLength?: number,
    searchableText?: string,
  ): Promise<BookAggregate> {
    const metadata = BookMetadata.create({
      title,
      author,
      subject,
      keywords,
      creator,
      producer,
      creationDate,
      modificationDate,
      version,
    });

    const book = BookAggregate.create(
      userId,
      metadata,
      filePath,
      fileSize,
      mimeType,
      totalPages,
      textLength,
      searchableText,
    );

    return await this.bookRepository.save(book);
  }

  /**
   * Use Case: Reindex all books for search
   */
  async reindexAllBooks(): Promise<void> {
    this.logger.log('Starting reindexing of all books...');
    
    const books = await this.bookRepository.findAll();
    
    await this.searchService.clearIndex();
    
    for (const book of books) {
      try {
        const metadata = await this.pdfMetadataService.extractMetadata(book.filePath);
        
        await this.searchService.indexBook(
          book,
          metadata.textContent,
          metadata.pageContents
        );
        
        this.logger.log(`Reindexed book: ${book.metadata.title}`);
      } catch (error) {
        this.logger.error(`Failed to reindex book ${book.metadata.title}:`, error);
      }
    }
    
    this.logger.log(`Completed reindexing ${books.length} books`);
  }

  /**
   * Use Case: Bulk delete books for a user
   */
  async bulkDeleteBooksForUser(bookIds: BookId[], userId: UserId): Promise<{ success: string[], failed: Array<{ bookId: string, error: string }> }> {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ bookId: string, error: string }>
    };

    for (const bookId of bookIds) {
      try {
        const book = await this.bookRepository.findById(bookId);
        if (!book) {
          results.failed.push({ bookId: bookId.value, error: 'Book not found' });
          continue;
        }

        // Verify the book belongs to the user
        if (book.userId.value !== userId.value) {
          results.failed.push({ bookId: bookId.value, error: 'Access denied - book does not belong to user' });
          continue;
        }

        await this.deleteBook(bookId);
        results.success.push(bookId.value);
        this.logger.log(`Successfully deleted book ${bookId.value} for user ${userId.value}`);
      } catch (error) {
        results.failed.push({ bookId: bookId.value, error: error.message });
        this.logger.error(`Failed to delete book ${bookId.value}:`, error);
      }
    }

    return results;
  }

  /**
   * Use Case: Bulk update reading progress for multiple books
   */
  async bulkUpdateReadingProgress(
    updates: Array<{ bookId: BookId, currentPage: number, scrollPosition: number, readingTime?: number }>,
    userId: UserId
  ): Promise<{ success: string[], failed: Array<{ bookId: string, error: string }> }> {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ bookId: string, error: string }>
    };

    for (const update of updates) {
      try {
        const book = await this.bookRepository.findById(update.bookId);
        if (!book) {
          results.failed.push({ bookId: update.bookId.value, error: 'Book not found' });
          continue;
        }

        // Verify the book belongs to the user
        if (book.userId.value !== userId.value) {
          results.failed.push({ bookId: update.bookId.value, error: 'Access denied - book does not belong to user' });
          continue;
        }

        await this.updateReadingProgress(
          update.bookId,
          update.currentPage,
          update.scrollPosition,
          update.readingTime || 0
        );
        results.success.push(update.bookId.value);
      } catch (error) {
        results.failed.push({ bookId: update.bookId.value, error: error.message });
        this.logger.error(`Failed to update reading progress for book ${update.bookId.value}:`, error);
      }
    }

    return results;
  }

  /**
   * Use Case: Get user statistics summary
   */
  async getUserStatistics(userId: UserId): Promise<{
    totalBooks: number;
    completedBooks: number;
    inProgressBooks: number;
    notStartedBooks: number;
    totalReadingTime: number;
    totalPages: number;
    averageProgress: number;
  }> {
    const allBooks = await this.bookRepository.findAllByUserId(userId);
    const completedBooks = await this.bookRepository.findCompletedByUserId(userId);
    const inProgressBooks = await this.bookRepository.findInProgressByUserId(userId);
    const notStartedBooks = await this.bookRepository.findByProgressRangeAndUserId(0, 0, userId);

    const totalReadingTime = allBooks.reduce((total, book) => {
      return total + (book.readingProgress?.readingTimeMinutes || 0);
    }, 0);

    const totalPages = allBooks.reduce((total, book) => total + book.totalPages, 0);
    
    const totalProgress = allBooks.reduce((total, book) => {
      return total + (book.readingProgress?.progressPercentage || 0);
    }, 0);
    
    const averageProgress = allBooks.length > 0 ? totalProgress / allBooks.length : 0;

    return {
      totalBooks: allBooks.length,
      completedBooks: completedBooks.length,
      inProgressBooks: inProgressBooks.length,
      notStartedBooks: notStartedBooks.length,
      totalReadingTime,
      totalPages,
      averageProgress
    };
  }

  /**
   * Use Case: Count books by user
   */
  async countBooksByUser(userId: UserId): Promise<number> {
    return await this.bookRepository.countByUserId(userId);
  }

  /**
   * Use Case: Export all user data for backup/migration
   */
  async exportUserData(userId: UserId): Promise<{
    user: any;
    books: Array<{
      metadata: any;
      readingProgress: any;
      readPages: number[];
      tocItems: any[];
      fileInfo: {
        originalName: string;
        size: number;
        mimeType: string;
        totalPages: number;
      };
    }>;
    statistics: any;
    exportedAt: Date;
  }> {
    const books = await this.bookRepository.findAllByUserId(userId);
    const statistics = await this.getUserStatistics(userId);

    const exportData = {
      user: {
        id: userId.value,
      },
      books: books.map(book => ({
        id: book.id.value,
        metadata: {
          title: book.metadata.title,
          author: book.metadata.author,
          subject: book.metadata.subject,
          keywords: book.metadata.keywords,
          creator: book.metadata.creator,
          producer: book.metadata.producer,
          creationDate: book.metadata.creationDate,
          modificationDate: book.metadata.modificationDate,
          version: book.metadata.version,
        },
        readingProgress: book.readingProgress ? {
          currentPage: book.readingProgress.currentPage,
          scrollPosition: book.readingProgress.scrollPosition,
          progressPercentage: book.readingProgress.progressPercentage,
          readingTimeMinutes: book.readingProgress.readingTimeMinutes,
          lastUpdated: book.readingProgress.lastUpdated,
        } : null,
        readPages: book.readPages?.getReadPages() || [],
        tocItems: book.tableOfContents?.getEntries()?.map(item => ({
          title: item.title,
          page: item.page,
          level: item.level,
        })) || [],
        fileInfo: {
          originalName: book.metadata.title + '.pdf',
          size: book.fileSize,
          mimeType: book.mimeType,
          totalPages: book.totalPages,
        },
        addedAt: book.addedAt,
        lastOpenedAt: book.lastOpened,
      })),
      statistics,
      exportedAt: new Date(),
    };

    this.logger.log(`Exported data for user ${userId.value}: ${books.length} books`);
    return exportData;
  }

  /**
   * Use Case: Import user data (for migration/restoration)
   * Note: This only imports metadata and progress, not actual PDF files
   */
  async importUserDataMetadata(userId: UserId, importData: {
    books: Array<{
      metadata: any;
      readingProgress?: any;
      readPages?: number[];
      tocItems?: any[];
      fileInfo: any;
      addedAt?: Date;
      lastOpenedAt?: Date;
    }>;
  }): Promise<{
    imported: number;
    failed: Array<{ title: string, error: string }>;
    warnings: string[];
  }> {
    const results = {
      imported: 0,
      failed: [] as Array<{ title: string, error: string }>,
      warnings: [] as string[]
    };

    for (const bookData of importData.books) {
      try {
        // Create metadata
        const metadata = BookMetadata.create({
          title: bookData.metadata.title,
          author: bookData.metadata.author,
          subject: bookData.metadata.subject,
          keywords: bookData.metadata.keywords,
          creator: bookData.metadata.creator,
          producer: bookData.metadata.producer,
          creationDate: bookData.metadata.creationDate ? new Date(bookData.metadata.creationDate) : undefined,
          modificationDate: bookData.metadata.modificationDate ? new Date(bookData.metadata.modificationDate) : undefined,
          version: bookData.metadata.version,
        });

        // Note: We create a placeholder file path since we don't have the actual file
        const placeholderPath = `/imported/${userId.value}/${bookData.metadata.title}.pdf`;
        
        const book = BookAggregate.create(
          userId,
          metadata,
          placeholderPath,
          bookData.fileInfo.size || 0,
          bookData.fileInfo.mimeType || 'application/pdf',
          bookData.fileInfo.totalPages || 0,
          0, // textLength
          undefined, // searchableText
        );

        // Restore reading progress if available
        let bookWithProgress = book;
        if (bookData.readingProgress) {
          bookWithProgress = book.updateReadingProgress(
            bookData.readingProgress.currentPage,
            bookData.readingProgress.scrollPosition,
            bookData.readingProgress.readingTimeMinutes || 0
          );
        }

        // Restore read pages if available
        let bookWithReadPages = bookWithProgress;
        if (bookData.readPages && bookData.readPages.length > 0) {
          for (const pageNumber of bookData.readPages) {
            bookWithReadPages = bookWithReadPages.markPageAsRead(pageNumber);
          }
        }

        // Restore TOC if available
        let bookWithToc = bookWithReadPages;
        if (bookData.tocItems && bookData.tocItems.length > 0) {
          const toc = BookDomainService.createTableOfContentsFromExternal(bookData.tocItems);
          bookWithToc = bookWithReadPages.setTableOfContents(toc);
        }

        // Save the book
        await this.bookRepository.save(bookWithToc);
        results.imported++;
        results.warnings.push(`Book "${bookData.metadata.title}" imported as metadata only - PDF file needs to be re-uploaded`);

      } catch (error) {
        results.failed.push({ 
          title: bookData.metadata?.title || 'Unknown', 
          error: error.message 
        });
        this.logger.error(`Failed to import book "${bookData.metadata?.title}":`, error);
      }
    }

    this.logger.log(`Import completed for user ${userId.value}: ${results.imported} books imported, ${results.failed.length} failed`);
    return results;
  }

  /**
   * Use Case: Delete all user data (books, progress, files)
   */
  async deleteAllUserData(userId: UserId): Promise<{
    deletedBooks: number;
    deletedFiles: number;
    errors: string[];
  }> {
    const results = {
      deletedBooks: 0,
      deletedFiles: 0,
      errors: [] as string[]
    };

    try {
      // Get all user books
      const books = await this.bookRepository.findAllByUserId(userId);
      
      this.logger.log(`Starting deletion of ${books.length} books for user ${userId.value}`);

      // Delete each book and its associated data
      for (const book of books) {
        try {
          // Delete physical file
          if (await this.fileSystemService.fileExists(book.filePath)) {
            await this.fileSystemService.deleteFile(book.filePath);
            results.deletedFiles++;
          }

          // Remove from search index
          try {
            await this.searchService.deleteBook(book.id.value);
          } catch (error) {
            this.logger.warn(`Failed to remove book from search index: ${error.message}`);
          }

          // Delete book record (this also deletes related reading progress, read pages, TOC items due to cascade)
          await this.bookRepository.delete(book.id);
          results.deletedBooks++;

        } catch (error) {
          const errorMsg = `Failed to delete book "${book.metadata.title}": ${error.message}`;
          results.errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      this.logger.log(`Completed user data deletion for ${userId.value}: ${results.deletedBooks} books, ${results.deletedFiles} files`);
      return results;

    } catch (error) {
      const errorMsg = `Failed to delete user data: ${error.message}`;
      results.errors.push(errorMsg);
      this.logger.error(errorMsg);
      return results;
    }
  }

  /**
   * Use Case: Clean up orphaned files (files without book records)
   */
  async cleanupOrphanedFiles(userId?: UserId): Promise<{
    deletedFiles: number;
    freedSpace: number;
    errors: string[];
  }> {
    const results = {
      deletedFiles: 0,
      freedSpace: 0,
      errors: [] as string[]
    };

    try {
      const books = userId 
        ? await this.bookRepository.findAllByUserId(userId)
        : await this.bookRepository.findAll();
      
      const existingFilePaths = new Set(books.map(book => book.filePath));
      
      // This would require implementing a method to scan the uploads directory
      // For now, we'll just log that cleanup is needed
      this.logger.log(`Cleanup check: Found ${books.length} books with file paths`);
      
      // TODO: Implement actual file system scanning and cleanup
      // const uploadDir = './uploads';
      // const filesInDirectory = await this.fileSystemService.listFiles(uploadDir);
      // for (const file of filesInDirectory) {
      //   if (!existingFilePaths.has(file.path)) {
      //     await this.fileSystemService.deleteFile(file.path);
      //     results.deletedFiles++;
      //     results.freedSpace += file.size;
      //   }
      // }

      return results;
    } catch (error) {
      results.errors.push(`Cleanup failed: ${error.message}`);
      return results;
    }
  }

  /**
   * Use Case: Clean up incomplete reading progress (reset stale progress)
   */
  async cleanupStaleReadingProgress(userId: UserId, daysInactive: number = 90): Promise<{
    cleanedBooks: number;
    errors: string[];
  }> {
    const results = {
      cleanedBooks: 0,
      errors: [] as string[]
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
      
      const books = await this.bookRepository.findAllByUserId(userId);
      
      for (const book of books) {
        try {
          if (book.readingProgress?.lastUpdated && book.readingProgress.lastUpdated < cutoffDate) {
            // For stale books, we would reset progress - but since there's no reset method,
            // we'll just log it
            results.cleanedBooks++;
            this.logger.log(`Identified stale reading progress for book: ${book.metadata.title}`);
          }
        } catch (error) {
          results.errors.push(`Failed to clean progress for "${book.metadata.title}": ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      results.errors.push(`Cleanup failed: ${error.message}`);
      return results;
    }
  }

  /**
   * Use Case: Remove duplicate books (same title and author for same user)
   */
  async removeDuplicateBooks(userId: UserId): Promise<{
    removedDuplicates: number;
    keptBooks: number;
    errors: string[];
  }> {
    const results = {
      removedDuplicates: 0,
      keptBooks: 0,
      errors: [] as string[]
    };

    try {
      const books = await this.bookRepository.findAllByUserId(userId);
      const bookMap = new Map<string, BookAggregate[]>();
      
      // Group books by title + author
      for (const book of books) {
        const key = `${book.metadata.title.toLowerCase()}-${book.metadata.author.toLowerCase()}`;
        if (!bookMap.has(key)) {
          bookMap.set(key, []);
        }
        bookMap.get(key)!.push(book);
      }

      // Remove duplicates, keeping the most recently added or with most progress
      for (const [key, duplicateBooks] of bookMap) {
        if (duplicateBooks.length > 1) {
          // Sort by progress percentage (desc), then by addedAt (desc)
          duplicateBooks.sort((a, b) => {
            const progressDiff = (b.readingProgress?.progressPercentage || 0) - (a.readingProgress?.progressPercentage || 0);
            if (progressDiff !== 0) return progressDiff;
            return b.addedAt.getTime() - a.addedAt.getTime();
          });

          // Keep the first one (best progress or most recent), delete the rest
          const [keepBook, ...duplicatesToRemove] = duplicateBooks;
          results.keptBooks++;

          for (const duplicateBook of duplicatesToRemove) {
            try {
              await this.deleteBook(duplicateBook.id);
              results.removedDuplicates++;
              this.logger.log(`Removed duplicate book: ${duplicateBook.metadata.title}`);
            } catch (error) {
              results.errors.push(`Failed to remove duplicate "${duplicateBook.metadata.title}": ${error.message}`);
            }
          }
        } else {
          results.keptBooks++;
        }
      }

      return results;
    } catch (error) {
      results.errors.push(`Duplicate removal failed: ${error.message}`);
      return results;
    }
  }

  /**
   * Use Case: Get user storage usage and quota information
   */
  async getUserStorageInfo(userId: UserId): Promise<{
    totalSizeBytes: number;
    totalSizeMB: number;
    totalBooks: number;
    averageBookSize: number;
    quotaLimitBytes: number;
    quotaLimitMB: number;
    usagePercentage: number;
    remainingBytes: number;
    remainingMB: number;
    isOverQuota: boolean;
    largestBooks: Array<{ title: string, author: string, sizeBytes: number, sizeMB: number }>;
  }> {
    const books = await this.bookRepository.findAllByUserId(userId);
    
    const totalSizeBytes = books.reduce((total, book) => total + book.fileSize, 0);
    const totalSizeMB = Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100;
    const averageBookSize = books.length > 0 ? Math.round(totalSizeBytes / books.length / 1024) : 0; // in KB
    
    // Default quota: 2GB per user (configurable)
    const quotaLimitBytes = parseInt(process.env.USER_STORAGE_QUOTA_BYTES || '2147483648'); // 2GB
    const quotaLimitMB = Math.round(quotaLimitBytes / (1024 * 1024));
    
    const usagePercentage = Math.round((totalSizeBytes / quotaLimitBytes) * 100 * 100) / 100;
    const remainingBytes = Math.max(0, quotaLimitBytes - totalSizeBytes);
    const remainingMB = Math.round(remainingBytes / (1024 * 1024) * 100) / 100;
    const isOverQuota = totalSizeBytes > quotaLimitBytes;
    
    // Get largest books for optimization suggestions
    const largestBooks = books
      .sort((a, b) => b.fileSize - a.fileSize)
      .slice(0, 5)
      .map(book => ({
        title: book.metadata.title,
        author: book.metadata.author,
        sizeBytes: book.fileSize,
        sizeMB: Math.round(book.fileSize / (1024 * 1024) * 100) / 100
      }));

    return {
      totalSizeBytes,
      totalSizeMB,
      totalBooks: books.length,
      averageBookSize,
      quotaLimitBytes,
      quotaLimitMB,
      usagePercentage,
      remainingBytes,
      remainingMB,
      isOverQuota,
      largestBooks
    };
  }

  /**
   * Use Case: Check if user can upload a file of given size
   */
  async canUserUploadFile(userId: UserId, fileSizeBytes: number): Promise<{
    canUpload: boolean;
    reason?: string;
    currentUsage: number;
    quotaLimit: number;
    wouldExceedBy?: number;
  }> {
    const storageInfo = await this.getUserStorageInfo(userId);
    
    const afterUploadSize = storageInfo.totalSizeBytes + fileSizeBytes;
    const canUpload = afterUploadSize <= storageInfo.quotaLimitBytes;
    
    const result = {
      canUpload,
      currentUsage: storageInfo.totalSizeBytes,
      quotaLimit: storageInfo.quotaLimitBytes,
    };

    if (!canUpload) {
      const wouldExceedBy = afterUploadSize - storageInfo.quotaLimitBytes;
      return {
        ...result,
        reason: `Upload would exceed storage quota by ${Math.round(wouldExceedBy / (1024 * 1024) * 100) / 100} MB`,
        wouldExceedBy
      };
    }

    return result;
  }

  /**
   * Use Case: Get storage optimization suggestions
   */
  async getStorageOptimizationSuggestions(userId: UserId): Promise<{
    totalPotentialSavings: number;
    suggestions: Array<{
      type: 'duplicate' | 'stale' | 'large';
      description: string;
      potentialSavingsMB: number;
      actionCount: number;
    }>;
  }> {
    const books = await this.bookRepository.findAllByUserId(userId);
    const suggestions = [];
    let totalPotentialSavings = 0;

    // Check for duplicates
    const bookMap = new Map<string, BookAggregate[]>();
    for (const book of books) {
      const key = `${book.metadata.title.toLowerCase()}-${book.metadata.author.toLowerCase()}`;
      if (!bookMap.has(key)) {
        bookMap.set(key, []);
      }
      bookMap.get(key)!.push(book);
    }

    let duplicateSize = 0;
    let duplicateCount = 0;
    for (const [key, duplicateBooks] of bookMap) {
      if (duplicateBooks.length > 1) {
        // Calculate size of all but the largest/best progress book
        duplicateBooks.sort((a, b) => {
          const progressDiff = (b.readingProgress?.progressPercentage || 0) - (a.readingProgress?.progressPercentage || 0);
          if (progressDiff !== 0) return progressDiff;
          return b.fileSize - a.fileSize; // Keep larger file if progress is same
        });
        
        for (let i = 1; i < duplicateBooks.length; i++) {
          duplicateSize += duplicateBooks[i].fileSize;
          duplicateCount++;
        }
      }
    }

    if (duplicateCount > 0) {
      const savingsMB = Math.round(duplicateSize / (1024 * 1024) * 100) / 100;
      suggestions.push({
        type: 'duplicate',
        description: `Remove ${duplicateCount} duplicate books`,
        potentialSavingsMB: savingsMB,
        actionCount: duplicateCount
      });
      totalPotentialSavings += savingsMB;
    }

    // Check for stale books (no progress for 90+ days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    let staleSize = 0;
    let staleCount = 0;
    
    for (const book of books) {
      if (!book.readingProgress?.lastUpdated || book.readingProgress.lastUpdated < cutoffDate) {
        if (book.readingProgress?.progressPercentage === 0 || !book.readingProgress) {
          staleSize += book.fileSize;
          staleCount++;
        }
      }
    }

    if (staleCount > 0) {
      const savingsMB = Math.round(staleSize / (1024 * 1024) * 100) / 100;
      suggestions.push({
        type: 'stale',
        description: `Remove ${staleCount} unread books older than 90 days`,
        potentialSavingsMB: savingsMB,
        actionCount: staleCount
      });
      totalPotentialSavings += savingsMB;
    }

    // Check for very large books (>50MB)
    const largeBooks = books.filter(book => book.fileSize > 50 * 1024 * 1024);
    if (largeBooks.length > 0) {
      const largeBooksSize = largeBooks.reduce((total, book) => total + book.fileSize, 0);
      const savingsMB = Math.round(largeBooksSize / (1024 * 1024) * 100) / 100;
      suggestions.push({
        type: 'large',
        description: `Consider removing ${largeBooks.length} very large books (>50MB each)`,
        potentialSavingsMB: savingsMB,
        actionCount: largeBooks.length
      });
    }

    return {
      totalPotentialSavings: Math.round(totalPotentialSavings * 100) / 100,
      suggestions
    };
  }

  /**
   * Use Case: Log user activity
   */
  private logActivity(userId: UserId, action: string, details?: any): void {
    this.activityLogger.log({
      timestamp: new Date().toISOString(),
      userId: userId.value,
      action,
      details: details || {}
    });
  }

  /**
   * Use Case: Get user activity summary (from logs)
   */
  async getUserActivitySummary(userId: UserId): Promise<{
    totalBooks: number;
    recentActivities: Array<{
      type: string;
      count: number;
      lastActivity: Date;
    }>;
  }> {
    const books = await this.bookRepository.findAllByUserId(userId);

    // Calculate activity based on book data
    const recentlyOpenedBooks = books.filter(book => {
      if (!book.lastOpened) return false;
      const daysSinceOpened = Math.floor((Date.now() - book.lastOpened.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceOpened <= 7;
    }).length;

    const recentlyUpdatedProgress = books.filter(book => {
      if (!book.readingProgress?.lastUpdated) return false;
      const daysSinceUpdate = Math.floor((Date.now() - book.readingProgress.lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate <= 7;
    }).length;

    const recentlyAddedBooks = books.filter(book => {
      const daysSinceAdded = Math.floor((Date.now() - book.addedAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceAdded <= 7;
    }).length;

    return {
      totalBooks: books.length,
      recentActivities: [
        {
          type: 'books_opened',
          count: recentlyOpenedBooks,
          lastActivity: books.length > 0 ? books.reduce((latest, book) =>
            book.lastOpened && (!latest || book.lastOpened > latest) ? book.lastOpened : latest
          , null as Date | null) || new Date() : new Date()
        },
        {
          type: 'progress_updated',
          count: recentlyUpdatedProgress,
          lastActivity: books.length > 0 ? books.reduce((latest, book) =>
            book.readingProgress?.lastUpdated && (!latest || book.readingProgress.lastUpdated > latest) ? book.readingProgress.lastUpdated : latest
          , null as Date | null) || new Date() : new Date()
        },
        {
          type: 'books_added',
          count: recentlyAddedBooks,
          lastActivity: books.length > 0 ? books.reduce((latest, book) =>
            book.addedAt && (!latest || book.addedAt > latest) ? book.addedAt : latest
          , null as Date | null) || new Date() : new Date()
        }
      ]
    };
  }

  /**
   * Use Case: Get recently opened books with reading progress
   */
  async getRecentBooks(userId: UserId, limit: number = 10): Promise<any[]> {
    const books = await this.bookRepository.findAllByUserId(userId);

    // Filter books that have been opened and sort by lastOpened (most recent first)
    const recentBooks = books
      .filter(book => book.lastOpened !== null && book.lastOpened !== undefined)
      .sort((a, b) => {
        const dateA = a.lastOpened?.getTime() || 0;
        const dateB = b.lastOpened?.getTime() || 0;
        return dateB - dateA; // DESC order
      })
      .slice(0, limit);

    // Map to response format with reading progress
    return recentBooks.map(book => ({
      id: book.id.value,
      title: book.metadata.title,
      author: book.metadata.author,
      filePath: book.filePath,
      fileSize: book.fileSize,
      mimeType: book.mimeType,
      totalPages: book.totalPages,
      addedAt: book.addedAt,
      lastOpened: book.lastOpened,
      progress: book.readingProgress?.progressPercentage || 0,
      currentPage: book.readingProgress?.currentPage || 1,
    }));
  }

  /**
   * Use Case: Update last opened timestamp for a book
   */
  async updateLastOpened(bookId: string, userId: UserId): Promise<void> {
    const book = await this.bookRepository.findById(BookId.fromString(bookId));
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    // Verify user owns this book
    if (book.userId.value !== userId.value) {
      throw new Error('Unauthorized: Book does not belong to this user');
    }

    // Update lastOpened timestamp
    const updatedBook = book.open();
    await this.bookRepository.save(updatedBook);

    this.activityLogger.log(`User ${userId.value} opened book: ${book.metadata.title}`);
  }
}