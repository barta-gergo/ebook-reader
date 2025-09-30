import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BookAggregate } from '../../domain/aggregates/book.aggregate';
import { BookMetadata } from '../../domain/value-objects/book-metadata.value-object';
import { ReadingProgress } from '../../domain/entities/reading-progress.entity';
import { BookId, UserId } from '../../domain/value-objects';
// Import all commands and queries
import * as Commands from '../../application/commands';
import * as Queries from '../../application/queries';
import * as fs from 'fs';
import { JwtService } from '@nestjs/jwt';
import { BookAggregateApplicationService } from '../../application/services/book-aggregate-application.service';

// Mock only createReadStream function
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createReadStream: jest.fn(),
}));

describe('BooksController', () => {
  let controller: BooksController;
  // Commands
  let addBookCommand: jest.Mocked<any>;
  let deleteBookCommand: jest.Mocked<any>;
  let uploadBookCommand: jest.Mocked<any>;
  let updateReadingProgressCommand: jest.Mocked<any>;
  let markPageAsReadCommand: jest.Mocked<any>;
  let unmarkPageAsReadCommand: jest.Mocked<any>;
  let manageUserPreferencesCommand: jest.Mocked<any>;
  let reindexAllBooksCommand: jest.Mocked<any>;
  // Queries
  let getAllBooksQuery: jest.Mocked<any>;
  let getBookByIdQuery: jest.Mocked<any>;
  let searchBooksByTitleQuery: jest.Mocked<any>;
  let searchBooksByAuthorQuery: jest.Mocked<any>;
  let searchBooksByContentQuery: jest.Mocked<any>;
  let getReadPagesQuery: jest.Mocked<any>;
  let getReadingProgressQuery: jest.Mocked<any>;
  let getBookTocQuery: jest.Mocked<any>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockGetAllBooksQuery = { execute: jest.fn() };
    const mockGetBookByIdQuery = { execute: jest.fn() };
    const mockAddBookCommand = { execute: jest.fn() };
    const mockDeleteBookCommand = { execute: jest.fn() };
    const mockUploadBookCommand = { execute: jest.fn() };
    const mockUpdateReadingProgressCommand = { execute: jest.fn() };
    const mockSearchBooksByTitleQuery = { execute: jest.fn() };
    const mockSearchBooksByAuthorQuery = { execute: jest.fn() };
    const mockSearchBooksByContentQuery = { execute: jest.fn() };
    const mockGetReadPagesQuery = { execute: jest.fn() };
    const mockGetReadingProgressQuery = { execute: jest.fn() };
    const mockManageUserPreferencesCommand = { execute: jest.fn() };
    const mockReindexAllBooksCommand = { execute: jest.fn() };
    const mockGetBookTocQuery = { execute: jest.fn() };
    const mockMarkPageAsReadCommand = { execute: jest.fn() };
    const mockUnmarkPageAsReadCommand = { execute: jest.fn() };
    const mockJwtService = { verify: jest.fn() };
    const mockBookAggregateService = {
      getUserStatistics: jest.fn(),
      exportUserData: jest.fn(),
      importUserData: jest.fn(),
      getUserStorageInfo: jest.fn(),
      canUserUploadFile: jest.fn().mockResolvedValue({ canUpload: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        { provide: Queries.GetAllBooksQuery, useValue: mockGetAllBooksQuery },
        { provide: Queries.GetBookByIdQuery, useValue: mockGetBookByIdQuery },
        { provide: Commands.AddBookCommand, useValue: mockAddBookCommand },
        { provide: Commands.DeleteBookCommand, useValue: mockDeleteBookCommand },
        { provide: Commands.UploadBookCommand, useValue: mockUploadBookCommand },
        { provide: Commands.UpdateReadingProgressCommand, useValue: mockUpdateReadingProgressCommand },
        { provide: Queries.SearchBooksByTitleQuery, useValue: mockSearchBooksByTitleQuery },
        { provide: Queries.SearchBooksByAuthorQuery, useValue: mockSearchBooksByAuthorQuery },
        { provide: Queries.SearchBooksByContentQuery, useValue: mockSearchBooksByContentQuery },
        { provide: Queries.GetReadPagesQuery, useValue: mockGetReadPagesQuery },
        { provide: Queries.GetReadingProgressQuery, useValue: mockGetReadingProgressQuery },
        { provide: Commands.ManageUserPreferencesCommand, useValue: mockManageUserPreferencesCommand },
        { provide: Commands.ReindexAllBooksCommand, useValue: mockReindexAllBooksCommand },
        { provide: Queries.GetBookTocQuery, useValue: mockGetBookTocQuery },
        { provide: Commands.MarkPageAsReadCommand, useValue: mockMarkPageAsReadCommand },
        { provide: Commands.UnmarkPageAsReadCommand, useValue: mockUnmarkPageAsReadCommand },
        { provide: JwtService, useValue: mockJwtService },
        { provide: BookAggregateApplicationService, useValue: mockBookAggregateService },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    getAllBooksQuery = module.get(Queries.GetAllBooksQuery);
    getBookByIdQuery = module.get(Queries.GetBookByIdQuery);
    addBookCommand = module.get(Commands.AddBookCommand);
    deleteBookCommand = module.get(Commands.DeleteBookCommand);
    uploadBookCommand = module.get(Commands.UploadBookCommand);
    updateReadingProgressCommand = module.get(Commands.UpdateReadingProgressCommand);
    searchBooksByTitleQuery = module.get(Queries.SearchBooksByTitleQuery);
    searchBooksByAuthorQuery = module.get(Queries.SearchBooksByAuthorQuery);
    getReadPagesQuery = module.get(Queries.GetReadPagesQuery);
    manageUserPreferencesCommand = module.get(Commands.ManageUserPreferencesCommand);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addBook', () => {
    it('should add a new book', async () => {
      const createBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/path/to/book.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        totalPages: 100,
      };

      const savedBookDto = {
        id: 'test-book-1',
        title: createBookDto.title,
        author: createBookDto.author,
        filePath: createBookDto.filePath,
        fileSize: createBookDto.fileSize,
        mimeType: createBookDto.mimeType,
        totalPages: createBookDto.totalPages,
        subject: undefined,
        keywords: undefined,
        creator: undefined,
        producer: undefined,
        creationDate: undefined,
        modificationDate: undefined,
        version: undefined,
        textLength: undefined,
        addedAt: new Date(),
        lastOpened: undefined,
      };

      addBookCommand.execute.mockResolvedValue(savedBookDto);

      const mockUser = { id: UserId.fromString('user-1'), email: 'test@example.com' };
      const result = await controller.addBook(createBookDto, mockUser as any);

      expect(addBookCommand.execute).toHaveBeenCalledWith(createBookDto, UserId.fromString('user-1'));
      expect(result).toEqual(savedBookDto);
    });
  });

  describe('getBookById', () => {
    it('should return a book by ID', async () => {
      const bookId = BookId.fromString('test-book-1');
      const bookDto = {
        id: bookId.value,
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/path/to/book.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        totalPages: 100,
        subject: undefined,
        keywords: undefined,
        creator: undefined,
        producer: undefined,
        creationDate: undefined,
        modificationDate: undefined,
        version: undefined,
        textLength: undefined,
        addedAt: new Date(),
        lastOpened: undefined,
      };

      getBookByIdQuery.execute.mockResolvedValue(bookDto);

      const result = await controller.getBookById(bookId.value);

      expect(getBookByIdQuery.execute).toHaveBeenCalledWith(bookId.value);
      expect(result).toEqual(bookDto);
    });
  });

  describe('updateProgress', () => {
    it('should update reading progress', async () => {
      const bookId = BookId.fromString('test-book-1');
      const updateDto = {
        currentPage: 25,
        scrollPosition: 1200,
        additionalReadingTime: 10,
      };

      const updatedProgress = new ReadingProgress(
        'progress-1',
        bookId,
        UserId.fromString('user-1'),
        updateDto.currentPage,
        updateDto.scrollPosition,
        25.0,
        new Date(),
        40,
      );

      const mockBookAggregate = new BookAggregate(
        bookId,
        UserId.fromString('user-1'),
        BookMetadata.create({ title: 'Test Book', author: 'Test Author' }),
        '/path/to/book.pdf',
        1024000,
        'application/pdf',
        100,
        new Date(),
        undefined,
        undefined,
        undefined,
        updatedProgress,
      );

      updateReadingProgressCommand.execute.mockResolvedValue(mockBookAggregate);

      const result = await controller.updateProgress(bookId.value, updateDto);

      expect(updateReadingProgressCommand.execute).toHaveBeenCalledWith(
        bookId.value,
        updateDto,
      );
      expect(result).toEqual({
        id: updatedProgress.id,
        bookId: bookId.value,
        currentPage: updateDto.currentPage,
        scrollPosition: updateDto.scrollPosition,
        progressPercentage: 25.0,
        lastUpdated: updatedProgress.lastUpdated,
        readingTimeMinutes: 40,
      });
    });
  });

  describe('getAllBooks', () => {
    it('should return all books', async () => {
      const booksDto = [
        {
          id: 'test-book-1',
          title: 'Book 1',
          author: 'Author 1',
          filePath: '/path/book1.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          totalPages: 50,
          subject: undefined,
          keywords: undefined,
          creator: undefined,
          producer: undefined,
          creationDate: undefined,
          modificationDate: undefined,
          version: undefined,
          textLength: undefined,
          addedAt: new Date(),
          lastOpened: undefined,
        },
        {
          id: 'test-book-2',
          title: 'Book 2',
          author: 'Author 2',
          filePath: '/path/book2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          totalPages: 100,
          subject: undefined,
          keywords: undefined,
          creator: undefined,
          producer: undefined,
          creationDate: undefined,
          modificationDate: undefined,
          version: undefined,
          textLength: undefined,
          addedAt: new Date(),
          lastOpened: undefined,
        }
      ];

      getAllBooksQuery.execute.mockResolvedValue(booksDto);

      const mockUser = { id: UserId.fromString('user-1'), email: 'test@example.com' };
      const result = await controller.getAllBooks(mockUser as any);

      expect(getAllBooksQuery.execute).toHaveBeenCalledWith(UserId.fromString('user-1'));
      expect(result).toEqual(booksDto);
    });

    it('should return empty array when no books exist', async () => {
      getAllBooksQuery.execute.mockResolvedValue([]);

      const mockUser = { id: UserId.fromString('user-1'), email: 'test@example.com' };
      const result = await controller.getAllBooks(mockUser as any);

      expect(getAllBooksQuery.execute).toHaveBeenCalledWith(UserId.fromString('user-1'));
      expect(result).toEqual([]);
    });
  });

  describe('uploadBook', () => {
    it('should upload a book file and create book record', async () => {
      const mockFile = {
        originalname: 'test-book.pdf',
        filename: 'uploaded-test-book.pdf',
        path: '/uploads/uploaded-test-book.pdf',
        size: 1024000,
        mimetype: 'application/pdf'
      } as Express.Multer.File;

      const savedBookDto = {
        id: 'test-book-1',
        title: 'test-book',
        author: 'Unknown Author',
        filePath: mockFile.path,
        fileSize: mockFile.size,
        mimeType: mockFile.mimetype,
        totalPages: 0,
        subject: undefined,
        keywords: undefined,
        creator: undefined,
        producer: undefined,
        creationDate: undefined,
        modificationDate: undefined,
        version: undefined,
        textLength: undefined,
        addedAt: new Date(),
        lastOpened: undefined,
      };

      uploadBookCommand.execute.mockResolvedValue(savedBookDto);

      const mockUser = { id: UserId.fromString('user-1'), email: 'test@example.com' };
      const result = await controller.uploadBook(mockFile, mockUser as any);

      expect(uploadBookCommand.execute).toHaveBeenCalledWith(mockFile, UserId.fromString('user-1'));
      expect(result).toEqual(savedBookDto);
    });

    it('should throw error when no file uploaded', async () => {
      const mockUser = { id: UserId.fromString('user-1'), email: 'test@example.com' };
      await expect(controller.uploadBook(undefined as any, mockUser as any))
        .rejects.toThrow('No file uploaded');
      
      expect(uploadBookCommand.execute).not.toHaveBeenCalled();
    });
  });

  describe('downloadBook', () => {
    it('should set correct headers for PDF download', async () => {
      const bookId = BookId.fromString('test-book-1');
      const bookDto = {
        id: bookId.value,
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/uploads/test-book.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        totalPages: 100,
        subject: undefined,
        keywords: undefined,
        creator: undefined,
        producer: undefined,
        creationDate: undefined,
        modificationDate: undefined,
        version: undefined,
        textLength: undefined,
        addedAt: new Date(),
        lastOpened: undefined,
      };

      getBookByIdQuery.execute.mockResolvedValue(bookDto);

      const mockResponse = {
        set: jest.fn()
      };

      const mockStream = {
        pipe: jest.fn()
      };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);
      jwtService.verify.mockReturnValue({ sub: 'user-1' }); // Mock valid token

      await controller.downloadBook(bookId.value, 'mock-token', { headers: {} } as any, mockResponse as any);

      expect(getBookByIdQuery.execute).toHaveBeenCalledWith(bookId.value);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Test Book.pdf"',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
    });

    it('should throw error when file path not found', async () => {
      const bookId = BookId.fromString('test-book-1');
      const bookDto = {
        id: bookId.value,
        title: 'Test Book',
        author: 'Test Author',
        filePath: '', // Empty file path
        fileSize: 1024000,
        mimeType: 'application/pdf',
        totalPages: 100,
        subject: undefined,
        keywords: undefined,
        creator: undefined,
        producer: undefined,
        creationDate: undefined,
        modificationDate: undefined,
        version: undefined,
        textLength: undefined,
        addedAt: new Date(),
        lastOpened: undefined,
      };

      getBookByIdQuery.execute.mockResolvedValue(bookDto);
      jwtService.verify.mockReturnValue({ sub: 'user-1' }); // Mock valid token

      const mockResponse = {};

      await expect(controller.downloadBook(bookId.value, 'valid-token', { headers: {} } as any, mockResponse as any))
        .rejects.toThrow('File not found');
    });
  });
});