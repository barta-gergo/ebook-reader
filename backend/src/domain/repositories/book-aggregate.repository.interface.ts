import { BookAggregate } from '../aggregates/book.aggregate';
import { BookId, UserId } from '../value-objects';

/**
 * Repository interface for the Book Aggregate
 * Follows proper DDD repository pattern for aggregates
 */
export interface BookAggregateRepository {
  /**
   * Find a book aggregate by its ID
   */
  findById(id: BookId): Promise<BookAggregate | null>;

  /**
   * Find all book aggregates
   */
  findAll(): Promise<BookAggregate[]>;

  /**
   * Find all book aggregates for a specific user
   */
  findAllByUserId(userId: UserId): Promise<BookAggregate[]>;

  /**
   * Save a book aggregate (handles both create and update)
   */
  save(book: BookAggregate): Promise<BookAggregate>;

  /**
   * Delete a book aggregate
   */
  delete(id: BookId): Promise<void>;

  /**
   * Find books by metadata criteria
   */
  findByTitle(title: string): Promise<BookAggregate[]>;
  findByAuthor(author: string): Promise<BookAggregate[]>;
  findByTitleAndUserId(title: string, userId: UserId): Promise<BookAggregate[]>;
  findByAuthorAndUserId(author: string, userId: UserId): Promise<BookAggregate[]>;

  /**
   * Find books with specific characteristics
   */
  findCompleted(): Promise<BookAggregate[]>;
  findInProgress(): Promise<BookAggregate[]>;
  findByProgressRange(minPercent: number, maxPercent: number): Promise<BookAggregate[]>;
  findCompletedByUserId(userId: UserId): Promise<BookAggregate[]>;
  findInProgressByUserId(userId: UserId): Promise<BookAggregate[]>;
  findByProgressRangeAndUserId(minPercent: number, maxPercent: number, userId: UserId): Promise<BookAggregate[]>;

  /**
   * Check if a book exists
   */
  exists(id: BookId): Promise<boolean>;
  existsForUser(id: BookId, userId: UserId): Promise<boolean>;

  /**
   * Count total books
   */
  count(): Promise<number>;
  countByUserId(userId: UserId): Promise<number>;
}