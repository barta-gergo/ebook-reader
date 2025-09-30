import { Injectable, Logger, Inject } from '@nestjs/common';
import { BookCover } from '../../domain/entities/book-cover.entity';
import { BookCoverRepository } from '../../domain/repositories/book-cover.repository.interface';
import { BOOK_COVER_REPOSITORY } from '../../domain/repositories/tokens';
import { BookId } from '../../domain/value-objects';
import { CoverFetchResult } from '../../domain/services/cover-fetcher.interface';
import { CoverFetcherOrchestratorService } from '../../infrastructure/services/cover-fetcher-orchestrator.service';

/**
 * Application Service for Book Cover operations
 * Simple approach: Single attempt, no retries
 */
@Injectable()
export class BookCoverApplicationService {
  private readonly logger = new Logger(BookCoverApplicationService.name);

  constructor(
    @Inject(BOOK_COVER_REPOSITORY)
    private readonly coverRepository: BookCoverRepository,
    private readonly orchestrator: CoverFetcherOrchestratorService,
  ) {}

  /**
   * Check if book has a cover
   */
  async hasCover(bookId: string): Promise<boolean> {
    return await this.coverRepository.exists(BookId.fromString(bookId));
  }

  /**
   * Get cover for a book
   */
  async getCover(bookId: string): Promise<BookCover | null> {
    return await this.coverRepository.findByBookId(BookId.fromString(bookId));
  }

  /**
   * Fetch and save cover for a book (single attempt)
   * Returns true if successful, false if no cover found
   */
  async fetchAndSaveCover(
    bookId: string,
    title: string,
    author?: string,
    isbn?: string,
    pdfPath?: string
  ): Promise<{ success: boolean; source?: string }> {
    try {
      this.logger.log(`🔍 Fetching cover for book: ${bookId} - "${title}"`);

      // Check if already has cover
      const exists = await this.hasCover(bookId);
      if (exists) {
        this.logger.log(`Cover already exists for book: ${bookId}`);
        return { success: true, source: 'existing' };
      }

      // Fetch from APIs
      const result = await this.orchestrator.fetchCover(title, author, isbn, pdfPath);

      if (!result.found) {
        this.logger.warn(`⚠️ No cover found for: "${title}" - saving placeholder`);
        // Save placeholder so we don't try again
        await this.savePlaceholderCover(bookId);
        return { success: false };
      }

      // Download and cache
      this.logger.log(`📥 Downloading cover from ${result.source}...`);
      const localPaths = await this.orchestrator.downloadAndCache(result, bookId);

      // Save to database
      const cover = BookCover.create(
        BookId.fromString(bookId),
        result.source as any,
        result.urls,
        localPaths,
        result.metadata
      );

      await this.coverRepository.save(cover);

      this.logger.log(`✅ Cover saved successfully for: "${title}" (source: ${result.source})`);
      return { success: true, source: result.source };

    } catch (error) {
      this.logger.error(`Failed to fetch cover for book ${bookId}: ${error.message}`);
      // Save placeholder on error so we don't retry
      await this.savePlaceholderCover(bookId);
      return { success: false };
    }
  }

  /**
   * Fetch covers for multiple books (bulk operation)
   * Only fetches for books that don't have covers yet
   */
  async fetchCoversForBooks(
    books: Array<{
      id: string;
      title: string;
      author?: string;
      isbn?: string;
    }>
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  }> {
    this.logger.log(`📚 Starting bulk cover fetch for ${books.length} books`);

    let successful = 0;
    let failed = 0;
    let skipped = 0;

    for (const book of books) {
      try {
        // Check if already has cover
        const exists = await this.hasCover(book.id);
        if (exists) {
          skipped++;
          continue;
        }

        const result = await this.fetchAndSaveCover(
          book.id,
          book.title,
          book.author,
          book.isbn
        );

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Small delay to be nice to APIs
        await this.delay(500);

      } catch (error) {
        this.logger.error(`Error processing book ${book.id}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(
      `📊 Bulk fetch complete: ${successful} successful, ${failed} failed, ${skipped} skipped`
    );

    return {
      total: books.length,
      successful,
      failed,
      skipped,
    };
  }

  /**
   * Save a placeholder cover (so we don't try to fetch again)
   */
  private async savePlaceholderCover(bookId: string): Promise<void> {
    try {
      const placeholderCover = BookCover.create(
        BookId.fromString(bookId),
        'placeholder',
        {
          thumbnail: '/assets/placeholder-cover.svg',
        },
        {},
        undefined
      );

      await this.coverRepository.save(placeholderCover);
      this.logger.log(`Placeholder cover saved for book: ${bookId}`);
    } catch (error) {
      this.logger.error(`Failed to save placeholder cover: ${error.message}`);
    }
  }

  /**
   * Get cover URL for a specific size
   */
  async getCoverUrl(
    bookId: string,
    size: 'thumbnail' | 'small' | 'medium' | 'large' = 'thumbnail'
  ): Promise<string | null> {
    const cover = await this.getCover(bookId);
    if (!cover) {
      return null;
    }

    return cover.getBestUrlForSize(size) || null;
  }

  /**
   * Delete cover for a book
   */
  async deleteCover(bookId: string): Promise<void> {
    await this.coverRepository.deleteByBookId(BookId.fromString(bookId));
    this.logger.log(`Cover deleted for book: ${bookId}`);
  }

  /**
   * Utility: delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get statistics about cached covers
   */
  async getStatistics(): Promise<{
    totalCovers: number;
    cachedCovers: number;
    placeholders: number;
  }> {
    const cachedCount = await this.coverRepository.countCached();

    // Note: This is a simplified version. In production, you'd query the database
    // to count placeholders vs real covers

    return {
      totalCovers: cachedCount,
      cachedCovers: cachedCount,
      placeholders: 0, // Would need separate query
    };
  }
}
