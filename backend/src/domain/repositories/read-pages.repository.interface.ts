import { ReadPages } from '../entities/read-pages.entity';

export interface ReadPagesRepository {
  findByBookId(bookId: string): Promise<ReadPages | null>;
  save(readPages: ReadPages): Promise<ReadPages>;
  delete(bookId: string): Promise<void>;
}