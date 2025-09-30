import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer';
import { SidePanelComponent } from './components/side-panel';
import { SearchComponent } from './components/search/search';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { LoginComponent } from './components/login/login.component';
import { BookService, Book } from './services/book';
import { ThemeService } from './services/theme.service';
import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PdfViewerComponent, SidePanelComponent, SearchComponent, UserProfileComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  currentBook: Book | null = null;
  showSidePanel = false;
  sidebarWidth = 300;
  isAuthenticated = false;
  isAuthCallback = false;
  private isResizing = false;
  private readonly SIDE_PANEL_SHOW_KEY = 'ebook-reader-show-side-panel';
  private readonly SIDEBAR_WIDTH_KEY = 'ebook-reader-sidebar-width';

  constructor(
    private bookService: BookService, 
    private themeService: ThemeService,
    private storageService: StorageService,
    private authService: AuthService,
    private router: Router
  ) {
    this.bookService.currentBook$.subscribe(book => {
      this.currentBook = book;
      if (book) {
        this.storageService.saveLastOpenedBook(book);
      }
    });
    
    // Initialize theme service and make dark mode default
    this.themeService.setDarkMode(true);
    this.themeService.isDarkMode$.subscribe();
  }

  ngOnInit() {
    // Track route changes to detect auth callback
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isAuthCallback = event.url.startsWith('/auth/callback');
    });

    // Initialize Google Auth
    this.authService.initializeGoogleAuth().catch(error => {
      console.error('Failed to initialize Google Auth:', error);
    });

    // Subscribe to authentication state
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
    });

    // Wait for library to load, then load last opened book
    this.storageService.library$.subscribe(library => {
      if (library.length > 0 && !this.currentBook) {
        const lastBook = this.storageService.getLastOpenedBook();
        if (lastBook) {
          this.bookService.setCurrentBook(lastBook);
        }
      }
    });
    
    // Load side panel show/hide state
    const showSidePanelState = localStorage.getItem(this.SIDE_PANEL_SHOW_KEY);
    if (showSidePanelState !== null) {
      this.showSidePanel = JSON.parse(showSidePanelState);
    }
    
    // Load sidebar width
    const savedWidth = localStorage.getItem(this.SIDEBAR_WIDTH_KEY);
    if (savedWidth !== null) {
      this.sidebarWidth = parseInt(savedWidth, 10);
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        this.handleFile(file);
      }
    }
  }

  async openFile() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,application/pdf';
    fileInput.multiple = false;

    fileInput.onchange = (event: any) => {
      const file = event.target?.files?.[0];
      if (file) {
        this.handleFile(file);
      }
    };

    // Trigger file selection
    fileInput.click();
  }

  toggleSidePanel() {
    this.showSidePanel = !this.showSidePanel;
    localStorage.setItem(this.SIDE_PANEL_SHOW_KEY, JSON.stringify(this.showSidePanel));
  }

  startResize(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;
    
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      sidebar.classList.add('resizing');
    }
    
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.stopResize.bind(this));
  }
  
  private onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    
    const newWidth = event.clientX;
    const minWidth = 200;
    const maxWidth = 600;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      this.sidebarWidth = newWidth;
    }
  }
  
  private stopResize() {
    this.isResizing = false;
    
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) {
      sidebar.classList.remove('resizing');
    }
    
    // Save the new width
    localStorage.setItem(this.SIDEBAR_WIDTH_KEY, this.sidebarWidth.toString());
    
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.stopResize.bind(this));
  }

  private handleFile(file: File) {
    console.log('Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });

    this.storageService.uploadBookFile(file).subscribe({
      next: (book) => {
        console.log('Book uploaded successfully:', book);
        this.bookService.setCurrentBook(book);
        // Refresh the library
        this.storageService.loadLibrary();
      },
      error: (error) => {
        console.error('Failed to upload book:', error);
        // Could add user notification here
      }
    });
  }
}
