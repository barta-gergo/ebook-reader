import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile, Res, BadRequestException, UseGuards, Request, UnauthorizedException, SetMetadata } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../infrastructure/auth/current-user.decorator';
import { User } from '../../domain/entities/user.entity';
import { UserId } from '../../domain/value-objects';
// Commands
import { AddBookCommand } from '../../application/commands/book/add-book.command';
import { DeleteBookCommand } from '../../application/commands/book/delete-book.command';
import { UploadBookCommand } from '../../application/commands/book/upload-book.command';
import { UpdateReadingProgressCommand } from '../../application/commands/reading-progress/update-reading-progress.command';
import { MarkPageAsReadCommand } from '../../application/commands/reading-progress/mark-page-as-read.command';
import { UnmarkPageAsReadCommand } from '../../application/commands/reading-progress/unmark-page-as-read.command';
import { ManageUserPreferencesCommand } from '../../application/commands/user-preferences/manage-user-preferences.command';
import { ReindexAllBooksCommand } from '../../application/commands/system/reindex-all-books.command';
// Queries
import { GetAllBooksQuery } from '../../application/queries/book/get-all-books.query';
import { GetBookByIdQuery } from '../../application/queries/book/get-book-by-id.query';
import { SearchBooksByTitleQuery } from '../../application/queries/search/search-books-by-title.query';
import { SearchBooksByAuthorQuery } from '../../application/queries/search/search-books-by-author.query';
import { SearchBooksByContentQuery } from '../../application/queries/search/search-books-by-content.query';
import { GetReadPagesQuery } from '../../application/queries/reading-progress/get-read-pages.query';
import { GetReadingProgressQuery } from '../../application/queries/reading-progress/get-reading-progress.query';
import { GetBookTocQuery } from '../../application/queries/toc/get-book-toc.query';
import { CreateBookDto, BookResponseDto, UpdateReadingProgressDto } from '../../application/dtos/book.dto';
import { TocItemDto } from '../../application/dtos/toc-item.dto';
import { BookAggregateApplicationService } from '../../application/services/book-aggregate-application.service';
import { BookCoverApplicationService } from '../../application/services/book-cover-application.service';

const uploadOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed!'), false);
    }
    cb(null, true);
  },
};

