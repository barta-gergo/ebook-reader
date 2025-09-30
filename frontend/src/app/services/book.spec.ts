import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BookService, Book, ReadingProgress, CreateBookDto } from './book';

describe('BookService', () => {
  let service: BookService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BookService]
    });
    service = TestBed.inject(BookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllBooks', () => {
    it('should return an Observable<Book[]>', () => {
      const dummyBooks: Book[] = [
        {
          id: '1',
          title: 'Book 1',
          author: 'Author 1',
          filePath: '/path1.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          totalPages: 100,
          addedAt: new Date(),
        },
        {
          id: '2',
          title: 'Book 2',
          author: 'Author 2',
          filePath: '/path2.pdf',
          fileSize: 2000,
          mimeType: 'application/pdf',
          totalPages: 200,
          addedAt: new Date(),
        }
      ];

      service.getAllBooks().subscribe(books => {
        expect(books.length).toBe(2);
        expect(books).toEqual(dummyBooks);
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/books`);
      expect(req.request.method).toBe('GET');
      req.flush(dummyBooks);
    });
  });

  describe('getBookById', () => {
    it('should return a single book', () => {
      const dummyBook: Book = {
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/path/test.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        totalPages: 100,
        addedAt: new Date(),
      };

      service.getBookById('1').subscribe(book => {
        expect(book).toEqual(dummyBook);
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/books/1`);
      expect(req.request.method).toBe('GET');
      req.flush(dummyBook);
    });
  });

  describe('addBook', () => {
    it('should add a new book', () => {
      const newBook: CreateBookDto = {
        title: 'New Book',
        author: 'New Author',
        filePath: '/path/new.pdf',
        fileSize: 500000,
        mimeType: 'application/pdf',
        totalPages: 50,
      };

      const createdBook: Book = {
        id: '1',
        ...newBook,
        addedAt: new Date(),
      };

      service.addBook(newBook).subscribe(book => {
        expect(book).toEqual(createdBook);
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/books`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newBook);
      req.flush(createdBook);
    });
  });

  describe('updateReadingProgress', () => {
    it('should update reading progress', () => {
      const mockProgress: ReadingProgress = {
        id: 'progress-1',
        bookId: 'book-1',
        currentPage: 25,
        scrollPosition: 1200,
        progressPercentage: 25.0,
        lastUpdated: new Date(),
        readingTimeMinutes: 30,
      };

      service.updateReadingProgress('book-1', 25, 1200, 10).subscribe(progress => {
        expect(progress).toEqual(mockProgress);
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/books/book-1/progress`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        currentPage: 25,
        scrollPosition: 1200,
        additionalReadingTime: 10
      });
      req.flush(mockProgress);
    });
  });

  describe('currentBook$ state management', () => {
    it('should set and get current book', () => {
      const testBook: Book = {
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/path/test.pdf',
        fileSize: 1000,
        mimeType: 'application/pdf',
        totalPages: 100,
        addedAt: new Date(),
      };

      service.setCurrentBook(testBook);
      
      service.currentBook$.subscribe(book => {
        expect(book).toEqual(testBook);
      });

      expect(service.getCurrentBook()).toEqual(testBook);
    });

    it('should handle null current book', () => {
      service.setCurrentBook(null);
      
      service.currentBook$.subscribe(book => {
        expect(book).toBeNull();
      });

      expect(service.getCurrentBook()).toBeNull();
    });
  });
});
