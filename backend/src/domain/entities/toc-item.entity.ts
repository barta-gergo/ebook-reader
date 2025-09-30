import { AggregateRoot } from '../events/aggregate-root';
import { BookId } from '../value-objects';

export class TocItem extends AggregateRoot {
  constructor(
    public readonly id: string,
    public readonly bookId: BookId,
    public readonly title: string,
    public readonly page: number,
    public readonly level: number,
    public readonly parentId?: string,
    public readonly order?: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    super();
  }

  static create(
    id: string,
    bookId: BookId,
    title: string,
    page: number,
    level: number,
    parentId?: string,
    order?: number
  ): TocItem {
    return new TocItem(id, bookId, title, page, level, parentId, order);
  }

  updateTitle(newTitle: string): TocItem {
    return new TocItem(
      this.id,
      this.bookId,
      newTitle,
      this.page,
      this.level,
      this.parentId,
      this.order,
      this.createdAt,
      new Date()
    );
  }

  updatePage(newPage: number): TocItem {
    return new TocItem(
      this.id,
      this.bookId,
      this.title,
      newPage,
      this.level,
      this.parentId,
      this.order,
      this.createdAt,
      new Date()
    );
  }
}