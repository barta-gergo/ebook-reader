import { Injectable } from '@nestjs/common';
import { BookAggregateApplicationService } from '../../services/book-aggregate-application.service';
import { UpdateReadingProgressDto } from '../../dtos/book.dto';
import { BookId } from '../../../domain/value-objects';

@Injectable()
export class UpdateReadingProgressCommand {
  constructor(private readonly bookApplicationService: BookAggregateApplicationService) {}

  async execute(bookId: string, updateProgressDto: UpdateReadingProgressDto) {
    return await this.bookApplicationService.updateReadingProgress(
      BookId.fromString(bookId),
      updateProgressDto.currentPage,
      updateProgressDto.scrollPosition,
      updateProgressDto.additionalReadingTime || 0,
    );
  }
}