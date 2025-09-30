import { Bookmark } from '../entities/bookmark.entity';
import { BookId, UserId } from '../value-objects';

export interface BookmarkRepository {
  save(bookmark: Bookmark): Promise<Bookmark>;
  findById(id: string): Promise<Bookmark | null>;
  findByBookId(bookId: BookId): Promise<Bookmark[]>;
  findByUserId(userId: UserId): Promise<Bookmark[]>;
  findByBookIdAndUserId(bookId: BookId, userId: UserId): Promise<Bookmark[]>;
  delete(id: string): Promise<void>;
  deleteAllByBookId(bookId: BookId): Promise<void>;
  deleteAllByUserId(userId: UserId): Promise<void>;
}
