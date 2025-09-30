import { BookCover } from '../entities/book-cover.entity';
import { BookId } from '../value-objects';

/**
 * Repository interface for BookCover entity
 */
export interface BookCoverRepository {
  /**
   * Find a book cover by book ID
   */
  findByBookId(bookId: BookId): Promise<BookCover | null>;

  /**
   * Find a book cover by its own ID
   */
  findById(id: string): Promise<BookCover | null>;

  /**
   * Save a book cover (create or update)
   */
  save(cover: BookCover): Promise<BookCover>;

  /**
   * Delete a book cover
   */
  delete(id: string): Promise<void>;

  /**
   * Delete book cover by book ID
   */
  deleteByBookId(bookId: BookId): Promise<void>;

  /**
   * Check if a book has a cover
   */
  exists(bookId: BookId): Promise<boolean>;

  /**
   * Find all covers that need refresh (older than X days)
   */
  findStaleCovers(maxAgeDays: number): Promise<BookCover[]>;

  /**
   * Count total covers cached locally
   */
  countCached(): Promise<number>;
}
