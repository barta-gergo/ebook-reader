import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookId } from '../../../domain/value-objects';

@Injectable()
export class MarkPageAsReadCommand {
  constructor(
    private readonly bookApplicationService: BookAggregateApplicationService,
  ) {}

  async execute(bookId: string, pageNumber: number) {
    return await this.bookApplicationService.markPageAsRead(
      BookId.fromString(bookId),
      pageNumber
    );
  }
}