import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TocItem } from './toc';

@Component({
  selector: 'app-toc-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toc-item-wrapper">
      <div 
        class="toc-item" 
        [class.expanded]="isExpanded()"
        [class.current]="isCurrentSection()"
        [class.has-children]="hasChildren()"
        [attr.data-level]="item.level"
      >
        <!-- Tree structure lines -->
        <div class="tree-lines">
          <div class="tree-vertical-line" *ngIf="item.level > 1"></div>
          <div class="tree-horizontal-line" *ngIf="item.level > 1"></div>
        </div>
        
        <div class="toc-item-content">
          <!-- Expand/collapse button -->
          <button 
            *ngIf="hasChildren()" 
            (click)="toggleExpanded()"
            class="expand-btn"
            [class.expanded]="isExpanded()"
          >
            <svg class="expand-icon" width="12" height="12" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </button>
          
          <!-- Tree node icon for items without children -->
          <div *ngIf="!hasChildren()" class="tree-node">
            <svg width="8" height="8" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="2" fill="currentColor"/>
            </svg>
          </div>
          
          <!-- Item title and page -->
          <div class="toc-item-main" (click)="navigateToPage()">
            <span class="toc-title" [innerHTML]="highlightSearchTerm(item.title, searchQuery)"></span>
            <span class="toc-page">{{ item.page }}</span>
          </div>
        </div>
      </div>
      
      <!-- Children container with animation -->
      <div 
        class="toc-children-container" 
        [class.expanded]="isExpanded()"
        *ngIf="hasChildren()"
      >
        <div class="toc-children">
          <app-toc-item 
            *ngFor="let child of item.children; trackBy: trackByItemId; let last = last"
            [item]="child" 
            [currentPage]="currentPage"
            [expandedItems]="expandedItems"
            [searchQuery]="searchQuery"
            [class.last-child]="last"
            (navigate)="navigate.emit($event)"
            (toggle)="toggle.emit($event)"
          ></app-toc-item>
        </div>
      </div>
    </div>
  `,
  styleUrl: './toc.scss'
})
export class TocItemComponent {
  @Input() item!: TocItem;
  @Input() currentPage!: number;
  @Input() expandedItems!: Set<string>;
  @Input() searchQuery = '';
  
  @Output() navigate = new EventEmitter<number>();
  @Output() toggle = new EventEmitter<TocItem>();

  hasChildren(): boolean {
    return !!(this.item.children && this.item.children.length > 0);
  }

  isExpanded(): boolean {
    return this.expandedItems.has(this.item.id);
  }

  toggleExpanded() {
    this.toggle.emit(this.item);
  }

  navigateToPage() {
    this.navigate.emit(this.item.page);
  }

  isCurrentSection(): boolean {
    return this.currentPage === this.item.page;
  }


  highlightSearchTerm(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  trackByItemId(index: number, item: TocItem): string {
    return item.id;
  }
}