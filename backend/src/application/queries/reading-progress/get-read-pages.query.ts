import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookId } from '../../../domain/value-objects';

@Injectable()
export class GetReadPagesQuery {
  constructor(private readonly bookApplicationService: BookAggregateApplicationService) {}

  async execute(bookId: string): Promise<{ readPages: number[] }> {
    const book = await this.bookApplicationService.getBookById(BookId.fromString(bookId));
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }
    
    return { readPages: book.readPages.getReadPages() };
  }
}