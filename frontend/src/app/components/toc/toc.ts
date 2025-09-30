import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book';
import { TocItemComponent } from './toc-item';
import { Subject, takeUntil } from 'rxjs';

export interface TocItem {
  id: string;
  bookId: string;
  title: string;
  page: number;
  level: number;
  parentId?: string;
  order?: number;
  children?: TocItem[];
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-toc',
  standalone: true,
  imports: [CommonModule, FormsModule, TocItemComponent],
  templateUrl: './toc.html',
  styleUrl: './toc.scss'
})
export class TocComponent implements OnInit, OnDestroy {
  @Input() bookId: string | null = null;
  
  tocItems: TocItem[] = [];
  expandedItems = new Set<string>();
  searchQuery = '';
  filteredTocItems: TocItem[] = [];
  currentPage = 1;
  isLoading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private bookService: BookService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load TOC when component initializes
    if (this.bookId) {
      this.loadToc();
    }

    // Listen for current page changes to highlight active section
    this.bookService.navigation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(page => {
        if (page) {
          this.currentPage = page;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadToc() {
    if (!this.bookId) return;
    
    this.isLoading = true;
    try {
      const response = await fetch(`http://localhost:3000/books/${this.bookId}/toc`);
      if (response.ok) {
        this.tocItems = await response.json();
        this.filteredTocItems = [...this.tocItems];
        
        // Don't auto-expand any items - show only first level by default
      }
    } catch (error) {
      console.error('Error loading TOC:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  toggleExpanded(item: TocItem) {
    if (this.expandedItems.has(item.id)) {
      this.expandedItems.delete(item.id);
    } else {
      this.expandedItems.add(item.id);
    }
  }

  isExpanded(item: TocItem): boolean {
    return this.expandedItems.has(item.id);
  }

  hasChildren(item: TocItem): boolean {
    return !!(item.children && item.children.length > 0);
  }

  navigateToPage(page: number) {
    console.log('TOC: Navigating to page', page);
    this.bookService.navigateToPage(page);
  }

  isCurrentSection(item: TocItem): boolean {
    if (!item.children || item.children.length === 0) {
      return this.currentPage === item.page;
    }
    
    // For parent items, check if current page is within this section
    const nextSibling = this.getNextSibling(item);
    const endPage = nextSibling ? nextSibling.page - 1 : Infinity;
    
    return this.currentPage >= item.page && this.currentPage <= endPage;
  }

  private getNextSibling(item: TocItem): TocItem | null {
    // Find the next item at the same level
    const flatItems = this.flattenTocItems(this.tocItems);
    const currentIndex = flatItems.findIndex(i => i.id === item.id);
    
    for (let i = currentIndex + 1; i < flatItems.length; i++) {
      if (flatItems[i].level <= item.level) {
        return flatItems[i];
      }
    }
    
    return null;
  }

  private flattenTocItems(items: TocItem[]): TocItem[] {
    const result: TocItem[] = [];
    
    function flatten(items: TocItem[]) {
      for (const item of items) {
        result.push(item);
        if (item.children) {
          flatten(item.children);
        }
      }
    }
    
    flatten(items);
    return result;
  }

  onSearchInput() {
    if (!this.searchQuery.trim()) {
      this.filteredTocItems = [...this.tocItems];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredTocItems = this.filterTocItems(this.tocItems, query);
    
    // Auto-expand items that match search
    this.filteredTocItems.forEach(item => {
      if (item.title.toLowerCase().includes(query)) {
        this.expandedItems.add(item.id);
        // Also expand all parents
        this.expandParents(item);
      }
    });
  }

  private filterTocItems(items: TocItem[], query: string): TocItem[] {
    const result: TocItem[] = [];
    
    for (const item of items) {
      const titleMatches = item.title.toLowerCase().includes(query);
      const childMatches = item.children ? this.filterTocItems(item.children, query) : [];
      
      if (titleMatches || childMatches.length > 0) {
        result.push({
          ...item,
          children: childMatches.length > 0 ? childMatches : item.children
        });
      }
    }
    
    return result;
  }

  private expandParents(item: TocItem) {
    if (item.parentId) {
      this.expandedItems.add(item.parentId);
      const parent = this.findItemById(this.tocItems, item.parentId);
      if (parent) {
        this.expandParents(parent);
      }
    }
  }

  private findItemById(items: TocItem[], id: string): TocItem | null {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.children) {
        const found = this.findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  getIndentStyle(level: number): string {
    return `${(level - 1) * 20}px`;
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredTocItems = [...this.tocItems];
  }

  trackByItemId(index: number, item: TocItem): string {
    return item.id;
  }

  highlightSearchTerm(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}