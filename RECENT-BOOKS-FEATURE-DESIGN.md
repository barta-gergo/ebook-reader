# 📚 Recent Books & Quick Access - Feature Design Document

## Overview
This document outlines the design and implementation plan for the "Recent Books & Quick Access" feature, taking into account the current frontend layout and UX/UI experience.

---

## Current UI Context

### Existing Layout Structure
- **Header**: Brand name, centered search bar, action buttons, user profile
- **Sidebar**: Resizable panel containing book list + side panel (TOC, bookmarks)
- **Main Content**: PDF viewer
- **Book List**: Vertical card-based list showing title/author/metadata with active state highlighting

---

## 🎯 Feature Goals

1. **Quick access** to recently opened books
2. **Visual progress tracking** with progress bars
3. **One-click "Continue Reading"** that jumps to last read page
4. **Time context** showing when book was last opened
5. **Seamless integration** with existing UI without disruption

---

## Proposed Design

### **Option 1: Separate "Recent" Section Above Library** ⭐ **RECOMMENDED**

#### Visual Layout
```
┌─────────────────────────────────────────────┐
│ 📚 Recently Opened              [−] Collapse│
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ The Pragmatic Programmer             📖│ │
│ │ by David Thomas                         │ │
│ │ ████████████████░░░░░░░░░░  42%        │ │
│ │ 📅 2 hours ago         [▶ Continue]    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Clean Code                             📖│ │
│ │ by Robert Martin                        │ │
│ │ ███████████████████████░░░  78%        │ │
│ │ 📅 Yesterday           [▶ Continue]    │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Library                          🔍 [Sort ▼]│
├─────────────────────────────────────────────┤
│ [All books in library...]                   │
└─────────────────────────────────────────────┘
```

#### Key Features
- **Positioned at top** of sidebar for immediate visibility
- **Show 3-5 books** to avoid clutter
- **Compact card design** (smaller than library items)
- **Visual progress bar** with percentage
- **Time ago indicator** ("2 hours ago", "Yesterday")
- **Primary "Continue" button** for quick access
- **Collapsible section** to hide when not needed
- **Auto-updates** when books are opened

---

## 📐 Detailed Component Design

### 1. Recent Book Card Component

#### HTML Structure
```html
<div class="recent-book-item">
  <div class="recent-book-info">
    <h5 class="book-title">{{ book.title }}</h5>
    <span class="book-author">{{ book.author }}</span>

    <!-- Progress indicator -->
    <div class="progress-bar">
      <div class="progress-fill" [style.width.%]="book.progress"></div>
    </div>
    <span class="progress-text">{{ book.progress }}% complete</span>

    <!-- Time indicator -->
    <span class="last-opened">
      📅 {{ getTimeAgo(book.lastOpened) }}
    </span>
  </div>

  <!-- Quick action button -->
  <button class="btn-continue" (click)="continueReading(book)">
    ▶️ Continue
  </button>
</div>
```

#### SCSS Styling
```scss
.recent-section {
  padding: 16px;
  border-bottom: 2px solid var(--border-color);
  background-color: var(--bg-secondary);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .collapse-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-secondary);
      transition: color 0.2s ease;

      &:hover {
        color: var(--accent-primary);
      }
    }
  }
}

.recent-book-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--accent-primary);
    box-shadow: 0 2px 6px var(--shadow);
    transform: translateY(-1px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.recent-book-info {
  flex: 1;
  min-width: 0;

  .book-title {
    margin: 0 0 2px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .book-author {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.progress-bar {
  height: 4px;
  background-color: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  margin: 6px 0 4px 0;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg,
      var(--accent-primary),
      var(--accent-primary-hover));
    transition: width 0.3s ease;
  }
}

.progress-text {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.last-opened {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
}

.btn-continue {
  padding: 6px 12px;
  margin-left: 12px;
  border: 1px solid var(--accent-primary);
  border-radius: 4px;
  background-color: var(--accent-primary);
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--accent-primary-hover);
    border-color: var(--accent-primary-hover);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
}

.empty-recent {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 13px;
}
```

