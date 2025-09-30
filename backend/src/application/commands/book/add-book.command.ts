import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { CreateBookDto, BookResponseDto } from '../../dtos/book.dto';
import { UserId } from '../../../domain/value-objects';

@Injectable()
export class AddBookCommand {
  constructor(private readonly bookApplicationService: BookAggregateApplicationService) {}

  async execute(createBookDto: CreateBookDto, userId: UserId): Promise<BookResponseDto> {
    const savedBook = await this.bookApplicationService.addBook(
      userId,
      createBookDto.title,
      createBookDto.author,
      createBookDto.filePath,
      createBookDto.fileSize,
      createBookDto.mimeType,
      createBookDto.totalPages,
      createBookDto.subject,
      createBookDto.keywords,
      createBookDto.creator,
      createBookDto.producer,
      createBookDto.creationDate,
      createBookDto.modificationDate,
      createBookDto.version,
      createBookDto.textLength,
      createBookDto.searchableText,
    );
    
    return {
      id: savedBook.id.value,
      title: savedBook.metadata.title,
      author: savedBook.metadata.author,
      filePath: savedBook.filePath,
      fileSize: savedBook.fileSize,
      mimeType: savedBook.mimeType,
      totalPages: savedBook.totalPages,
      subject: savedBook.metadata.subject,
      keywords: savedBook.metadata.keywords,
      creator: savedBook.metadata.creator,
      producer: savedBook.metadata.producer,
      creationDate: savedBook.metadata.creationDate,
      modificationDate: savedBook.metadata.modificationDate,
      version: savedBook.metadata.version,
      textLength: savedBook.textLength,
      addedAt: savedBook.addedAt,
      lastOpened: savedBook.lastOpened,
    };
  }
}