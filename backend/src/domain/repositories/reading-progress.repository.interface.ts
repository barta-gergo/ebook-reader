import { ReadingProgress } from '../entities/reading-progress.entity';

export interface ReadingProgressRepository {
  findById(id: string): Promise<ReadingProgress | null>;
  findByBookId(bookId: string): Promise<ReadingProgress | null>;
  save(progress: ReadingProgress): Promise<ReadingProgress>;
  delete(id: string): Promise<void>;
  deleteByBookId(bookId: string): Promise<void>;
  findRecentlyRead(limit: number): Promise<ReadingProgress[]>;
}