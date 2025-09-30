import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BookmarkRepository } from '../../domain/repositories/bookmark.repository.interface';
import { Bookmark } from '../../domain/entities/bookmark.entity';
import { BookId, UserId } from '../../domain/value-objects';
import { BOOKMARK_REPOSITORY, LLM_SERVICE, TEXT_INDEXING_SERVICE } from '../../domain/repositories/tokens';
import { LLMService } from '../../domain/services/llm.interface';
import { TextIndexingService } from '../../domain/services/text-indexing.interface';

export interface BookmarkDto {
  id: string;
  bookId: string;
  pageNumber: number;
  scrollPosition: number;
  title?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookmarkRequest {
  bookId: string;
  pageNumber: number;
  scrollPosition: number;
  title?: string;
  note?: string;
}

export interface UpdateBookmarkRequest {
  title?: string;
  note?: string;
  pageNumber?: number;
  scrollPosition?: number;
}

@Injectable()
export class BookmarkApplicationService {
  constructor(
    @Inject(BOOKMARK_REPOSITORY)
    private readonly bookmarkRepository: BookmarkRepository,
    @Inject(LLM_SERVICE)
    private readonly llmService: LLMService,
    @Inject(TEXT_INDEXING_SERVICE)
    private readonly textIndexingService: TextIndexingService,
  ) {}

  async createBookmark(userId: UserId, request: CreateBookmarkRequest): Promise<BookmarkDto> {
    const bookmark = Bookmark.create(
      BookId.create(request.bookId),
      userId,
      request.pageNumber,
      request.scrollPosition,
      request.title,
      request.note
    );

    const saved = await this.bookmarkRepository.save(bookmark);
    return this.toDto(saved);
  }

  async getBookmark(id: string, userId: UserId): Promise<BookmarkDto> {
    const bookmark = await this.bookmarkRepository.findById(id);
    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID ${id} not found`);
    }

    // Verify user owns this bookmark
    if (bookmark.userId.value !== userId.value) {
      throw new ForbiddenException('Access denied');
    }

    return this.toDto(bookmark);
  }

  async getBookmarksByBook(bookId: string, userId: UserId): Promise<BookmarkDto[]> {
    const bookmarks = await this.bookmarkRepository.findByBookIdAndUserId(
      BookId.create(bookId),
      userId
    );
    return bookmarks.map(b => this.toDto(b));
  }

  async getAllUserBookmarks(userId: UserId): Promise<BookmarkDto[]> {
    const bookmarks = await this.bookmarkRepository.findByUserId(userId);
    return bookmarks.map(b => this.toDto(b));
  }

  async updateBookmark(id: string, userId: UserId, request: UpdateBookmarkRequest): Promise<BookmarkDto> {
    let bookmark = await this.bookmarkRepository.findById(id);
    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID ${id} not found`);
    }

    // Verify user owns this bookmark
    if (bookmark.userId.value !== userId.value) {
      throw new ForbiddenException('Access denied');
    }

    // Apply updates
    if (request.title !== undefined) {
      bookmark = bookmark.updateTitle(request.title);
    }
    if (request.note !== undefined) {
      bookmark = bookmark.updateNote(request.note);
    }
    if (request.pageNumber !== undefined && request.scrollPosition !== undefined) {
      bookmark = bookmark.updatePosition(request.pageNumber, request.scrollPosition);
    }

    const updated = await this.bookmarkRepository.save(bookmark);
    return this.toDto(updated);
  }

  async deleteBookmark(id: string, userId: UserId): Promise<void> {
    const bookmark = await this.bookmarkRepository.findById(id);
    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID ${id} not found`);
    }

    // Verify user owns this bookmark
    if (bookmark.userId.value !== userId.value) {
      throw new ForbiddenException('Access denied');
    }

    await this.bookmarkRepository.delete(id);
  }

  async deleteAllUserBookmarks(userId: UserId): Promise<number> {
    const bookmarks = await this.bookmarkRepository.findByUserId(userId);
    await this.bookmarkRepository.deleteAllByUserId(userId);
    return bookmarks.length;
  }

  async generateNoteForPage(bookId: string, pageNumber: number, userId: UserId): Promise<string> {
    // Get the text content for the specific page
    const pageText = await this.textIndexingService.getPageText(bookId, pageNumber);

    if (!pageText || pageText.trim().length === 0) {
      throw new NotFoundException(`No text content found for page ${pageNumber} of book ${bookId}`);
    }

    // Use the full page text (no trimming)
    const textToSummarize = pageText;

    // Generate summary using LLM
    const summary = await this.llmService.generateSummary(textToSummarize, {
      temperature: 0.7,
      maxTokens: 200,
      systemPrompt: 'You are a helpful assistant that creates concise bookmark notes for book pages. ' +
        'Write 2-4 clear sentences summarizing the main ideas and key points from the page. ' +
        'Use plain text only - no markdown, no bold, no bullet points. ' +
        'Make it natural and easy to understand at a glance. ' +
        'Focus on what the reader should remember about this page.'
    });

    return summary;
  }

  private toDto(bookmark: Bookmark): BookmarkDto {
    return {
      id: bookmark.id,
      bookId: bookmark.bookId.value,
      pageNumber: bookmark.pageNumber,
      scrollPosition: bookmark.scrollPosition,
      title: bookmark.title,
      note: bookmark.note,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
    };
  }
}
