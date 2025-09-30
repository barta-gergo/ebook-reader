import { TocItem } from '../entities/toc-item.entity';
import { BookId } from '../value-objects';

export interface TocItemRepository {
  save(tocItem: TocItem): Promise<TocItem>;
  findById(id: string): Promise<TocItem | null>;
  findByBookId(bookId: BookId): Promise<TocItem[]>;
  findRootItemsByBookId(bookId: BookId): Promise<TocItem[]>;
  findChildrenByParentId(parentId: string): Promise<TocItem[]>;
  deleteByBookId(bookId: BookId): Promise<void>;
  delete(id: string): Promise<void>;
}