import { BookId, UserId } from '../value-objects';

export class ReadPage {
  constructor(
    public readonly id: string,
    public readonly bookId: BookId,
    public readonly userId: UserId,
    public readonly pageNumber: number,
    public readonly markedAt: Date,
  ) {}

  static createNew(id: string, bookId: BookId, userId: UserId, pageNumber: number): ReadPage {
    return new ReadPage(id, bookId, userId, pageNumber, new Date());
  }
}