import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { BookResponseDto } from '../../dtos/book.dto';

@Injectable()
export class SearchBooksByAuthorQuery {
  constructor(
    private readonly bookApplicationService: BookAggregateApplicationService,
  ) {}

  async execute(author: string): Promise<BookResponseDto[]> {
    if (!author?.trim()) {
      return [];
    }

    const books = await this.bookApplicationService.searchBooksByAuthor(author.trim());
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