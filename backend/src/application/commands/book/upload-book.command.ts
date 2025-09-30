import { Injectable, Logger } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookCoverApplicationService } from '../../services/book-cover-application.service';
import { BookResponseDto } from '../../dtos/book.dto';
import { UserId } from '../../../domain/value-objects';

@Injectable()
export class UploadBookCommand {
  private readonly logger = new Logger(UploadBookCommand.name);

  constructor(
    private readonly bookApplicationService: BookAggregateApplicationService,
    private readonly coverApplicationService: BookCoverApplicationService,
  ) {}

  async execute(file: Express.Multer.File, userId: UserId): Promise<BookResponseDto> {
    const book = await this.bookApplicationService.uploadBook(file, userId);

    // Async cover fetching (non-blocking, fire and forget)
    this.coverApplicationService
      .fetchAndSaveCover(
        book.id.value,
        book.metadata.title,
        book.metadata.author,
        undefined, // ISBN not available from metadata yet
        book.filePath
      )
      .catch((error) => {
        this.logger.warn(`Failed to fetch cover for book ${book.id.value}: ${error.message}`);
      });

    return {
      id: book.id.value,
      title: book.metadata.title,
      author: book.metadata.author,
      filePath: book.filePath,
      fileSize: book.fileSize,
      mimeType: book.mimeType,
      totalPages: book.totalPages,
      subject: book.metadata.subject,
      keywords: book.metadata.keywords,
      creator: book.metadata.creator,
      producer: book.metadata.producer,
      creationDate: book.metadata.creationDate,
      modificationDate: book.metadata.modificationDate,
      version: book.metadata.version,
      textLength: book.textLength,
      addedAt: book.addedAt,
      lastOpened: book.lastOpened,
    };
  }
}