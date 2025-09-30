import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookOrmEntity } from '../src/infrastructure/database/entities/book.orm-entity';
import { ReadingProgressOrmEntity } from '../src/infrastructure/database/entities/reading-progress.orm-entity';
import { Repository } from 'typeorm';
import { MeilisearchService } from '../src/infrastructure/services/meilisearch.service';

describe('EBook Reader API (e2e)', () => {
  let app: INestApplication;
  let bookRepository: Repository<BookOrmEntity>;
  let progressRepository: Repository<ReadingProgressOrmEntity>;
  let meilisearchService: MeilisearchService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    bookRepository = moduleFixture.get<Repository<BookOrmEntity>>(
      getRepositoryToken(BookOrmEntity),
    );
    progressRepository = moduleFixture.get<Repository<ReadingProgressOrmEntity>>(
      getRepositoryToken(ReadingProgressOrmEntity),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await progressRepository.clear();
    await bookRepository.clear();
  });

  describe('/books (POST)', () => {
    it('should create a new book', () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/path/to/test-book.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        totalPages: 100,
      };

      return request(app.getHttpServer())
        .post('/books')
        .send(bookData)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.title).toBe(bookData.title);
          expect(res.body.author).toBe(bookData.author);
          expect(res.body.addedAt).toBeDefined();
        });
    });

    it('should validate book data', () => {
      const invalidBookData = {
        title: '',
        // missing required fields
      };

      return request(app.getHttpServer())
        .post('/books')
        .send(invalidBookData)
        .expect(400);
    });
  });

  describe('/books (GET)', () => {
    it('should return empty array when no books exist', () => {
      return request(app.getHttpServer())
        .get('/books')
        .expect(200)
        .expect([]);
    });

    it('should return all books', async () => {
      // Create test books
      const book1 = bookRepository.create({
        id: 'book-1',
        title: 'Book 1',
        author: 'Author 1',
        filePath: '/path1.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        totalPages: 50,
        addedAt: new Date(),
      });

      const book2 = bookRepository.create({
        id: 'book-2',
        title: 'Book 2',
        author: 'Author 2',
        filePath: '/path2.pdf',
        fileSize: 2000,
        mimeType: 'application/pdf',
        totalPages: 100,
        addedAt: new Date(),
      });

      await bookRepository.save([book1, book2]);

      return request(app.getHttpServer())
        .get('/books')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].title).toBeDefined();
          expect(res.body[1].title).toBeDefined();
        });
    });
  });

  describe('/books/:id (GET)', () => {
    it('should return a book by ID and update lastOpened', async () => {
      const book = bookRepository.create({
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/path/to/book.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        totalPages: 100,
        addedAt: new Date(),
      });

      await bookRepository.save(book);

      return request(app.getHttpServer())
        .get('/books/book-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('book-1');
          expect(res.body.title).toBe('Test Book');
          expect(res.body.lastOpened).toBeDefined();
        });
    });
  });

  describe('/books/:id/progress (PUT)', () => {
    it('should update reading progress', async () => {
      const book = bookRepository.create({
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/path/to/book.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        totalPages: 100,
        addedAt: new Date(),
      });

      await bookRepository.save(book);

      const progressUpdate = {
        currentPage: 25,
        scrollPosition: 1200,
        additionalReadingTime: 10,
      };

      return request(app.getHttpServer())
        .put('/books/book-1/progress')
        .send(progressUpdate)
        .expect(200)
        .expect((res) => {
          expect(res.body.bookId).toBe('book-1');
          expect(res.body.currentPage).toBe(25);
          expect(res.body.scrollPosition).toBe(1200);
          expect(res.body.progressPercentage).toBe(25.0);
        });
    });
  });

  describe('/books/search/content (GET)', () => {
    it('should return empty array for non-existent search terms', () => {
      return request(app.getHttpServer())
        .get('/books/search/content?q=nonexistentterm12345')
        .expect(200)
        .expect([]);
    });

    it('should return search results with snippets and relevance scores', async () => {
      // Note: This test assumes Meilisearch is running and connected
      // In a real scenario, you might want to mock the Meilisearch service for unit tests
      // and only test the actual search in integration tests with Meilisearch running
      
      const searchQuery = 'test'; // Simple search term
      
      return request(app.getHttpServer())
        .get(`/books/search/content?q=${searchQuery}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // If results exist, they should have the correct structure
          if (res.body.length > 0) {
            const result = res.body[0];
            expect(result).toHaveProperty('book');
            expect(result).toHaveProperty('snippets');
            expect(result).toHaveProperty('relevanceScore');
            expect(result.book).toHaveProperty('id');
            expect(result.book).toHaveProperty('title');
            expect(result.book).toHaveProperty('author');
            expect(Array.isArray(result.snippets)).toBe(true);
            expect(typeof result.relevanceScore).toBe('number');
          }
        });
    });

    it('should handle search limit parameter', () => {
      return request(app.getHttpServer())
        .get('/books/search/content?q=test&limit=5')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });

    it('should handle search offset parameter', () => {
      return request(app.getHttpServer())
        .get('/books/search/content?q=test&limit=5&offset=0')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should reject queries that are too short', () => {
      return request(app.getHttpServer())
        .get('/books/search/content?q=a')
        .expect(400); // Should return 400 for queries less than 2 characters
    });
  });

  describe('/books/search/suggestions (GET)', () => {
    it('should return search suggestions', () => {
      return request(app.getHttpServer())
        .get('/books/search/suggestions?q=te')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Each suggestion should be a string
          if (res.body.length > 0) {
            expect(typeof res.body[0]).toBe('string');
          }
        });
    });

    it('should limit suggestions based on limit parameter', () => {
      return request(app.getHttpServer())
        .get('/books/search/suggestions?q=te&limit=3')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(3);
        });
    });

    it('should return empty array for empty query', () => {
      return request(app.getHttpServer())
        .get('/books/search/suggestions?q=')
        .expect(200)
        .expect([]);
    });
  });
});