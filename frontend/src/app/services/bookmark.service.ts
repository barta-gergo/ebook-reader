import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EnvironmentService } from './environment.service';

export interface Bookmark {
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

@Injectable({
  providedIn: 'root'
})
export class BookmarkService {
  private readonly apiUrl: string;
  private bookmarksSubject = new BehaviorSubject<Bookmark[]>([]);
  public bookmarks$ = this.bookmarksSubject.asObservable();

  constructor(
    private http: HttpClient,
    private environmentService: EnvironmentService
  ) {
    this.apiUrl = this.environmentService.getApiBaseUrl();
  }

  createBookmark(request: CreateBookmarkRequest): Observable<Bookmark> {
    return this.http.post<Bookmark>(`${this.apiUrl}/bookmarks`, request).pipe(
      tap(() => {
        if (request.bookId) {
          this.loadBookmarksByBook(request.bookId).subscribe();
        }
      })
    );
  }

  getBookmark(id: string): Observable<Bookmark> {
    return this.http.get<Bookmark>(`${this.apiUrl}/bookmarks/${id}`);
  }

  getAllBookmarks(): Observable<Bookmark[]> {
    return this.http.get<Bookmark[]>(`${this.apiUrl}/bookmarks`).pipe(
      tap(bookmarks => this.bookmarksSubject.next(bookmarks))
    );
  }

  getBookmarksByBook(bookId: string): Observable<Bookmark[]> {
    return this.http.get<Bookmark[]>(`${this.apiUrl}/bookmarks/book/${bookId}`).pipe(
      tap(bookmarks => this.bookmarksSubject.next(bookmarks))
    );
  }

  loadBookmarksByBook(bookId: string): Observable<Bookmark[]> {
    return this.getBookmarksByBook(bookId);
  }

  updateBookmark(id: string, request: UpdateBookmarkRequest): Observable<Bookmark> {
    return this.http.put<Bookmark>(`${this.apiUrl}/bookmarks/${id}`, request).pipe(
      tap(bookmark => {
        const current = this.bookmarksSubject.value;
        const index = current.findIndex(b => b.id === id);
        if (index !== -1) {
          current[index] = bookmark;
          this.bookmarksSubject.next([...current]);
        }
      })
    );
  }

  deleteBookmark(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bookmarks/${id}`).pipe(
      tap(() => {
        const current = this.bookmarksSubject.value;
        this.bookmarksSubject.next(current.filter(b => b.id !== id));
      })
    );
  }

  deleteAllBookmarks(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/bookmarks`).pipe(
      tap(() => this.bookmarksSubject.next([]))
    );
  }

  isPageBookmarked(bookId: string, pageNumber: number): boolean {
    return this.bookmarksSubject.value.some(
      b => b.bookId === bookId && b.pageNumber === pageNumber
    );
  }

  getBookmarkForPage(bookId: string, pageNumber: number): Bookmark | undefined {
    return this.bookmarksSubject.value.find(
      b => b.bookId === bookId && b.pageNumber === pageNumber
    );
  }

  generateNote(bookId: string, pageNumber: number): Observable<{ note: string }> {
    return this.http.post<{ note: string }>(`${this.apiUrl}/bookmarks/generate-note`, {
      bookId,
      pageNumber
    });
  }
}