---

## 💻 Implementation Details

### Backend Changes

#### 1. API Endpoint
```typescript
// GET /books/recent?limit=10
@Get('recent')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get recently opened books' })
async getRecentBooks(
  @CurrentUser() user: User,
  @Query('limit') limit: number = 10
) {
  return await this.bookService.getRecentBooks(user.id, limit);
}
```

#### 2. Service Method
```typescript
async getRecentBooks(userId: string, limit: number): Promise<BookDto[]> {
  const books = await this.bookRepository.find({
    where: { userId },
    order: { lastOpened: 'DESC' },
    take: limit,
  });

  // Include reading progress
  const booksWithProgress = await Promise.all(
    books.map(async (book) => {
      const progress = await this.readingProgressService
        .getProgress(book.id, userId);

      return {
        ...book,
        progress: progress?.progressPercentage || 0,
        currentPage: progress?.currentPage || 1,
      };
    })
  );

  return booksWithProgress;
}
```

#### 3. Update lastOpened Timestamp
```typescript
// Called when book is opened
async updateLastOpened(bookId: string, userId: string): Promise<void> {
  await this.bookRepository.update(
    { id: bookId, userId },
    { lastOpened: new Date() }
  );
}
```

---

### Frontend Changes

#### 1. BookService Enhancement
```typescript
// Add to book.service.ts
getRecentBooks(limit: number = 5): Observable<Book[]> {
  return this.http.get<Book[]>(`${this.apiUrl}/books/recent?limit=${limit}`);
}

setCurrentBook(book: Book | null): void {
  if (book) {
    // Update lastOpened timestamp
    this.http.patch(`${this.apiUrl}/books/${book.id}/last-opened`, {})
      .subscribe();
  }
  this.currentBookSubject.next(book);
}
```

#### 2. Recent Books Component
```typescript
// recent-books/recent-books.component.ts
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
    private storageService: StorageService,
    private readingProgressService: ReadingProgressService
  ) {}

  ngOnInit() {
    this.recentBooks$ = this.bookService.getRecentBooks(5);
  }

  continueReading(book: Book) {
    // Load full book from storage
    const fullBook = this.storageService.loadBookFromLibrary(book.id);

    if (fullBook) {
      // Set as current book
      this.bookService.setCurrentBook(fullBook);

      // Jump to last read page if progress exists
      if (book.currentPage && book.currentPage > 1) {
        setTimeout(() => {
          this.bookService.goToPage(book.currentPage);
        }, 100);
      }
    }
  }

  getTimeAgo(date: Date): string {
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

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
```

#### 3. Update BookListComponent
```html
<!-- book-list.component.html -->
<div class="book-list">
  <!-- NEW: Recent Books Section -->
  <app-recent-books></app-recent-books>

  <!-- Existing Library Section -->
  <h3>Library</h3>
  <div class="books-container">
    <!-- Existing book list code -->
  </div>
</div>
```

---

## 🎯 User Experience Flow

### Happy Path
1. User opens the app
2. Sidebar shows "Recent" section at top with last 3-5 books
3. Each book displays:
   - Title and author
   - Visual progress bar with percentage
   - "2 hours ago" timestamp
   - Green "Continue" button
4. User clicks "Continue" on a book
5. Book opens instantly and jumps to last read page
6. User continues reading seamlessly

### Edge Cases
- **First time user**: Show "No recent books yet. Open a book to get started!"
- **No progress saved**: Button shows "Start Reading" instead of "Continue"
- **Book deleted**: Automatically removed from recent list
- **Storage cleared**: Re-fetch from backend on next load

---

## 🎨 Additional "Nice to Have" Features

### 1. Reading Streak Badge
```html
<div class="streak-badge">
  🔥 5 day streak
</div>
```

### 2. Quick Stats Header
```html
<div class="quick-stats">
  <span>📚 {{totalBooks}} books</span>
  <span>📖 {{currentlyReading}} reading</span>
  <span>✅ {{completed}} finished</span>
</div>
```

