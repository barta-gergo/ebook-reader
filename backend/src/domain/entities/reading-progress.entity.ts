import { BookId, UserId } from '../value-objects';

export class ReadingProgress {
  constructor(
    public readonly id: string,
    public readonly bookId: BookId,
    public readonly userId: UserId,
    public readonly currentPage: number,
    public readonly scrollPosition: number,
    public readonly progressPercentage: number,
    public readonly lastUpdated: Date,
    public readonly readingTimeMinutes: number = 0,
  ) {}

  updateProgress(
    currentPage: number,
    scrollPosition: number,
    totalPages: number,
    additionalReadingTime: number = 0,
  ): ReadingProgress {
    const progressPercentage = (currentPage / totalPages) * 100;
    
    return new ReadingProgress(
      this.id,
      this.bookId,
      this.userId,
      currentPage,
      scrollPosition,
      Math.min(100, Math.max(0, progressPercentage)),
      new Date(),
      this.readingTimeMinutes + additionalReadingTime,
    );
  }

  isCompleted(): boolean {
    return this.progressPercentage >= 100;
  }
}