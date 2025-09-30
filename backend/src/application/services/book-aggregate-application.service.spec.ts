import { Test, TestingModule } from '@nestjs/testing';
import { BookAggregateApplicationService } from './book-aggregate-application.service';
import { BookAggregateRepository } from '../../domain/repositories/book-aggregate.repository.interface';
import { SearchService } from '../../domain/services/search.interface';
import { TextIndexingService } from '../../domain/services/text-indexing.interface';
import { PdfMetadataService } from '../../domain/services/pdf-metadata.interface';
import { FileSystemService } from '../../domain/services/file-system.interface';
import { TocExtractionService } from '../../domain/services/toc-extraction.interface';
import {
  BOOK_AGGREGATE_REPOSITORY,
  SEARCH_SERVICE,
  TEXT_INDEXING_SERVICE,
  PDF_METADATA_SERVICE,
  FILE_SYSTEM_SERVICE,
  TOC_EXTRACTION_SERVICE
} from '../../domain/repositories/tokens';
import { BookAggregate } from '../../domain/aggregates/book.aggregate';
import { BookId, UserId, BookMetadata } from '../../domain/value-objects';
import { ReadingProgress } from '../../domain/entities/reading-progress.entity';

describe('BookAggregateApplicationService - Recent Books', () => {
  let service: BookAggregateApplicationService;
  let mockBookRepository: jest.Mocked<BookAggregateRepository>;

  beforeEach(async () => {
    // Create mock repository
    mockBookRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByTitle: jest.fn(),
      findByAuthor: jest.fn(),
      findByTitleAndUserId: jest.fn(),
      findByAuthorAndUserId: jest.fn(),
      findCompleted: jest.fn(),
      findInProgress: jest.fn(),
      findByProgressRange: jest.fn(),
      findCompletedByUserId: jest.fn(),
      findInProgressByUserId: jest.fn(),
      findByProgressRangeAndUserId: jest.fn(),
      exists: jest.fn(),
      existsForUser: jest.fn(),
      count: jest.fn(),
      countByUserId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookAggregateApplicationService,
        {
          provide: BOOK_AGGREGATE_REPOSITORY,
          useValue: mockBookRepository,
        },
        {
          provide: SEARCH_SERVICE,
          useValue: {
            indexBook: jest.fn(),
            searchBooks: jest.fn(),
            deleteBook: jest.fn(),
          },
        },
        {
          provide: TEXT_INDEXING_SERVICE,
          useValue: {
            createSearchableIndex: jest.fn(),
            extractPageText: jest.fn(),
          },
        },
        {
          provide: PDF_METADATA_SERVICE,
          useValue: {
            extractMetadata: jest.fn(),
          },
        },
        {
          provide: FILE_SYSTEM_SERVICE,
          useValue: {
            fileExists: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: TOC_EXTRACTION_SERVICE,
          useValue: {
            extractToc: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookAggregateApplicationService>(BookAggregateApplicationService);
  });

  describe('getRecentBooks', () => {
    it('should return recently opened books sorted by lastOpened date', async () => {
      const userId = UserId.create();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Create mock books with different lastOpened dates
      const book1 = createMockBook('book1', 'Book 1', now);
      const book2 = createMockBook('book2', 'Book 2', yesterday);
      const book3 = createMockBook('book3', 'Book 3', twoDaysAgo);
      const book4 = createMockBook('book4', 'Book 4', null); // Never opened

      mockBookRepository.findAllByUserId.mockResolvedValue([book4, book3, book1, book2]);

      const result = await service.getRecentBooks(userId, 10);

      // Should return 3 books (book4 has no lastOpened)
      expect(result).toHaveLength(3);

      // Should be sorted by most recent first
      expect(result[0].id).toBe('book1');
      expect(result[1].id).toBe('book2');
      expect(result[2].id).toBe('book3');
    });

    it('should respect the limit parameter', async () => {
      const userId = UserId.create();
      const now = new Date();

      const books = Array.from({ length: 10 }, (_, i) =>
        createMockBook(`book${i}`, `Book ${i}`, new Date(now.getTime() - i * 60000))
      );

      mockBookRepository.findAllByUserId.mockResolvedValue(books);

      const result = await service.getRecentBooks(userId, 3);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('book0');
      expect(result[1].id).toBe('book1');
      expect(result[2].id).toBe('book2');
    });

    it('should include reading progress data', async () => {
      const userId = UserId.create();
      const book = createMockBook('book1', 'Book 1', new Date());

      // Add reading progress
      const progress = ReadingProgress.create(
        BookId.fromString('book1'),
        50, // currentPage
        0.5, // scrollPosition
        100  // totalPages
      );
      book.readingProgress = progress;

      mockBookRepository.findAllByUserId.mockResolvedValue([book]);

      const result = await service.getRecentBooks(userId, 10);

      expect(result).toHaveLength(1);
      expect(result[0].progress).toBe(50); // 50% progress
      expect(result[0].currentPage).toBe(50);
    });

    it('should return books with zero progress if no reading progress exists', async () => {
      const userId = UserId.create();
      const book = createMockBook('book1', 'Book 1', new Date());
      book.readingProgress = null;

      mockBookRepository.findAllByUserId.mockResolvedValue([book]);

      const result = await service.getRecentBooks(userId, 10);

      expect(result).toHaveLength(1);
      expect(result[0].progress).toBe(0);
      expect(result[0].currentPage).toBe(1);
    });
  });

  describe('updateLastOpened', () => {
    it('should update the lastOpened timestamp for a book', async () => {
      const userId = UserId.create();
      const bookId = 'test-book-id';
      const book = createMockBook(bookId, 'Test Book', null);
      book.userId = userId;

      mockBookRepository.findById.mockResolvedValue(book);
      mockBookRepository.save.mockResolvedValue(book);

      await service.updateLastOpened(bookId, userId);

      expect(mockBookRepository.findById).toHaveBeenCalledWith(BookId.fromString(bookId));
      expect(mockBookRepository.save).toHaveBeenCalled();
    });

    it('should throw error if book not found', async () => {
      const userId = UserId.create();
      const bookId = 'non-existent-book';

      mockBookRepository.findById.mockResolvedValue(null);

      await expect(service.updateLastOpened(bookId, userId)).rejects.toThrow(
        `Book with ID ${bookId} not found`
      );
    });

    it('should throw error if user does not own the book', async () => {
      const userId = UserId.create();
      const otherUserId = UserId.create();
      const bookId = 'test-book-id';
      const book = createMockBook(bookId, 'Test Book', null);
      book.userId = otherUserId;

      mockBookRepository.findById.mockResolvedValue(book);

      await expect(service.updateLastOpened(bookId, userId)).rejects.toThrow(
        'Unauthorized: Book does not belong to this user'
      );
    });
  });
});

// Helper function to create mock books
function createMockBook(id: string, title: string, lastOpened: Date | null): BookAggregate {
  const metadata = BookMetadata.create({
    title,
    author: 'Test Author',
  });

  const book = BookAggregate.create(
    metadata,
    `/uploads/${id}.pdf`,
    1024 * 1024, // 1MB
    'application/pdf',
    100, // totalPages
    undefined, // searchableText
    UserId.create()
  );

  // Mock the id
  (book as any)._id = BookId.fromString(id);

  // Set lastOpened
  (book as any)._lastOpened = lastOpened;

  return book;
}