@ApiTags('books')
@Controller('books')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BooksController {
  constructor(
    // Commands
    private readonly addBookCommand: AddBookCommand,
    private readonly deleteBookCommand: DeleteBookCommand,
    private readonly uploadBookCommand: UploadBookCommand,
    private readonly updateReadingProgressCommand: UpdateReadingProgressCommand,
    private readonly markPageAsReadCommand: MarkPageAsReadCommand,
    private readonly unmarkPageAsReadCommand: UnmarkPageAsReadCommand,
    private readonly manageUserPreferencesCommand: ManageUserPreferencesCommand,
    private readonly reindexAllBooksCommand: ReindexAllBooksCommand,
    // Queries
    private readonly getAllBooksQuery: GetAllBooksQuery,
    private readonly getBookByIdQuery: GetBookByIdQuery,
    private readonly searchBooksByTitleQuery: SearchBooksByTitleQuery,
    private readonly searchBooksByAuthorQuery: SearchBooksByAuthorQuery,
    private readonly searchBooksByContentQuery: SearchBooksByContentQuery,
    private readonly getReadPagesQuery: GetReadPagesQuery,
    private readonly getReadingProgressQuery: GetReadingProgressQuery,
    private readonly getBookTocQuery: GetBookTocQuery,
    // Services
    private readonly jwtService: JwtService,
    private readonly bookAggregateService: BookAggregateApplicationService,
    private readonly coverService: BookCoverApplicationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all books' })
  @ApiResponse({ status: 200, description: 'List of all books', type: [BookResponseDto] })
  async getAllBooks(@CurrentUser() user: User): Promise<BookResponseDto[]> {
    return await this.getAllBooksQuery.execute(user.id);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recently opened books' })
  @ApiResponse({
    status: 200,
    description: 'List of recently opened books with reading progress',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          author: { type: 'string' },
          filePath: { type: 'string' },
          fileSize: { type: 'number' },
          mimeType: { type: 'string' },
          totalPages: { type: 'number' },
          lastOpened: { type: 'string', format: 'date-time' },
          progress: { type: 'number', description: 'Reading progress percentage (0-100)' },
          currentPage: { type: 'number', description: 'Last read page number' }
        }
      }
    }
  })
  async getRecentBooks(
    @CurrentUser() user: User,
    @Query('limit') limit?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const recentLimit = parsedLimit && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 10;

    return await this.bookAggregateService.getRecentBooks(user.id, recentLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book by ID' })
  @ApiResponse({ status: 200, description: 'Book details', type: BookResponseDto })
  async getBookById(@Param('id') id: string): Promise<BookResponseDto> {
    return await this.getBookByIdQuery.execute(id);
  }

  @Put(':id/last-opened')
  @ApiOperation({ summary: 'Update book last opened timestamp' })
  @ApiResponse({ status: 200, description: 'Last opened timestamp updated successfully' })
  async updateLastOpened(
    @Param('id') id: string,
    @CurrentUser() user: User
  ) {
    await this.bookAggregateService.updateLastOpened(id, user.id);
    return { success: true, message: 'Last opened timestamp updated' };
  }

  @Post()
  @ApiOperation({ summary: 'Add a new book' })
  @ApiResponse({ status: 201, description: 'Book created', type: BookResponseDto })
  async addBook(@Body() createBookDto: CreateBookDto, @CurrentUser() user: User): Promise<BookResponseDto> {
    return await this.addBookCommand.execute(createBookDto, user.id);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Update reading progress' })
  async updateProgress(
    @Param('id') bookId: string,
    @Body() updateProgressDto: UpdateReadingProgressDto,
  ) {
    const bookAggregate = await this.updateReadingProgressCommand.execute(bookId, updateProgressDto);
    const progress = bookAggregate.readingProgress;
    
    if (!progress) {
      throw new BadRequestException('Failed to create or update reading progress');
    }
    
    return {
      id: progress.id,
      bookId: bookAggregate.id.value,
      currentPage: progress.currentPage,
      scrollPosition: progress.scrollPosition,
      progressPercentage: progress.progressPercentage,
      lastUpdated: progress.lastUpdated,
      readingTimeMinutes: progress.readingTimeMinutes,
    };
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get reading progress for a book' })
  @ApiResponse({ status: 200, description: 'Reading progress for the book' })
  async getReadingProgress(@Param('id') bookId: string) {
    return await this.getReadingProgressQuery.execute(bookId);
  }

  @Get('search/title')
  @ApiOperation({ summary: 'Search books by title' })
  async searchByTitle(@Query('q') query: string): Promise<BookResponseDto[]> {
    return await this.searchBooksByTitleQuery.execute(query);
  }

  @Get('search/author')
  @ApiOperation({ summary: 'Search books by author' })
  async searchByAuthor(@Query('q') query: string): Promise<BookResponseDto[]> {
    return await this.searchBooksByAuthorQuery.execute(query);
  }

  @Get('search/content')
  @ApiOperation({ summary: 'Search books by content with snippets and relevance scoring' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results with book details, content snippets, and relevance scores',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          book: { $ref: '#/components/schemas/BookResponseDto' },
          snippets: { type: 'array', items: { type: 'string' } },
          relevanceScore: { type: 'number' }
        }
      }
    }
  })
  async searchByContent(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
    }
    
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    
    const searchLimit = parsedLimit && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 20;
    const searchOffset = parsedOffset && parsedOffset >= 0 ? parsedOffset : 0;
    
    return await this.searchBooksByContentQuery.execute(query, searchLimit, {
      offset: searchOffset
    });
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get search suggestions for autocomplete' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search suggestions',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  })
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string
  ): Promise<string[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const suggestionLimit = parsedLimit && parsedLimit > 0 ? Math.min(parsedLimit, 10) : 5;
    return await this.searchBooksByContentQuery.getSuggestions(query, suggestionLimit);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a PDF file and create a book' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Book created from uploaded file', type: BookResponseDto })
  @ApiResponse({ status:400, description: 'Upload would exceed storage quota' })
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadBook(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User): Promise<BookResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check storage quota before processing upload
    const quotaCheck = await this.bookAggregateService.canUserUploadFile(user.id, file.size);
    if (!quotaCheck.canUpload) {
      throw new BadRequestException(`Upload rejected: ${quotaCheck.reason}`);
    }

    return await this.uploadBookCommand.execute(file, user.id);
  }

  @Get(':id/download')
  @SetMetadata('skipAuth', true)
  @ApiOperation({ summary: 'Download PDF file' })
  async downloadBook(
    @Param('id') id: string, 
    @Query('token') token: string,
    @Request() req: any,
    @Res() res: Response
  ) {
    let validatedToken: string | null = null;
    let userId: string | null = null;

    // Try to get token from query parameter first, then from Authorization header
    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        validatedToken = token;
        userId = payload.sub;
      } catch (error) {
        console.log('Token validation failed for query token:', error.message);
      }
    }

    // If no valid query token, try Authorization header
    if (!validatedToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.substring(7);
        try {
          const payload = this.jwtService.verify(bearerToken);
          validatedToken = bearerToken;
          userId = payload.sub;
        } catch (error) {
          console.log('Token validation failed for bearer token:', error.message);
        }
      }
    }

    if (!validatedToken || !userId) {
      throw new UnauthorizedException('Valid authentication token required');
    }

    const book = await this.getBookByIdQuery.execute(id);
    
    if (!book.filePath) {
      throw new Error('File not found');
    }

    const file = createReadStream(book.filePath);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${book.title}.pdf"`,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    
    file.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book and its file' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  async deleteBook(@Param('id') id: string) {
    await this.deleteBookCommand.execute(id);
    return { success: true, message: 'Book deleted successfully' };
  }

  @Get(':id/toc')
  @ApiOperation({ summary: 'Get table of contents for a book' })
  @ApiResponse({ status: 200, description: 'Table of contents', type: [TocItemDto] })
  async getBookToc(@Param('id') bookId: string): Promise<TocItemDto[]> {
    return await this.getBookTocQuery.execute(bookId);
  }

  @Get(':id/read-pages')
  @ApiOperation({ summary: 'Get read pages for a book' })
  @ApiResponse({ status: 200, description: 'List of read pages' })
  async getReadPages(@Param('id') bookId: string) {
    return await this.getReadPagesQuery.execute(bookId);
  }

  @Post(':id/read-pages/:pageNumber')
  @ApiOperation({ summary: 'Mark a page as read' })
  @ApiResponse({ status: 201, description: 'Page marked as read' })
  async markPageAsRead(@Param('id') bookId: string, @Param('pageNumber') pageNumber: string) {
    const readPages = await this.markPageAsReadCommand.execute(bookId, parseInt(pageNumber));
    return { success: true, bookId, pageNumber: parseInt(pageNumber), readPages: readPages.readPages };
  }

  @Delete(':id/read-pages/:pageNumber')
  @ApiOperation({ summary: 'Unmark a page as read' })
  @ApiResponse({ status: 200, description: 'Page unmarked as read' })
  async unmarkPageAsRead(@Param('id') bookId: string, @Param('pageNumber') pageNumber: string) {
    const readPages = await this.unmarkPageAsReadCommand.execute(bookId, parseInt(pageNumber));
    return { 
      success: true, 
      bookId, 
      pageNumber: parseInt(pageNumber),
      readPages: readPages ? readPages.readPages : []
    };
  }

  @Get(':id/preferences')
  @ApiOperation({ summary: 'Get user preferences for a book' })
  @ApiResponse({ status: 200, description: 'User preferences for the book' })
  async getUserPreferences(@Param('id') bookId: string) {
    return await this.manageUserPreferencesCommand.getUserPreferences(bookId);
  }

  @Put(':id/preferences')
  @ApiOperation({ summary: 'Update user preferences for a book' })
  @ApiResponse({ status: 200, description: 'User preferences updated' })
  async updateUserPreferences(
    @Param('id') bookId: string, 
    @Body() updates: { fitToPage?: boolean; zoom?: number; rotation?: number }
  ) {
    return await this.manageUserPreferencesCommand.updateUserPreferences(bookId, updates);
  }

  @Post('reindex')
  @ApiOperation({ summary: 'Reindex all books for search (admin operation)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Books reindexed successfully',
    schema: {
      type: 'object',
      properties: {
        totalBooks: { type: 'number' },
        processedBooks: { type: 'number' },
        successfulIndexes: { type: 'number' },
        failedIndexes: { type: 'number' },
        errors: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bookId: { type: 'string' },
              bookTitle: { type: 'string' },
              error: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async reindexAllBooks() {
    return await this.reindexAllBooksCommand.execute();
  }

  @Get('search/stats')
  @ApiOperation({ summary: 'Get search index statistics' })
  @ApiResponse({ status: 200, description: 'Search index statistics' })
  async getSearchStats() {
    // TODO: Implement search statistics endpoint
    return { message: 'Search statistics not yet implemented' };
  }

  @Get(':id/cover')
  @SetMetadata('skipAuth', true)
  @ApiOperation({ summary: 'Get book cover image' })
  @ApiResponse({ status: 200, description: 'Book cover image' })
  async getBookCover(
    @Param('id') id: string,
    @Query('size') size: 'thumbnail' | 'small' | 'medium' | 'large',
    @Query('token') token: string,
    @Request() req: any,
    @Res() res: Response
  ) {
    let validatedToken: string | null = null;
    let userId: string | null = null;

    // Try to get token from query parameter first, then from Authorization header
    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        validatedToken = token;
        userId = payload.sub;
      } catch (error) {
        console.log('Token validation failed for query token:', error.message);
      }
    }

    // If no valid query token, try Authorization header
    if (!validatedToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.substring(7);
        try {
          const payload = this.jwtService.verify(bearerToken);
          validatedToken = bearerToken;
          userId = payload.sub;
        } catch (error) {
          console.log('Token validation failed for bearer token:', error.message);
        }
      }
    }

    if (!validatedToken || !userId) {
      throw new UnauthorizedException('Valid authentication token required');
    }

    const cover = await this.coverService.getCover(id);

    if (!cover) {
      // Return placeholder
      res.status(404).json({
        found: false,
        url: '/assets/placeholder-cover.svg',
      });
      return;
    }

    // Get best local path for requested size
    const requestedSize = size || 'thumbnail';
    let localPath: string | undefined;

    switch (requestedSize) {
      case 'thumbnail':
        localPath = cover.localThumbnailPath;
        break;
      case 'small':
        localPath = cover.localSmallPath || cover.localThumbnailPath;
        break;
      case 'medium':
        localPath = cover.localMediumPath || cover.localSmallPath || cover.localThumbnailPath;
        break;
      case 'large':
        localPath = cover.localLargePath || cover.localMediumPath || cover.localSmallPath;
        break;
    }

    // If no local path, return remote URL
    if (!localPath) {
      const remoteUrl = cover.getBestUrlForSize(requestedSize);
      if (remoteUrl) {
        res.json({ found: true, url: remoteUrl, cached: false });
      } else {
        res.status(404).json({ found: false, url: '/assets/placeholder-cover.svg' });
      }
      return;
    }

    // Serve local file
    try {
      const file = createReadStream(localPath);
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      });
      file.pipe(res);
    } catch (error) {
      console.error('Failed to serve cover image:', error);
      res.status(500).json({ found: false, error: 'Failed to serve cover image' });
    }
  }

}