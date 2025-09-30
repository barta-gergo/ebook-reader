import { BookId, UserId } from '../value-objects';

export interface BookmarkProps {
  id: string;
  bookId: BookId;
  userId: UserId;
  pageNumber: number;
  scrollPosition: number;
  title?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Bookmark {
  private constructor(private readonly props: BookmarkProps) {}

  static create(
    bookId: BookId,
    userId: UserId,
    pageNumber: number,
    scrollPosition: number,
    title?: string,
    note?: string,
    id?: string
  ): Bookmark {
    return new Bookmark({
      id: id || crypto.randomUUID(),
      bookId,
      userId,
      pageNumber,
      scrollPosition,
      title,
      note,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: BookmarkProps): Bookmark {
    return new Bookmark(props);
  }

  updateTitle(title: string): Bookmark {
    return new Bookmark({
      ...this.props,
      title,
      updatedAt: new Date(),
    });
  }

  updateNote(note: string): Bookmark {
    return new Bookmark({
      ...this.props,
      note,
      updatedAt: new Date(),
    });
  }

  updatePosition(pageNumber: number, scrollPosition: number): Bookmark {
    return new Bookmark({
      ...this.props,
      pageNumber,
      scrollPosition,
      updatedAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get bookId(): BookId {
    return this.props.bookId;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get pageNumber(): number {
    return this.props.pageNumber;
  }

  get scrollPosition(): number {
    return this.props.scrollPosition;
  }

  get title(): string | undefined {
    return this.props.title;
  }

  get note(): string | undefined {
    return this.props.note;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
