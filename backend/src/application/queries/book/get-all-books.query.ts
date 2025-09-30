import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookResponseDto } from '../../dtos/book.dto';
import { UserId } from '../../../domain/value-objects';

@Injectable()
export class GetAllBooksQuery {
  constructor(private readonly bookApplicationService: BookAggregateApplicationService) {}

  async execute(userId?: UserId): Promise<BookResponseDto[]> {
    const books = userId 
      ? await this.bookApplicationService.getAllBooksByUser(userId)
      : await this.bookApplicationService.getAllBooks();
    return books.map(book => ({
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
    }));
  }
}