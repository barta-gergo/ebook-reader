import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { EnvironmentService } from './environment.service';

export interface Book {
  id: string;
  title: string;
  author: string;
  filePath: string | Uint8Array;
  fileSize: number;
  mimeType: string;
  totalPages: number;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  version?: string;
  textLength?: number;
  addedAt: Date;
  lastOpened?: Date;
}

export interface ReadingProgress {
  id: string;
  bookId: string;
  currentPage: number;
  scrollPosition: number;
  progressPercentage: number;
  lastUpdated: Date;
  readingTimeMinutes: number;
}

export interface CreateBookDto {
  title: string;
  author: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  totalPages: number;
}

export interface UserPreferences {
  id?: string;
  bookId: string;
  fitToPage: boolean;
  zoom: number;
  rotation: number;
  lastUpdated?: Date;
}

export interface SearchResult {
  book: Book;
  snippets: string[];
  relevanceScore: number;
  pageNumber?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private readonly apiUrl: string;
  private currentBookSubject = new BehaviorSubject<Book | null>(null);
  public currentBook$ = this.currentBookSubject.asObservable();
  
  private navigationSubject = new BehaviorSubject<number | null>(null);
  public navigation$ = this.navigationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private environmentService: EnvironmentService
  ) { 
    this.apiUrl = this.environmentService.getApiBaseUrl();
  }

  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books`);
  }

  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/books/${id}`);
  }

  addBook(bookData: CreateBookDto): Observable<Book> {
    return this.http.post<Book>(`${this.apiUrl}/books`, bookData);
  }

  updateReadingProgress(bookId: string, currentPage: number, scrollPosition: number, additionalTime = 0): Observable<ReadingProgress> {
    return this.http.put<ReadingProgress>(`${this.apiUrl}/books/${bookId}/progress`, {
      currentPage,
      scrollPosition,
      additionalReadingTime: additionalTime
    });
  }

  searchBooksByTitle(query: string): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books/search/title?q=${encodeURIComponent(query)}`);
  }

  searchBooksByAuthor(query: string): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books/search/author?q=${encodeURIComponent(query)}`);
  }

  setCurrentBook(book: Book | null): void {
    console.log('📚 BookService: setCurrentBook called with:', book);
    this.currentBookSubject.next(book);
    console.log('📚 BookService: currentBookSubject.next() completed');
  }

  getCurrentBook(): Book | null {
    return this.currentBookSubject.value;
  }

  getUserPreferences(bookId: string): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.apiUrl}/books/${bookId}/preferences`);
  }

  updateUserPreferences(bookId: string, updates: { fitToPage?: boolean; zoom?: number; rotation?: number }): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.apiUrl}/books/${bookId}/preferences`, updates);
  }

  getReadingProgress(bookId: string): Observable<ReadingProgress | null> {
    return this.http.get<ReadingProgress | null>(`${this.apiUrl}/books/${bookId}/progress`);
  }

  searchBooksByContent(query: string, limit = 20): Observable<SearchResult[]> {
    const params = new URLSearchParams();
    params.set('q', query);
    if (limit !== 20) {
      params.set('limit', limit.toString());
    }
    return this.http.get<SearchResult[]>(`${this.apiUrl}/books/search/content?${params.toString()}`);
  }

  setCurrentBookWithPage(book: Book, pageNumber?: number): void {
    console.log('📚 BookService: setCurrentBookWithPage called with:', book, 'page:', pageNumber);
    this.currentBookSubject.next(book);
    if (pageNumber) {
      this.navigationSubject.next(pageNumber);
    }
  }

  navigateToPage(pageNumber: number): void {
    console.log('📚 BookService: navigateToPage called with:', pageNumber);
    this.navigationSubject.next(pageNumber);
  }

  getRecentBooks(limit: number = 10): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books/recent?limit=${limit}`);
  }

  updateLastOpened(bookId: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/books/${bookId}/last-opened`, {});
  }
}
