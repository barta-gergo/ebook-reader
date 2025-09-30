import { ReadPage } from '../entities/read-page.entity';
import { BookId } from '../value-objects';

export interface ReadPageRepository {
  findByBookId(bookId: BookId): Promise<ReadPage[]>;
  save(readPage: ReadPage): Promise<ReadPage>;
  delete(bookId: BookId, pageNumber: number): Promise<void>;
  deleteAllByBookId(bookId: BookId): Promise<void>;
}