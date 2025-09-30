import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookListComponent } from '../book-list/book-list';
import { TocComponent } from '../toc/toc';
import { BookService } from '../../services/book';
import { Subject, takeUntil } from 'rxjs';

export type SidePanelTab = 'library' | 'toc';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [CommonModule, BookListComponent, TocComponent],
  templateUrl: './side-panel.html',
  styleUrl: './side-panel.scss'
})
export class SidePanelComponent implements OnInit, OnDestroy {
  activeTab: SidePanelTab = 'library';
  currentBook: any = null;
  
  private destroy$ = new Subject<void>();

  constructor(private bookService: BookService) {}

  ngOnInit() {
    // Listen for current book changes
    this.bookService.currentBook$
      .pipe(takeUntil(this.destroy$))
      .subscribe(book => {
        this.currentBook = book;
        
        // Auto-switch to TOC tab when a book is selected (if not already on TOC)
        if (book && this.activeTab === 'library') {
          // Keep on library tab to allow user to continue browsing
          // They can manually switch to TOC if needed
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: SidePanelTab) {
    this.activeTab = tab;
  }
}