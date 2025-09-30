import { Component, OnInit, OnDestroy, OnChanges, Input, ViewChild, ElementRef, HostListener, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfViewerComponent as NgPdfViewerComponent, PdfViewerModule } from 'ng2-pdf-viewer';
import { BookService, Book } from '../../services/book';
import { ThemeService } from '../../services/theme.service';
import { StorageService } from '../../services/storage.service';
import { ReadPagesService } from '../../services/read-pages.service';
import { EnvironmentService } from '../../services/environment.service';
import { BookmarkService, Bookmark } from '../../services/bookmark.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';



@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfViewerModule],
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.scss'
})
export class PdfViewerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() book: Book | null = null;
  @ViewChild(NgPdfViewerComponent) private pdfViewer!: NgPdfViewerComponent;


  currentPage = 1;
  totalPages = 0;
  isLoading = true;
  zoom = 1.0;
  rotation = 0;
  fitToPage = true;
  readPages = new Set<number>();
  bookmarks: Bookmark[] = [];
  showBookmarkDialog = false;
  bookmarkTitle = '';
  bookmarkNote = '';
  editingBookmark: Bookmark | null = null;
  generatingNote = false;

  // Search functionality is handled natively by PDF.js (Ctrl+F)
  public searchQuery = '';
  public totalMatches = 0;
  public currentMatchIndex = -1;


  private destroy$ = new Subject<void>();
  private progressUpdateSubject = new Subject<{ page: number; scroll: number }>();
  private preferencesUpdateSubject = new Subject<{ fitToPage: boolean; zoom: number; rotation: number }>();
  private readingStartTime = Date.now();
  private progressUpdateTimeout: any;

  constructor(
    private bookService: BookService,
    public themeService: ThemeService,
    private storageService: StorageService,
    private readPagesService: ReadPagesService,
    private environmentService: EnvironmentService,
    private bookmarkService: BookmarkService,
    private cdr: ChangeDetectorRef
  ) {
    this.progressUpdateSubject
      .pipe(
        debounceTime(2000),
        takeUntil(this.destroy$)
      )
      .subscribe(({ page, scroll }) => {
        console.log('=== PROGRESS UPDATE TRIGGERED ===');
        console.log('Progress update input:', { page, scroll });
        console.log('Current component state:', {
          hasBook: !!this.book,
          bookId: this.book?.id,
          totalPages: this.totalPages,
          readingStartTime: this.readingStartTime
        });

        if (this.book) {
          const readingTime = Math.floor((Date.now() - this.readingStartTime) / 60000);
          const isLocalFile = this.book.id.startsWith('file-');
          const progressPercentage = this.totalPages > 0 ? (page / this.totalPages) * 100 : 0;
          
          console.log('Progress calculation:', {
            bookId: this.book.id,
            page,
            scroll,
            readingTime,
            progressPercentage: progressPercentage.toFixed(2),
            isLocalFile,
            totalPages: this.totalPages
          });
          
          // Validate page number against current book's total pages
          if (page < 0 || page > this.totalPages) {
            console.log('❌ Invalid page number for current book, skipping update:', {
              page,
              totalPages: this.totalPages,
              bookId: this.book.id
            });
            return;
          }
          
          // Skip backend progress updates for local files
          if (!isLocalFile) {
            console.log('📡 Updating progress in BACKEND...');
            this.bookService.updateReadingProgress(
              this.book.id,
              page,
              scroll,
              readingTime
            ).subscribe({
              next: (progress) => {
                console.log('✅ Backend progress update successful:', progress);
              },
              error: (error) => {
                console.error('❌ Backend progress update failed:', error);
                console.error('Error details:', {
                  message: error.message,
                  status: error.status,
                  statusText: error.statusText,
                  url: error.url
                });
              }
            });
          } else {
            console.log('💾 Saving progress to LOCALSTORAGE...');
            // Save to localStorage for local files
            const progress = {
              currentPage: page,
              scrollPosition: scroll,
              progressPercentage: progressPercentage,
              lastUpdated: new Date(),
              readingTimeMinutes: readingTime
            };
            const progressKey = `progress-${this.book.id}`;
            console.log('LocalStorage save details:', {
              key: progressKey,
              progress: progress
            });
            
            try {
              localStorage.setItem(progressKey, JSON.stringify(progress));
              console.log('✅ Reading progress saved to localStorage successfully');
              
              // Verify the save
              const saved = localStorage.getItem(progressKey);
              console.log('Verification - saved value:', saved);
            } catch (error) {
              console.error('❌ Failed to save progress to localStorage:', error);
            }
          }
        } else {
          console.log('❌ No book available for progress update');
        }
        console.log('=== PROGRESS UPDATE END ===');
      });

    this.preferencesUpdateSubject
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroy$)
      )
      .subscribe(({ fitToPage, zoom, rotation }) => {
        if (this.book && !this.book.id.startsWith('file-')) {
          console.log('Saving preferences to backend for book:', this.book.id, { fitToPage, zoom, rotation });
          this.bookService.updateUserPreferences(this.book.id, {
            fitToPage,
            zoom,
            rotation
          }).subscribe({
            next: (preferences) => console.log('Preferences updated successfully:', preferences),
            error: (error) => console.error('Failed to update preferences:', error)
          });
        } else if (this.book) {
          // Save to localStorage for local files
          const preferences = { fitToPage, zoom, rotation };
          console.log('Saving preferences to localStorage for book:', this.book.id, preferences);
          localStorage.setItem(`preferences-${this.book.id}`, JSON.stringify(preferences));
          console.log('Preferences saved to localStorage successfully');
        }
      });
  }

  ngOnInit() {
    console.log('=== PDF VIEWER COMPONENT INIT ===');
    
    // Listen for navigation events from the book service
    this.bookService.navigation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pageNumber => {
        if (pageNumber && this.totalPages > 0) {
          console.log('📍 Navigation request received:', pageNumber);
          this.goToPage(pageNumber);
        }
      });
    
    console.log('=== PDF VIEWER COMPONENT INIT END ===');
  }


  ngOnChanges(changes: SimpleChanges) {
    console.log('=== PDF VIEWER CHANGES ===');
    console.log('Changes detected:', changes);
    
    if (changes['book']) {
      console.log('Book change detected:', {
        previousBook: changes['book'].previousValue?.title || 'None',
        currentBook: changes['book'].currentValue?.title || 'None',
        isFirstChange: changes['book'].firstChange
      });
      
      if (changes['book'].currentValue) {
        console.log('Resetting component state for new book...');
        // Reset state when book changes - actual loading will happen in onLoadComplete
        this.currentPage = 1;
        this.totalPages = 0;
        this.isLoading = true;
        this.readingStartTime = Date.now(); // Reset reading time for new book
        console.log('State reset:', {
          currentPage: this.currentPage,
          totalPages: this.totalPages,
          isLoading: this.isLoading,
          readingStartTime: this.readingStartTime
        });
        
      }
    }
    console.log('=== PDF VIEWER CHANGES END ===');
  }

  private loadReadPagesForCurrentBook(): void {
    if (this.book) {
      this.totalPages = this.book.totalPages;
      this.readPages.clear(); // Clear previous read pages
      
      // Load read pages from backend API for non-local files
      if (!this.book.id.startsWith('file-')) {
        this.storageService.getReadPages(this.book.id).subscribe({
          next: (pages) => {
            this.readPages = new Set(pages);
            console.log('Loaded read pages from backend:', pages);
          },
          error: (error) => {
            console.error('Error loading read pages from backend:', error);
            this.readPages = new Set();
          }
        });
      } else {
        // Fallback to localStorage for local files
        const storedReadPages = localStorage.getItem(`read-pages-${this.book.id}`);
        if (storedReadPages) {
          try {
            const pages = JSON.parse(storedReadPages);
            this.readPages = new Set(pages);
          } catch (error) {
            console.error('Error loading read pages from localStorage:', error);
            this.readPages = new Set();
          }
        }
      }
    }
  }

  private loadUserPreferences(): void {
    if (this.book) {
      console.log('Loading user preferences for book:', this.book.id, 'isLocalFile:', this.book.id.startsWith('file-'));
      
      if (!this.book.id.startsWith('file-')) {
        // Load from backend API for non-local files
        this.bookService.getUserPreferences(this.book.id).subscribe({
          next: (preferences) => {
            console.log('Received preferences from backend:', preferences);
            this.fitToPage = preferences.fitToPage;
            this.zoom = preferences.zoom;
            this.rotation = preferences.rotation;
            console.log('Applied preferences - fitToPage:', this.fitToPage, 'zoom:', this.zoom, 'rotation:', this.rotation);
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 100);
          },
          error: (error) => {
            console.error('Error loading user preferences from backend:', error);
            // Use defaults
            this.fitToPage = true;
            this.zoom = 1.0;
            this.rotation = 0;
            console.log('Using default preferences - fitToPage:', this.fitToPage, 'zoom:', this.zoom, 'rotation:', this.rotation);
          }
        });
      } else {
        // Load from localStorage for local files
        const storedPreferences = localStorage.getItem(`preferences-${this.book.id}`);
        console.log('localStorage key:', `preferences-${this.book.id}`, 'value:', storedPreferences);
        
        if (storedPreferences) {
          try {
            const preferences = JSON.parse(storedPreferences);
            this.fitToPage = preferences.fitToPage ?? true;
            this.zoom = preferences.zoom ?? 1.0;
            this.rotation = preferences.rotation ?? 0;
            console.log('Loaded user preferences from localStorage:', preferences);
            console.log('Applied preferences - fitToPage:', this.fitToPage, 'zoom:', this.zoom, 'rotation:', this.rotation);
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 100);
          } catch (error) {
            console.error('Error loading user preferences from localStorage:', error);
            // Use defaults
            this.fitToPage = true;
            this.zoom = 1.0;
            this.rotation = 0;
            console.log('Using default preferences after error - fitToPage:', this.fitToPage, 'zoom:', this.zoom, 'rotation:', this.rotation);
          }
        } else {
          // Use defaults if no stored preferences
          this.fitToPage = true;
          this.zoom = 1.0;
          this.rotation = 0;
          console.log('No stored preferences found, using defaults - fitToPage:', this.fitToPage, 'zoom:', this.zoom, 'rotation:', this.rotation);
        }
      }
    } else {
      console.log('No book available for loading preferences');
    }
  }

  private loadReadingProgress(): void {
    console.log('=== LOAD READING PROGRESS START ===');
    console.log('Current component state:', {
      hasBook: !!this.book,
      bookId: this.book?.id,
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      isLoading: this.isLoading
    });

    if (this.book) {
      const isLocalFile = this.book.id.startsWith('file-');
      console.log('Book details:', {
        id: this.book.id,
        title: this.book.title,
        isLocalFile: isLocalFile,
        totalPages: this.book.totalPages
      });
      
      if (!isLocalFile) {
        console.log('Loading reading progress from BACKEND for book:', this.book.id);
        // Load from backend API for non-local files
        this.bookService.getReadingProgress(this.book.id).subscribe({
          next: (progress) => {
            console.log('Backend API response received:', progress);
            if (progress) {
              console.log('✅ Reading progress found in backend:', {
                id: progress.id,
                bookId: progress.bookId,
                currentPage: progress.currentPage,
                scrollPosition: progress.scrollPosition,
                progressPercentage: progress.progressPercentage,
                lastUpdated: progress.lastUpdated,
                readingTimeMinutes: progress.readingTimeMinutes
              });
              console.log('Navigating to saved page:', progress.currentPage);
              this.goToPage(progress.currentPage);
            } else {
              console.log('❌ No reading progress found for this book in backend');
              console.log('Starting from page 1');
            }
          },
          error: (error) => {
            console.error('❌ Error loading reading progress from backend:', error);
            console.error('Error details:', {
              message: error.message,
              status: error.status,
              statusText: error.statusText,
              url: error.url
            });
          }
        });
      } else {
        console.log('Loading reading progress from LOCALSTORAGE for book:', this.book.id);
        // Load from localStorage for local files
        const progressKey = `progress-${this.book.id}`;
        const storedProgress = localStorage.getItem(progressKey);
        console.log('LocalStorage lookup:', {
          key: progressKey,
          found: !!storedProgress,
          value: storedProgress
        });
        
        if (storedProgress) {
          try {
            const progress = JSON.parse(storedProgress);
            console.log('✅ Reading progress parsed from localStorage:', {
              currentPage: progress.currentPage,
              scrollPosition: progress.scrollPosition,
              progressPercentage: progress.progressPercentage,
              lastUpdated: progress.lastUpdated,
              readingTimeMinutes: progress.readingTimeMinutes
            });
            const targetPage = progress.currentPage || 1;
            console.log('Navigating to saved page:', targetPage);
            this.goToPage(targetPage);
          } catch (error) {
            console.error('❌ Error parsing reading progress from localStorage:', error);
            console.error('Stored value was:', storedProgress);
            this.currentPage = 1;
            console.log('Falling back to page 1');
          }
        } else {
          console.log('❌ No stored reading progress found in localStorage');
          console.log('Starting from page 1');
          this.currentPage = 1;
        }
      }
    } else {
      console.log('❌ No book available for loading reading progress');
    }
    console.log('=== LOAD READING PROGRESS END ===');
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // if (event.code === 'Space' && this.book) {
    //   event.preventDefault();
    //   this.toggleCurrentPageRead();
    // }
    // PDF.js handles Ctrl+F search natively
  }

  ngOnDestroy() {
    console.log('=== PDF VIEWER COMPONENT DESTROY ===');
    
    if (this.progressUpdateTimeout) {
      clearTimeout(this.progressUpdateTimeout);
    }
    
    this.destroy$.next();
    this.destroy$.complete();
    console.log('Component destroyed and cleaned up');
    console.log('=== PDF VIEWER COMPONENT DESTROY END ===');
  }

  onLoadComplete(event: any) {
    console.log('=== PDF LOAD COMPLETE ===');
    console.log('Load complete event:', event);
    console.log('Previous state:', {
      totalPages: this.totalPages,
      currentPage: this.currentPage,
      isLoading: this.isLoading
    });

    this.totalPages = event.numPages;
    this.isLoading = false;
    
    console.log('✅ PDF loaded successfully:', {
      totalPages: this.totalPages,
      bookTitle: this.book?.title,
      bookId: this.book?.id,
      currentPage: this.currentPage,
      isLoading: this.isLoading
    });
    
    // Update book with actual page count
    if (this.book && this.totalPages !== this.book.totalPages) {
      console.log('📝 Updating book total pages:', {
        oldTotal: this.book.totalPages,
        newTotal: this.totalPages
      });
      const updatedBook = {
        ...this.book,
        totalPages: this.totalPages
      };
      this.bookService.setCurrentBook(updatedBook);
    }
    
    console.log('🔧 Starting post-load initialization...');
    
    // Setup PDF.js native search integration
    console.log('Setting up search listener...');
    this.setupSearchListener();
    
    // Load preferences after PDF is fully loaded
    console.log('Loading user preferences...');
    this.loadUserPreferences();
    
    // Reload read pages now that we have the correct total pages
    console.log('Loading read pages...');
    this.loadReadPagesForCurrentBook();
    
    // Load reading progress
    this.loadReadingProgress();

    // Load bookmarks
    console.log('Loading bookmarks...');
    this.loadBookmarks();

    console.log('=== PDF LOAD COMPLETE END ===');
  }

  onPagesInitialized(event: any) {
    console.log('=== PAGES INITIALIZED ===');
    console.log('Pages initialized event:', event);
    console.log('Current state:', {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      isLoading: this.isLoading
    });
    console.log('=== PAGES INITIALIZED END ===');
  }

  onPageRendered(event: any) {
    const newPageNumber = event.pageNumber;
    
    if (this.currentPage !== newPageNumber) {
      this.currentPage = newPageNumber;
      console.log('Page changed to:', this.currentPage);
      this.updateProgress();
    }
  }

  onError(error: any) {
    console.error('PDF Viewer Error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      book: this.book ? {
        id: this.book.id,
        title: this.book.title,
        fileType: typeof this.book.filePath,
        fileSize: this.book.filePath instanceof Uint8Array ? this.book.filePath.byteLength : 'not Uint8Array'
      } : null
    });
    this.isLoading = false;
  }

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    this.progressUpdateSubject.next({
      page: this.currentPage,
      scroll: element.scrollTop
    });
  }

  nextPage() {
    console.log('=== NEXT PAGE ===');
    console.log('Current state:', { currentPage: this.currentPage, totalPages: this.totalPages });
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    } else {
      console.log('❌ Already on last page, cannot go to next');
    }
    console.log('=== NEXT PAGE END ===');
  }

  previousPage() {
    console.log('=== PREVIOUS PAGE ===');
    console.log('Current state:', { currentPage: this.currentPage, totalPages: this.totalPages });
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    } else {
      console.log('❌ Already on first page, cannot go to previous');
    }
    console.log('=== PREVIOUS PAGE END ===');
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && this.pdfViewer?.pdfViewer) {
      console.log('Navigating to page:', page);
      this.pdfViewer.pdfViewer.currentPageNumber = page;
    }
  }


  zoomIn() {
    this.zoom = Math.min(this.zoom + 0.1, 3.0);
    this.updatePreferences();
  }

  zoomOut() {
    this.zoom = Math.max(this.zoom - 0.1, 0.5);
    this.updatePreferences();
  }

  rotateClockwise() {
    this.rotation = (this.rotation + 90) % 360;
    this.updatePreferences();
  }

  rotateCounterClockwise() {
    this.rotation = (this.rotation - 90 + 360) % 360;
    this.updatePreferences();
  }

  private updateProgress() {
    if (this.progressUpdateTimeout) {
      clearTimeout(this.progressUpdateTimeout);
    }
    
    this.progressUpdateTimeout = setTimeout(() => {
      this.progressUpdateSubject.next({
        page: this.currentPage,
        scroll: 0
      });
    }, 1000);
  }

  private updatePreferences() {
    this.preferencesUpdateSubject.next({
      fitToPage: this.fitToPage,
      zoom: this.zoom,
      rotation: this.rotation
    });
  }

  getProgressPercentage(): number {
    return this.totalPages > 0 ? (this.currentPage / this.totalPages) * 100 : 0;
  }

  getPdfSource(): string | Uint8Array | undefined {
    if (!this.book?.filePath) {
      return undefined;
    }
    
    // Handle Uint8Array case (direct file data)
    if (this.book.filePath instanceof Uint8Array) {
      return this.book.filePath;
    }
    
    // Handle string file paths
    const filePath = this.book.filePath as string;
    
    // If it's already a full URL, return as is
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    // Get base URL from environment or current location
    const baseUrl = this.getApiBaseUrl();
    
    // If it's a relative path, construct the full URL
    if (filePath.startsWith('uploads/')) {
      return `${baseUrl}/${filePath}`;
    }
    
    // If it starts with just the filename or other path, prepend uploads/
    return `${baseUrl}/uploads/${filePath.replace(/^.*[\\\/]/, '')}`;
  }

  private getApiBaseUrl(): string {
    return this.environmentService.getApiBaseUrl();
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  toggleFitToPage(): void {
    this.fitToPage = !this.fitToPage;
    this.updatePreferences();
  }

  toggleCurrentPageRead(): void {
    if (!this.book) return;

    const wasRead = this.readPages.has(this.currentPage);
    
    // Update UI immediately
    if (wasRead) {
      this.readPages.delete(this.currentPage);
    } else {
      this.readPages.add(this.currentPage);
    }

    // Save to backend API for non-local files
    if (!this.book.id.startsWith('file-')) {
      const apiCall = wasRead 
        ? this.storageService.unmarkPageAsRead(this.book.id, this.currentPage)
        : this.storageService.markPageAsRead(this.book.id, this.currentPage);

      apiCall.subscribe({
        next: (updatedPages) => {
          this.readPages = new Set(updatedPages);
          console.log('Updated read pages:', updatedPages);
        },
        error: (error) => {
          console.error('Failed to update read pages on server:', error);
          // Revert UI change on error
          if (wasRead) {
            this.readPages.add(this.currentPage);
          } else {
            this.readPages.delete(this.currentPage);
          }
        }
      });
    } else {
      // Fallback to localStorage for local files
      localStorage.setItem(`read-pages-${this.book.id}`, JSON.stringify([...this.readPages]));
    }
  }

  isPageRead(page: number): boolean {
    return this.readPages.has(page);
  }

  getPageSegments(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getPageWidth(): number {
    return this.totalPages > 0 ? 100 / this.totalPages : 0;
  }

  trackByPageNumber(index: number, page: number): number {
    return page;
  }

  private setupSearchListener(): void {
    console.log('PDF.js native search is enabled - use Ctrl+F to search within the PDF');
    
    // Set up keyboard event listener to detect Ctrl+F usage
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        console.log('Ctrl+F detected - native PDF search will be activated');
        // The native PDF.js search will handle this automatically
      }
    });
  }

  // Method to programmatically search in PDF
  public searchInPdf(searchQuery: string, findPrevious = false): void {
		console.log('pdfViewerElement:', this.pdfViewer);
    const pdfViewerElement = this.pdfViewer;
		console.log('pdfViewerElement:', pdfViewerElement);
    if (!pdfViewerElement) {
      console.log('PDF viewer element not found');
      return;
    }

    // Try to access the ng2-pdf-viewer component instance
    if (pdfViewerElement.eventBus) {
      console.log('Dispatching search via ng2-pdf-viewer EventBus:', searchQuery);
      
      pdfViewerElement.eventBus.dispatch('find', {
        query: searchQuery,
        type: 'again',
        caseSensitive: false,
        findPrevious: findPrevious,
        highlightAll: true,
        phraseSearch: true
      });
    } else {
      console.log('Could not access ng2-pdf-viewer EventBus for programmatic search');
    }
  }

  // Bookmark methods
  loadBookmarks(): void {
    if (this.book && !this.book.id.startsWith('file-')) {
      this.bookmarkService.getBookmarksByBook(this.book.id).subscribe({
        next: (bookmarks) => {
          this.bookmarks = bookmarks;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading bookmarks:', error);
        }
      });
    }
  }

  isCurrentPageBookmarked(): boolean {
    if (!this.book) return false;
    return this.bookmarkService.isPageBookmarked(this.book.id, this.currentPage);
  }

  getCurrentPageBookmark(): Bookmark | undefined {
    if (!this.book) return undefined;
    return this.bookmarkService.getBookmarkForPage(this.book.id, this.currentPage);
  }

  toggleBookmark(): void {
    if (!this.book) return;

    const existingBookmark = this.getCurrentPageBookmark();

    if (existingBookmark) {
      // Remove bookmark
      this.bookmarkService.deleteBookmark(existingBookmark.id).subscribe({
        next: () => {
          console.log('Bookmark deleted');
          this.loadBookmarks();
        },
        error: (error) => {
          console.error('Error deleting bookmark:', error);
        }
      });
    } else {
      // Open dialog to create bookmark
      this.openBookmarkDialog();
    }
  }

  openBookmarkDialog(bookmark?: Bookmark): void {
    this.editingBookmark = bookmark || null;
    this.bookmarkTitle = bookmark?.title || `Page ${this.currentPage}`;
    this.bookmarkNote = bookmark?.note || '';
    this.showBookmarkDialog = true;
  }

  closeBookmarkDialog(): void {
    this.showBookmarkDialog = false;
    this.editingBookmark = null;
    this.bookmarkTitle = '';
    this.bookmarkNote = '';
    this.generatingNote = false;
  }

  generateNoteWithAI(): void {
    if (!this.book || this.generatingNote) return;

    this.generatingNote = true;

    this.bookmarkService.generateNote(this.book.id, this.currentPage).subscribe({
      next: (response) => {
        this.bookmarkNote = response.note;
        this.generatingNote = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error generating note:', error);
        alert('Failed to generate note. Please make sure Ollama is running and the model is available.');
        this.generatingNote = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveBookmark(): void {
    if (!this.book) return;

    if (this.editingBookmark) {
      // Update existing bookmark
      this.bookmarkService.updateBookmark(this.editingBookmark.id, {
        title: this.bookmarkTitle,
        note: this.bookmarkNote
      }).subscribe({
        next: () => {
          console.log('Bookmark updated');
          this.loadBookmarks();
          this.closeBookmarkDialog();
        },
        error: (error) => {
          console.error('Error updating bookmark:', error);
        }
      });
    } else {
      // Create new bookmark
      const scrollPosition = this.getScrollPosition();
      this.bookmarkService.createBookmark({
        bookId: this.book.id,
        pageNumber: this.currentPage,
        scrollPosition: scrollPosition,
        title: this.bookmarkTitle,
        note: this.bookmarkNote
      }).subscribe({
        next: () => {
          console.log('Bookmark created');
          this.loadBookmarks();
          this.closeBookmarkDialog();
        },
        error: (error) => {
          console.error('Error creating bookmark:', error);
        }
      });
    }
  }

  goToBookmark(bookmark: Bookmark): void {
    this.goToPage(bookmark.pageNumber);
  }

  deleteBookmarkById(id: string): void {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      this.bookmarkService.deleteBookmark(id).subscribe({
        next: () => {
          console.log('Bookmark deleted');
          this.loadBookmarks();
        },
        error: (error) => {
          console.error('Error deleting bookmark:', error);
        }
      });
    }
  }

  private getScrollPosition(): number {
    const container = document.querySelector('.pdf-container');
    if (container) {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      return scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    }
    return 0;
  }

}
