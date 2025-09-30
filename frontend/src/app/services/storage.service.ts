import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Book } from './book';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface StoredBook {
  id: string;
  title: string;
  author: string;
  fileData: string; // Base64 encoded
  fileSize: number;
  mimeType: string;
  totalPages: number;
  addedAt: string;
  lastOpened?: string;
  lastPage?: number;
  lastScroll?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly LAST_BOOK_KEY = 'ebook-reader-last-book';
  private readonly API_URL = environment.apiUrl;
  
  private librarySubject = new BehaviorSubject<StoredBook[]>([]);
  public library$ = this.librarySubject.asObservable();

  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) {
    this.loadLibrary();
  }

  private getDownloadUrl(bookId: string): string {
    const token = this.authService.getAuthToken();
    return `${this.API_URL}/books/${bookId}/download?token=${encodeURIComponent(token || '')}`;
  }

  public loadLibrary(): void {
    this.http.get<any[]>(`${this.API_URL}/books`).pipe(
      map(books => books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        fileData: '', // Not needed for listing
        fileSize: book.fileSize,
        mimeType: book.mimeType,
        totalPages: book.totalPages,
        addedAt: book.addedAt,
        lastOpened: book.lastOpened
      }))),
      catchError(error => {
        console.error('Failed to load library from backend:', error);
        return [];
      })
    ).subscribe(library => {
			console.log('library:', library);
      this.librarySubject.next(library);
    });
  }

  public uploadBookFile(file: File): Observable<Book> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.API_URL}/books/upload`, formData).pipe(
      map(bookResponse => ({
        id: bookResponse.id,
        title: bookResponse.title,
        author: bookResponse.author,
        filePath: this.getDownloadUrl(bookResponse.id),
        fileSize: bookResponse.fileSize,
        mimeType: bookResponse.mimeType,
        totalPages: bookResponse.totalPages,
        addedAt: new Date(bookResponse.addedAt),
        lastOpened: bookResponse.lastOpened ? new Date(bookResponse.lastOpened) : undefined
      })),
      catchError(error => {
        console.error('Failed to upload book:', error);
        throw error;
      })
    );
  }

  public loadBookFromLibrary(bookId: string): Book | null {
    const library = this.librarySubject.value;
    const storedBook = library.find(b => b.id === bookId);
    
    if (storedBook) {
      console.log('Loading book from library:', {
        bookId,
        title: storedBook.title
      });
      
      return {
        id: storedBook.id,
        title: storedBook.title,
        author: storedBook.author,
        filePath: this.getDownloadUrl(storedBook.id),
        fileSize: storedBook.fileSize,
        mimeType: storedBook.mimeType,
        totalPages: storedBook.totalPages,
        addedAt: new Date(storedBook.addedAt),
        lastOpened: storedBook.lastOpened ? new Date(storedBook.lastOpened) : undefined
      };
    }
    
    console.log('Book not found in library:', bookId);
    return null;
  }

  public saveLastOpenedBook(book: Book): void {
    // Just save the book ID locally
    localStorage.setItem(this.LAST_BOOK_KEY, book.id);
  }

  public getLastOpenedBook(): Book | null {
    try {
      const lastBookId = localStorage.getItem(this.LAST_BOOK_KEY);
      if (lastBookId) {
        return this.loadBookFromLibrary(lastBookId);
      }
    } catch (error) {
      console.error('Failed to load last opened book:', error);
    }
    
    return null;
  }

  public removeBookFromLibrary(bookId: string): void {
    this.http.delete(`${this.API_URL}/books/${bookId}`).subscribe({
      next: () => {
        // Remove from local library list
        const currentLibrary = this.librarySubject.value;
        const filteredLibrary = currentLibrary.filter(b => b.id !== bookId);
        this.librarySubject.next(filteredLibrary);
        
        // Clear last opened if it was this book
        const lastBookId = localStorage.getItem(this.LAST_BOOK_KEY);
        if (lastBookId === bookId) {
          localStorage.removeItem(this.LAST_BOOK_KEY);
        }
      },
      error: (error) => {
        console.error('Failed to remove book from backend:', error);
      }
    });
  }

  public getReadPages(bookId: string): Observable<number[]> {
    return this.http.get<{readPages: number[]}>(`${this.API_URL}/books/${bookId}/read-pages`).pipe(
      map(response => response.readPages),
      catchError(error => {
        console.error('Failed to get read pages:', error);
        return [];
      })
    );
  }

  public markPageAsRead(bookId: string, pageNumber: number): Observable<number[]> {
    return this.http.post<{readPages: number[]}>(`${this.API_URL}/books/${bookId}/read-pages/${pageNumber}`, {}).pipe(
      map(response => response.readPages),
      catchError(error => {
        console.error('Failed to mark page as read:', error);
        throw error;
      })
    );
  }

  public unmarkPageAsRead(bookId: string, pageNumber: number): Observable<number[]> {
    return this.http.delete<{readPages: number[]}>(`${this.API_URL}/books/${bookId}/read-pages/${pageNumber}`).pipe(
      map(response => response.readPages),
      catchError(error => {
        console.error('Failed to unmark page as read:', error);
        throw error;
      })
    );
  }

}