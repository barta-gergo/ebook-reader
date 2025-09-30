import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService, Book, SearchResult } from '../../services/book';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.scss'
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQuery = '';
  searchResults: SearchResult[] = [];
  isSearching = false;
  isSearchVisible = false;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private bookService: BookService) {}

  ngOnInit() {
    // Set up debounced search
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (query.trim().length < 2) {
            return of([]);
          }
          this.isSearching = true;
          return this.bookService.searchBooksByContent(query.trim());
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          this.isSearching = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.searchResults = [];
          this.isSearching = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    // Handle Ctrl+K shortcut to open search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      if (!this.isSearchVisible) {
        this.toggleSearch();
      }
    }
    
    // Handle Escape key to close search
    if (event.key === 'Escape' && this.isSearchVisible) {
      this.clearSearch();
    }
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  toggleSearch() {
    this.isSearchVisible = !this.isSearchVisible;
    if (this.isSearchVisible) {
      // Focus the input after a short delay to allow for rendering
      setTimeout(() => {
        const input = document.querySelector('.global-search-input') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    } else {
      this.clearSearch();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearchVisible = false;
  }

  selectBook(result: SearchResult) {
    console.log('🔍 Search: selectBook called with result:', result);
    
    // Ensure the book object has all required fields properly set
    const book: Book = {
      id: result.book.id,
      title: result.book.title,
      author: result.book.author,
      filePath: result.book.filePath,
      fileSize: result.book.fileSize,
      mimeType: result.book.mimeType || 'application/pdf',
      totalPages: result.book.totalPages,
      subject: result.book.subject,
      keywords: result.book.keywords,
      creator: result.book.creator,
      producer: result.book.producer,
      creationDate: result.book.creationDate ? new Date(result.book.creationDate) : undefined,
      modificationDate: result.book.modificationDate ? new Date(result.book.modificationDate) : undefined,
      version: result.book.version,
      textLength: result.book.textLength,
      addedAt: new Date(result.book.addedAt),
      lastOpened: result.book.lastOpened ? new Date(result.book.lastOpened) : undefined,
    };
    
    // Set the book and navigate to page in one call
    this.bookService.setCurrentBookWithPage(book, result.pageNumber);
    console.log('✅ BookService.setCurrentBookWithPage called with page:', result.pageNumber);
    
    this.clearSearch();
  }

  highlightSearchTerm(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}