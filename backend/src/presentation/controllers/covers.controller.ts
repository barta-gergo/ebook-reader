import { Controller, Post, Get, Param, Query, UseGuards, Logger, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { BookCoverApplicationService } from '../../application/services/book-cover-application.service';
import { BookAggregateApplicationService } from '../../application/services/book-aggregate-application.service';
import { UserId } from '../../domain/value-objects';

@Controller('covers')
@UseGuards(JwtAuthGuard)
export class CoversController {
  private readonly logger = new Logger(CoversController.name);

  constructor(
    private readonly coverService: BookCoverApplicationService,
    private readonly bookService: BookAggregateApplicationService,
  ) {}

  /**
   * Bulk fetch covers for existing books that don't have them
   * POST /covers/fetch-missing
   */
  @Post('fetch-missing')
  async fetchMissingCovers(@Req() req: any) {
    const userId = UserId.fromString(req.user.userId);
    this.logger.log(`Bulk cover fetch requested by user: ${userId.value}`);

    // Get all books for this user
    const books = await this.bookService.getAllBooks(userId);

    // Map to format expected by cover service
    const bookData = books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: undefined, // ISBN not available yet
    }));

    const result = await this.coverService.fetchCoversForBooks(bookData);

    this.logger.log(
      `Bulk fetch complete: ${result.successful}/${result.total} successful, ${result.failed} failed, ${result.skipped} skipped`
    );

    return {
      message: 'Bulk cover fetch completed',
      ...result,
    };
  }

  /**
   * Get cover URL for a book
   * GET /covers/:bookId?size=thumbnail
   */
  @Get(':bookId')
  async getCoverUrl(
    @Param('bookId') bookId: string,
    @Query('size') size?: 'thumbnail' | 'small' | 'medium' | 'large'
  ) {
    const coverUrl = await this.coverService.getCoverUrl(bookId, size || 'thumbnail');

    if (!coverUrl) {
      return {
        found: false,
        url: '/assets/placeholder-cover.svg', // Frontend placeholder
      };
    }

    return {
      found: true,
      url: coverUrl,
    };
  }

  /**
   * Check if book has cover
   * GET /covers/:bookId/exists
   */
  @Get(':bookId/exists')
  async hasCover(@Param('bookId') bookId: string) {
    const exists = await this.coverService.hasCover(bookId);
    return { exists };
  }

  /**
   * Get cover statistics
   * GET /covers/stats
   */
  @Get('stats')
  async getStatistics() {
    return await this.coverService.getStatistics();
  }
}
