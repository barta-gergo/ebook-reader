import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookId } from '../../../domain/value-objects';

@Injectable()
export class GetReadingProgressQuery {
  constructor(
    private readonly bookApplicationService: BookAggregateApplicationService,
  ) {}

  async execute(bookId: string) {
    const book = await this.bookApplicationService.getBookById(BookId.fromString(bookId));
    if (!book || !book.readingProgress) {
      return null;
    }
    
    const progress = book.readingProgress;
    return {
      id: progress.id,
      bookId: book.id.value,
      currentPage: progress.currentPage,
      scrollPosition: progress.scrollPosition,
      progressPercentage: progress.progressPercentage,
      lastUpdated: progress.lastUpdated,
      readingTimeMinutes: progress.readingTimeMinutes,
    };
  }
}