### 3. "Pick Up Where You Left Off" Banner
```html
<div class="continue-banner" *ngIf="lastReadBook">
  <span>Continue reading "{{lastReadBook.title}}"?</span>
  <button (click)="continueReading(lastReadBook)">Resume</button>
</div>
```

### 4. Recently Finished Section
- Show books completed in last 7 days
- Display completion badge ✅
- Celebrate achievements

### 5. Currently Reading Badge
```html
<span class="badge badge-reading" *ngIf="isCurrentlyReading(book)">
  📖 Reading now
</span>
```

---

## 📊 Implementation Breakdown

### Backend (2 hours)
- [x] `lastOpened` field already exists in Book entity
- [ ] Add `GET /books/recent` endpoint to BooksController
- [ ] Create `getRecentBooks()` service method with sorting
- [ ] Add `PATCH /books/:id/last-opened` endpoint
- [ ] Include reading progress percentage in response
- [ ] Add unit tests for recent books endpoint

### Frontend (4 hours)
- [ ] Create `RecentBooksComponent` (HTML, SCSS, TS)
- [ ] Update `BookService` with `getRecentBooks()` method
- [ ] Implement `continueReading()` with page navigation
- [ ] Add `getTimeAgo()` utility function
- [ ] Create progress bar component/styles
- [ ] Add collapse/expand functionality
- [ ] Integrate component into `BookListComponent`
- [ ] Style with consistent theme variables
- [ ] Add responsive design for narrow sidebars

### Testing (1 hour)
- [ ] Backend unit tests for recent endpoint
- [ ] Frontend component unit tests
- [ ] E2E test: Open book → Verify appears in recent
- [ ] E2E test: Continue reading → Verify correct page
- [ ] E2E test: Collapse/expand functionality
- [ ] Test empty state display

---

## ✅ Design Decisions & Rationale

### Why Separate Section Above Library?
- ✅ Immediate visibility without scrolling
- ✅ Clear visual hierarchy
- ✅ Doesn't disrupt existing library organization
- ✅ Can be collapsed if user prefers
- ✅ Natural reading order (recent → all)

### Why Limit to 3-5 Books?
- ✅ Prevents sidebar clutter
- ✅ Forces focus on active reading
- ✅ Faster rendering and better performance
- ✅ Easier to scan visually

### Why Progress Bar?
- ✅ Visual feedback at a glance
- ✅ Motivates completion
- ✅ Industry standard (Kindle, Goodreads, etc.)
- ✅ Accessible with percentage text fallback

### Why "Continue" Instead of Click-to-Open?
- ✅ Explicit action reduces accidental opens
- ✅ Clear primary action for mobile/touch
- ✅ Allows future secondary actions (share, bookmark, etc.)
- ✅ Matches user mental model from other reading apps

---

## 🚀 Future Enhancements

1. **Filter recent by time range** (Today, This Week, This Month)
2. **Pin favorite books** to always show at top
3. **Reading goals integration** (pages per day, minutes per day)
4. **Social features** (share progress with friends)
5. **Statistics overlay** (total reading time, pages read)
6. **Book recommendations** based on recent reads
7. **Auto-bookmark** at stopping points
8. **Offline sync** for recent books list

---

## 📝 Notes

- All timestamps use relative time display for better UX
- Progress calculations handled by existing `ReadingProgressService`
- Component is fully responsive and works with sidebar resizing
- Maintains existing theme system with CSS variables
- No breaking changes to existing functionality
- Can be feature-flagged for gradual rollout

---

## 🎨 Design Principles

1. **Consistency**: Uses existing design patterns and components
2. **Performance**: Minimal API calls, efficient rendering
3. **Accessibility**: Keyboard navigation, screen reader support
4. **Responsiveness**: Works on all sidebar widths
5. **Progressive Enhancement**: Graceful degradation if backend fails

---

*This feature enhances the user experience by providing quick access to active reading sessions while maintaining the clean, focused design of the existing application.*
