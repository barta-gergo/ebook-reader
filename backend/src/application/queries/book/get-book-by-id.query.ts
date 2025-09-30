import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookResponseDto } from '../../dtos/book.dto';
import { BookId } from '../../../domain/value-objects';

@Injectable()
export class GetBookByIdQuery {
  constructor(private readonly bookApplicationService: BookAggregateApplicationService) {}

  async execute(bookId: string): Promise<BookResponseDto> {
    const book = await this.bookApplicationService.openBook(BookId.fromString(bookId));
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