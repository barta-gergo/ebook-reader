import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BookmarkService, CreateBookmarkRequest, UpdateBookmarkRequest } from './bookmark.service';
import { EnvironmentService } from './environment.service';

describe('BookmarkService', () => {
  let service: BookmarkService;
  let httpMock: HttpTestingController;
  let environmentService: jasmine.SpyObj<EnvironmentService>;
  const mockApiUrl = 'http://localhost:3000';

  beforeEach(() => {
    const envSpy = jasmine.createSpyObj('EnvironmentService', ['getApiBaseUrl']);
    envSpy.getApiBaseUrl.and.returnValue(mockApiUrl);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BookmarkService,
        { provide: EnvironmentService, useValue: envSpy }
      ]
    });

    service = TestBed.inject(BookmarkService);
    httpMock = TestBed.inject(HttpTestingController);
    environmentService = TestBed.inject(EnvironmentService) as jasmine.SpyObj<EnvironmentService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a bookmark', (done) => {
    const request: CreateBookmarkRequest = {
      bookId: 'book123',
      pageNumber: 42,
      scrollPosition: 0.5,
      title: 'Test Bookmark',
      note: 'Test note'
    };

    const mockResponse = {
      id: 'bookmark123',
      ...request,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    service.createBookmark(request).subscribe(bookmark => {
      expect(bookmark.id).toBe('bookmark123');
      expect(bookmark.bookId).toBe('book123');
      expect(bookmark.pageNumber).toBe(42);
      done();
    });

    const req = httpMock.expectOne(`${mockApiUrl}/bookmarks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should get bookmarks by book', (done) => {
    const bookId = 'book123';
    const mockBookmarks = [
      {
        id: '1',
        bookId,
        pageNumber: 10,
        scrollPosition: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        bookId,
        pageNumber: 20,
        scrollPosition: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    service.getBookmarksByBook(bookId).subscribe(bookmarks => {
      expect(bookmarks.length).toBe(2);
      expect(bookmarks[0].pageNumber).toBe(10);
      expect(bookmarks[1].pageNumber).toBe(20);
      done();
    });

    const req = httpMock.expectOne(`${mockApiUrl}/bookmarks/book/${bookId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBookmarks);
  });

  it('should update a bookmark', (done) => {
    const bookmarkId = 'bookmark123';
    const updateRequest: UpdateBookmarkRequest = {
      title: 'Updated Title',
      note: 'Updated Note'
    };

    const mockResponse = {
      id: bookmarkId,
      bookId: 'book123',
      pageNumber: 42,
      scrollPosition: 0.5,
      title: 'Updated Title',
      note: 'Updated Note',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    service.updateBookmark(bookmarkId, updateRequest).subscribe(bookmark => {
      expect(bookmark.title).toBe('Updated Title');
      expect(bookmark.note).toBe('Updated Note');
      done();
    });

    const req = httpMock.expectOne(`${mockApiUrl}/bookmarks/${bookmarkId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(mockResponse);
  });

  it('should delete a bookmark', (done) => {
    const bookmarkId = 'bookmark123';

    service.deleteBookmark(bookmarkId).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne(`${mockApiUrl}/bookmarks/${bookmarkId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should check if page is bookmarked', () => {
    const bookId = 'book123';
    const pageNumber = 42;

    // Initially no bookmarks
    expect(service.isPageBookmarked(bookId, pageNumber)).toBe(false);

    // Add a bookmark through the subject
    const mockBookmarks = [{
      id: '1',
      bookId,
      pageNumber,
      scrollPosition: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }];

    service.getBookmarksByBook(bookId).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/bookmarks/book/${bookId}`);
    req.flush(mockBookmarks);

    // Now it should be bookmarked
    expect(service.isPageBookmarked(bookId, pageNumber)).toBe(true);
  });

  it('should get bookmark for a specific page', () => {
    const bookId = 'book123';
    const pageNumber = 42;

    // Initially no bookmarks
    expect(service.getBookmarkForPage(bookId, pageNumber)).toBeUndefined();

    // Add a bookmark
    const mockBookmark = {
      id: '1',
      bookId,
      pageNumber,
      scrollPosition: 0,
      title: 'Test',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    service.getBookmarksByBook(bookId).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/bookmarks/book/${bookId}`);
    req.flush([mockBookmark]);

    // Now it should return the bookmark
    const found = service.getBookmarkForPage(bookId, pageNumber);
    expect(found).toBeDefined();
    expect(found?.id).toBe('1');
    expect(found?.title).toBe('Test');
  });
});
