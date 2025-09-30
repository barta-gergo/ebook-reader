import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService, Book } from '../../services/book';
import { StorageService } from '../../services/storage.service';
import { CoverService } from '../../services/cover.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RecentBooksComponent } from '../recent-books/recent-books.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RecentBooksComponent],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss'
})
export class BookListComponent implements OnInit {
  books$: Observable<Book[]>;

  constructor(
    private bookService: BookService,
    private storageService: StorageService,
    private coverService: CoverService
  ) {
    // Show stored library books instead of backend books for local files
    this.books$ = this.storageService.library$.pipe(
      map(storedBooks => storedBooks.map(stored => ({
        id: stored.id,
        title: stored.title,
        author: stored.author,
        filePath: '', // Empty string for display, will load from storage when selected
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
        totalPages: stored.totalPages,
        addedAt: new Date(stored.addedAt),
        lastOpened: stored.lastOpened ? new Date(stored.lastOpened) : undefined
      })))
    );
  }

  ngOnInit() {
    // Load books on initialization
  }

  selectBook(book: Book) {
    // Load the full book data from storage
    const fullBook = this.storageService.loadBookFromLibrary(book.id);
    if (fullBook) {
      this.bookService.setCurrentBook(fullBook);
    }
  }

  isCurrentBook(book: Book): boolean {
    const current = this.bookService.getCurrentBook();
    return current?.id === book.id;
  }

  deleteBook(book: Book, event: Event): void {
    event.stopPropagation(); // Prevent book selection when clicking delete

    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      this.storageService.removeBookFromLibrary(book.id);

      // If this was the current book, clear it
      if (this.isCurrentBook(book)) {
        this.bookService.setCurrentBook(null);
      }
    }
  }

  getCoverUrl(bookId: string): string {
    let url = '';
    this.coverService.getCoverUrl(bookId, 'thumbnail').subscribe(coverUrl => {
      url = coverUrl;
    });
    return url || this.coverService.getPlaceholderUrl();
  }

  onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.coverService.getPlaceholderUrl();
  }
}
