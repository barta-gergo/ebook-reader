import { Injectable, Logger } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';

export interface ReindexProgress {
  totalBooks: number;
  processedBooks: number;
  successfulIndexes: number;
  failedIndexes: number;
  currentBook?: string;
  errors: Array<{ bookId: string; bookTitle: string; error: string }>;
}

@Injectable()
export class ReindexAllBooksCommand {
  private readonly logger = new Logger(ReindexAllBooksCommand.name);

  constructor(
    private readonly bookApplicationService: BookAggregateApplicationService,
  ) {}

  async execute(
    progressCallback?: (progress: ReindexProgress) => void
  ): Promise<ReindexProgress> {
    // Delegate to the application service which handles the multi-aggregate operation
    await this.bookApplicationService.reindexAllBooks();
    
    // For now, return a simple progress object
    // The application service could be extended to support progress callbacks
    return {
      totalBooks: 0, // Could be enhanced to return actual metrics
      processedBooks: 0,
      successfulIndexes: 0,
      failedIndexes: 0,
      errors: []
    };
  }
}