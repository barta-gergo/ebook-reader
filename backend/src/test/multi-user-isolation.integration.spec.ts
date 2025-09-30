import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookAggregateApplicationService } from '../application/services/book-aggregate-application.service';
import { BookAggregateRepositoryImpl } from '../infrastructure/repositories/book-aggregate.repository';
import { BookOrmEntity } from '../infrastructure/database/entities/book.orm-entity';
import { ReadingProgressOrmEntity } from '../infrastructure/database/entities/reading-progress.orm-entity';
import { ReadPagesOrmEntity } from '../infrastructure/database/entities/read-pages.orm-entity';
import { TocItemOrmEntity } from '../infrastructure/database/entities/toc-item.orm-entity';
import { UserId, BookMetadata } from '../domain/value-objects';
import { BookAggregate } from '../domain/aggregates/book.aggregate';
import { BOOK_AGGREGATE_REPOSITORY, SEARCH_SERVICE, TEXT_INDEXING_SERVICE, PDF_METADATA_SERVICE, FILE_SYSTEM_SERVICE, TOC_EXTRACTION_SERVICE } from '../domain/repositories/tokens';

// Mock services
const mockSearchService = {
  indexBook: jest.fn(),
  deleteBook: jest.fn(),
  clearIndex: jest.fn(),
};

const mockTextIndexingService = {
  createSearchableIndex: jest.fn((text) => text),
};

const mockPdfMetadataService = {
  extractMetadata: jest.fn(),
};

const mockFileSystemService = {
  fileExists: jest.fn(),
  deleteFile: jest.fn(),
};

const mockTocExtractionService = {
  extractToc: jest.fn(),
};

describe('Multi-User Data Isolation (Integration)', () => {
  let app: INestApplication;
  let bookApplicationService: BookAggregateApplicationService;
  let bookRepository: BookAggregateRepositoryImpl;

  const user1Id = UserId.create('user1');
  const user2Id = UserId.create('user2');

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [BookOrmEntity, ReadingProgressOrmEntity, ReadPagesOrmEntity, TocItemOrmEntity],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([BookOrmEntity, ReadingProgressOrmEntity, ReadPagesOrmEntity, TocItemOrmEntity]),
      ],
      providers: [
        BookAggregateApplicationService,
        BookAggregateRepositoryImpl,
        {
          provide: BOOK_AGGREGATE_REPOSITORY,
          useClass: BookAggregateRepositoryImpl,
        },
        {
          provide: SEARCH_SERVICE,
          useValue: mockSearchService,
        },
        {
          provide: TEXT_INDEXING_SERVICE,
          useValue: mockTextIndexingService,
        },
        {
          provide: PDF_METADATA_SERVICE,
          useValue: mockPdfMetadataService,
        },
        {
          provide: FILE_SYSTEM_SERVICE,
          useValue: mockFileSystemService,
        },
        {
          provide: TOC_EXTRACTION_SERVICE,
          useValue: mockTocExtractionService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    bookApplicationService = moduleFixture.get<BookAggregateApplicationService>(BookAggregateApplicationService);
    bookRepository = moduleFixture.get<BookAggregateRepositoryImpl>(BookAggregateRepositoryImpl);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should isolate books between different users', async () => {
    // Create books for user1
    const user1Book1 = await bookApplicationService.addBook(
      user1Id,
      'User 1 Book 1',
      'Author 1',
      '/path/to/book1.pdf',
      1000,
      'application/pdf',
      100
    );

    const user1Book2 = await bookApplicationService.addBook(
      user1Id,
      'User 1 Book 2',
      'Author 2',
      '/path/to/book2.pdf',
      1500,
      'application/pdf',
      150
    );

    // Create books for user2
    const user2Book1 = await bookApplicationService.addBook(
      user2Id,
      'User 2 Book 1',
      'Author 3',
      '/path/to/book3.pdf',
      2000,
      'application/pdf',
      200
    );

    // Verify user1 can only see their books
    const user1Books = await bookApplicationService.getAllBooksByUser(user1Id);
    expect(user1Books).toHaveLength(2);
    const user1BookTitles = user1Books.map(b => b.metadata.title).sort();
    expect(user1BookTitles).toEqual(['User 1 Book 1', 'User 1 Book 2']);

    // Verify user2 can only see their books
    const user2Books = await bookApplicationService.getAllBooksByUser(user2Id);
    expect(user2Books).toHaveLength(1);
    expect(user2Books[0].metadata.title).toBe('User 2 Book 1');

    // Verify that user1 cannot see user2's books when searching
    const user1SearchByTitle = await bookApplicationService.searchBooksByTitleForUser('User 2', user1Id);
    expect(user1SearchByTitle).toHaveLength(0);

    const user2SearchByTitle = await bookApplicationService.searchBooksByTitleForUser('User 1', user2Id);
    expect(user2SearchByTitle).toHaveLength(0);
  });

  it('should isolate reading progress between users', async () => {
    // Create a book for user1
    const user1Book = await bookApplicationService.addBook(
      user1Id,
      'Shared Title',
      'Shared Author',
      '/path/to/shared.pdf',
      1000,
      'application/pdf',
      100
    );

    // Create the same book for user2 (same content, different user)
    const user2Book = await bookApplicationService.addBook(
      user2Id,
      'Shared Title',
      'Shared Author',
      '/path/to/shared2.pdf',
      1000,
      'application/pdf',
      100
    );

    // Update reading progress for user1
    const user1BookWithProgress = await bookApplicationService.updateReadingProgress(
      user1Book.id,
      50,
      0.5,
      30
    );

    // Update reading progress for user2
    const user2BookWithProgress = await bookApplicationService.updateReadingProgress(
      user2Book.id,
      25,
      0.25,
      15
    );

    // Verify reading progress is isolated
    expect(user1BookWithProgress.readingProgress?.currentPage).toBe(50);
    expect(user1BookWithProgress.readingProgress?.readingTimeMinutes).toBe(30);

    expect(user2BookWithProgress.readingProgress?.currentPage).toBe(25);
    expect(user2BookWithProgress.readingProgress?.readingTimeMinutes).toBe(15);

    // Verify progress isolation when getting completed books
    const user1CompletedBooks = await bookApplicationService.getBooksByProgressStatusForUser('in-progress', user1Id);
    const user2CompletedBooks = await bookApplicationService.getBooksByProgressStatusForUser('in-progress', user2Id);

    expect(user1CompletedBooks).toHaveLength(1);
    expect(user1CompletedBooks[0].readingProgress?.currentPage).toBe(50);

    expect(user2CompletedBooks).toHaveLength(1);
    expect(user2CompletedBooks[0].readingProgress?.currentPage).toBe(25);
  });

  it('should ensure users can only access their own data', async () => {
    // Create a book for user1
    const user1Book = await bookApplicationService.addBook(
      user1Id,
      'User 1 Private Book',
      'Author 1',
      '/path/to/private.pdf',
      1000,
      'application/pdf',
      100
    );

    // Verify user2 cannot access user1's book by ID
    const user2CannotAccess = await bookRepository.existsForUser(user1Book.id, user2Id);
    expect(user2CannotAccess).toBe(false);

    // Verify user1 can access their own book
    const user1CanAccess = await bookRepository.existsForUser(user1Book.id, user1Id);
    expect(user1CanAccess).toBe(true);

    // Verify count isolation
    const user1Count = await bookRepository.countByUserId(user1Id);
    const user2Count = await bookRepository.countByUserId(user2Id);

    expect(user1Count).toBe(1);
    expect(user2Count).toBe(0);
  });
});