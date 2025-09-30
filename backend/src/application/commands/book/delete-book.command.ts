import { Injectable, Logger } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookId } from '../../../domain/value-objects';

@Injectable()
export class DeleteBookCommand {
  private readonly logger = new Logger(DeleteBookCommand.name);

  constructor(
    private readonly bookApplicationService: BookAggregateApplicationService,
  ) {}

  async execute(bookId: string): Promise<void> {
    await this.bookApplicationService.deleteBook(BookId.fromString(bookId));
  }
}