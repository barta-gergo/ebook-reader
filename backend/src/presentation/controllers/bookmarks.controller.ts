import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../infrastructure/auth/current-user.decorator';
import { User } from '../../domain/entities/user.entity';
import { BookmarkApplicationService, CreateBookmarkRequest, UpdateBookmarkRequest } from '../../application/services/bookmark.application.service';

@ApiTags('bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookmarksController {
  constructor(
    private readonly bookmarkService: BookmarkApplicationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bookmark' })
  @ApiBody({
    description: 'Bookmark creation data',
    schema: {
      type: 'object',
      properties: {
        bookId: { type: 'string', description: 'Book ID' },
        pageNumber: { type: 'number', description: 'Page number' },
        scrollPosition: { type: 'number', description: 'Scroll position (0-1)' },
        title: { type: 'string', description: 'Optional bookmark title' },
        note: { type: 'string', description: 'Optional bookmark note' }
      },
      required: ['bookId', 'pageNumber', 'scrollPosition']
    }
  })
  @ApiResponse({ status: 201, description: 'Bookmark created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBookmark(@CurrentUser() user: User, @Body() request: CreateBookmarkRequest) {
    return await this.bookmarkService.createBookmark(user.id, request);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookmarks for current user' })
  @ApiResponse({ status: 200, description: 'Returns all user bookmarks' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllBookmarks(@CurrentUser() user: User) {
    return await this.bookmarkService.getAllUserBookmarks(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific bookmark by ID' })
  @ApiResponse({ status: 200, description: 'Returns bookmark details' })
  @ApiResponse({ status: 404, description: 'Bookmark not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBookmark(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.bookmarkService.getBookmark(id, user.id);
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get all bookmarks for a specific book' })
  @ApiResponse({ status: 200, description: 'Returns book bookmarks' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBookBookmarks(@CurrentUser() user: User, @Param('bookId') bookId: string) {
    return await this.bookmarkService.getBookmarksByBook(bookId, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a bookmark' })
  @ApiBody({
    description: 'Bookmark update data',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Bookmark title' },
        note: { type: 'string', description: 'Bookmark note' },
        pageNumber: { type: 'number', description: 'Page number' },
        scrollPosition: { type: 'number', description: 'Scroll position (0-1)' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Bookmark updated successfully' })
  @ApiResponse({ status: 404, description: 'Bookmark not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateBookmark(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() request: UpdateBookmarkRequest
  ) {
    return await this.bookmarkService.updateBookmark(id, user.id, request);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bookmark' })
  @ApiResponse({ status: 200, description: 'Bookmark deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bookmark not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteBookmark(@CurrentUser() user: User, @Param('id') id: string) {
    await this.bookmarkService.deleteBookmark(id, user.id);
    return { success: true, message: 'Bookmark deleted successfully' };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all bookmarks for current user' })
  @ApiResponse({ status: 200, description: 'All bookmarks deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAllBookmarks(@CurrentUser() user: User) {
    const count = await this.bookmarkService.deleteAllUserBookmarks(user.id);
    return { success: true, message: `Deleted ${count} bookmarks` };
  }

  @Post('generate-note')
  @ApiOperation({ summary: 'Generate AI-powered note for a page' })
  @ApiBody({
    description: 'Book and page information',
    schema: {
      type: 'object',
      properties: {
        bookId: { type: 'string', description: 'Book ID' },
        pageNumber: { type: 'number', description: 'Page number' }
      },
      required: ['bookId', 'pageNumber']
    }
  })
  @ApiResponse({ status: 200, description: 'Generated note successfully' })
  @ApiResponse({ status: 404, description: 'Book or page not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateNote(
    @CurrentUser() user: User,
    @Body() request: { bookId: string; pageNumber: number }
  ) {
    const note = await this.bookmarkService.generateNoteForPage(
      request.bookId,
      request.pageNumber,
      user.id
    );
    return { note };
  }
}
