import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { BookService, Book } from '../../services/book';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-recent-books',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-books.component.html',
  styleUrl: './recent-books.component.scss'
})
export class RecentBooksComponent implements OnInit {
  recentBooks$: Observable<Book[]>;
  isCollapsed = false;

  constructor(
    private bookService: BookService,
    private storageService: StorageService
  ) {
    this.recentBooks$ = this.bookService.getRecentBooks(5);
  }

  ngOnInit() {
    // Component initialization
  }

  continueReading(book: Book, event: Event) {
    event.stopPropagation(); // Prevent book selection when clicking continue

    // Load full book from storage
    const fullBook = this.storageService.loadBookFromLibrary(book.id);

    if (fullBook) {
      // Set as current book
      this.bookService.setCurrentBook(fullBook);

      // Update lastOpened timestamp
      this.bookService.updateLastOpened(book.id).subscribe();

      // Jump to last read page if progress exists
      if ((book as any).currentPage && (book as any).currentPage > 1) {
        // Small delay to ensure PDF viewer is ready
        setTimeout(() => {
          // The PDF viewer will handle navigation via the book service
          console.log(`Navigating to page ${(book as any).currentPage}`);
        }, 100);
      }
    }
  }

  getTimeAgo(date: Date | string | undefined): string {
    if (!date) return 'Never opened';

    const now = new Date().getTime();
    const opened = new Date(date).getTime();
    const diff = now - opened;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }

  getProgress(book: any): number {
    const progress = book.progress || 0;
    return Math.round(progress);
  }

  getCurrentPage(book: any): number {
    return book.currentPage || 1;
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  isCurrentBook(book: Book): boolean {
    const current = this.bookService.getCurrentBook();
    return current?.id === book.id;
  }
}
