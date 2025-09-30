import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StorageService } from './storage.service';
import { Book } from './book';
import { environment } from '../../environments/environment';

describe('StorageService', () => {
  let service: StorageService;
  let httpTestingController: HttpTestingController;
  const API_URL = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StorageService]
    });
    service = TestBed.inject(StorageService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  describe('loadLibrary', () => {
    it('should load books from backend API', () => {
      const mockBooks = [
        {
          id: '1',
          title: 'Test Book 1',
          author: 'Author 1',
          filePath: '/uploads/book1.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          totalPages: 100,
          addedAt: '2023-01-01T00:00:00Z',
          lastOpened: '2023-01-02T00:00:00Z'
        },
        {
          id: '2',
          title: 'Test Book 2',
          author: 'Author 2',
          filePath: '/uploads/book2.pdf',
          fileSize: 2048000,
          mimeType: 'application/pdf',
          totalPages: 200,
          addedAt: '2023-01-03T00:00:00Z',
          lastOpened: undefined
        }
      ];

      service.loadLibrary();

      const req = httpTestingController.expectOne(`${API_URL}/books`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBooks);

      service.library$.subscribe(library => {
        expect(library.length).toBe(2);
        expect(library[0].title).toBe('Test Book 1');
        expect(library[1].title).toBe('Test Book 2');
      });
    });

    it('should handle empty library response', () => {
      service.loadLibrary();

      const req = httpTestingController.expectOne(`${API_URL}/books`);
      req.flush([]);

      service.library$.subscribe(library => {
        expect(library).toEqual([]);
      });
    });

    it('should handle API error gracefully', () => {
      service.loadLibrary();

      const req = httpTestingController.expectOne(`${API_URL}/books`);
      req.error(new ErrorEvent('Network error'));

      service.library$.subscribe(library => {
        expect(library).toEqual([]);
      });
    });
  });

  describe('uploadBookFile', () => {
    it('should upload file and return book data', (done) => {
      const mockFile = new File(['test content'], 'test-book.pdf', { type: 'application/pdf' });
      const mockResponse = {
        id: 'uploaded-1',
        title: 'test-book',
        author: 'Unknown Author',
        filePath: '/uploads/test-book.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        totalPages: 0,
        addedAt: '2023-01-01T00:00:00Z',
        lastOpened: null
      };

      service.uploadBookFile(mockFile).subscribe(book => {
        expect(book.id).toBe('uploaded-1');
        expect(book.title).toBe('test-book');
        expect(book.filePath).toBe(`${API_URL}/books/uploaded-1/download`);
        expect(book.fileSize).toBe(1024000);
        done();
      });

      const req = httpTestingController.expectOne(`${API_URL}/books/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush(mockResponse);
    });

    it('should handle upload error', (done) => {
      const mockFile = new File(['test content'], 'test-book.pdf', { type: 'application/pdf' });

      service.uploadBookFile(mockFile).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpTestingController.expectOne(`${API_URL}/books/upload`);
      req.error(new ErrorEvent('Upload failed'));
    });
  });

  describe('loadBookFromLibrary', () => {
    beforeEach(() => {
      // Set up library with test books
      const mockBooks = [
        {
          id: '1',
          title: 'Test Book',
          author: 'Test Author',
          fileData: '',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          totalPages: 100,
          addedAt: '2023-01-01T00:00:00Z',
          lastOpened: '2023-01-02T00:00:00Z'
        }
      ];
      
      service.library$.subscribe(); // Initialize
      service['librarySubject'].next(mockBooks);
    });

    it('should return book with download URL', () => {
      const book = service.loadBookFromLibrary('1');

      expect(book).toBeTruthy();
      expect(book!.id).toBe('1');
      expect(book!.title).toBe('Test Book');
      expect(book!.filePath).toBe(`${API_URL}/books/1/download`);
    });

    it('should return null for non-existent book', () => {
      const book = service.loadBookFromLibrary('non-existent');

      expect(book).toBeNull();
    });
  });

  describe('removeBookFromLibrary', () => {
    beforeEach(() => {
      const mockBooks = [
        {
          id: '1',
          title: 'Test Book 1',
          author: 'Test Author 1',
          fileData: '',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          totalPages: 100,
          addedAt: '2023-01-01T00:00:00Z',
          lastOpened: undefined
        },
        {
          id: '2',
          title: 'Test Book 2',
          author: 'Test Author 2',
          fileData: '',
          fileSize: 2048000,
          mimeType: 'application/pdf',
          totalPages: 200,
          addedAt: '2023-01-02T00:00:00Z',
          lastOpened: undefined
        }
      ];
      
      service['librarySubject'].next(mockBooks);
    });

    it('should remove book from library and backend', () => {
      service.removeBookFromLibrary('1');

      const req = httpTestingController.expectOne(`${API_URL}/books/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });

      service.library$.subscribe(library => {
        expect(library.length).toBe(1);
        expect(library[0].id).toBe('2');
      });
    });

    it('should clear last opened book if removed', () => {
      localStorage.setItem('ebook-reader-last-book', '1');
      
      service.removeBookFromLibrary('1');

      const req = httpTestingController.expectOne(`${API_URL}/books/1`);
      req.flush({ success: true });

      expect(localStorage.getItem('ebook-reader-last-book')).toBeNull();
    });

    it('should handle delete error gracefully', () => {
      service.removeBookFromLibrary('1');

      const req = httpTestingController.expectOne(`${API_URL}/books/1`);
      req.error(new ErrorEvent('Delete failed'));

      // Library should remain unchanged on error
      service.library$.subscribe(library => {
        expect(library.length).toBe(2);
      });
    });
  });

  describe('saveLastOpenedBook and getLastOpenedBook', () => {
    it('should save and retrieve last opened book', () => {
      const testBook: Book = {
        id: 'test-1',
        title: 'Test Book',
        author: 'Test Author',
        filePath: 'test-path',
        fileSize: 1024,
        mimeType: 'application/pdf',
        totalPages: 100,
        addedAt: new Date(),
        lastOpened: new Date()
      };

      // Set up library with the book
      const mockBooks = [
        {
          id: 'test-1',
          title: 'Test Book',
          author: 'Test Author',
          fileData: '',
          fileSize: 1024,
          mimeType: 'application/pdf',
          totalPages: 100,
          addedAt: '2023-01-01T00:00:00Z',
          lastOpened: undefined
        }
      ];
      service['librarySubject'].next(mockBooks);

      service.saveLastOpenedBook(testBook);
      const retrievedBook = service.getLastOpenedBook();

      expect(retrievedBook).toBeTruthy();
      expect(retrievedBook!.id).toBe('test-1');
      expect(localStorage.getItem('ebook-reader-last-book')).toBe('test-1');
    });

    it('should return null when no last book stored', () => {
      const retrievedBook = service.getLastOpenedBook();
      expect(retrievedBook).toBeNull();
    });

    it('should return null when stored book not in library', () => {
      localStorage.setItem('ebook-reader-last-book', 'non-existent');
      service['librarySubject'].next([]);

      const retrievedBook = service.getLastOpenedBook();
      expect(retrievedBook).toBeNull();
    });
  });
});