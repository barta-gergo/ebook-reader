import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookResponseDto } from '../../dtos/book.dto';

@Injectable()
export class SearchBooksByTitleQuery {
  constructor(
    private readonly bookApplicationService: BookAggregateApplicationService,
  ) {}

  async execute(title: string): Promise<BookResponseDto[]> {
    if (!title?.trim()) {
      return [];
    }

    const books = await this.bookApplicationService.searchBooksByTitle(title.trim());
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