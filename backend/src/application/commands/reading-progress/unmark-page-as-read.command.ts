import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookId } from '../../../domain/value-objects';

@Injectable()
export class UnmarkPageAsReadCommand {
  constructor(
    private readonly bookApplicationService: BookAggregateApplicationService,
  ) {}

  async execute(bookId: string, pageNumber: number) {
    return await this.bookApplicationService.unmarkPageAsRead(
      BookId.fromString(bookId),
      pageNumber
    );
  }
}