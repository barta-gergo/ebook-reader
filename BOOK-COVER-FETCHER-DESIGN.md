# 📚 Book Cover Fetcher - Feature Design Document

## Overview
Automatically fetch and display book cover images from online sources based on book title and author information. This enhances the visual appeal of the library and makes book identification easier.

---

## 🎯 Goals

1. **Automatic cover fetching** when book is uploaded
2. **Multiple fallback sources** (Google Books API, Open Library, etc.)
3. **Local caching** to avoid repeated API calls
4. **Thumbnail generation** for different sizes (small, medium, large)
5. **Graceful degradation** - show placeholder if no cover found
6. **Privacy-focused** - optional feature, can be disabled

---

## 📊 API Sources (Priority Order)

### 1. Google Books API ⭐ **PRIMARY**
**Why:** Best coverage, high-quality images, free, no API key required (with rate limits)

**Endpoint:**
```
GET https://www.googleapis.com/books/v1/volumes?q=intitle:{title}+inauthor:{author}
```

**Response:**
```json
{
  "items": [
    {
      "volumeInfo": {
        "title": "Clean Code",
        "authors": ["Robert C. Martin"],
        "imageLinks": {
          "thumbnail": "http://books.google.com/books/content?id=...",
          "smallThumbnail": "http://books.google.com/books/content?id=...",
          "small": "http://books.google.com/books/content?id=...",
          "medium": "http://books.google.com/books/content?id=...",
          "large": "http://books.google.com/books/content?id=..."
        }
      }
    }
  ]
}
```

**Pros:**
- ✅ Excellent coverage
- ✅ Multiple image sizes
- ✅ High quality images
- ✅ Free (with rate limits: 1000 requests/day)
- ✅ No API key required for basic usage

**Cons:**
- ⚠️ Rate limited (can upgrade with API key)
- ⚠️ Some books may not have covers

---

### 2. Open Library API 🔄 **FALLBACK 1**
**Why:** Open source, good coverage, completely free

**Endpoint:**
```
GET https://openlibrary.org/search.json?title={title}&author={author}
```

**Cover URL Pattern:**
```
https://covers.openlibrary.org/b/id/{cover_id}-{size}.jpg
Sizes: S (small), M (medium), L (large)
```

**Pros:**
- ✅ Completely free, no rate limits
- ✅ Open source project
- ✅ Good coverage for older books
- ✅ Simple API

**Cons:**
- ⚠️ Lower resolution images than Google Books
- ⚠️ Fewer modern/recent books

---

### 3. ISBNdb API 🔄 **FALLBACK 2** (Optional)
**Why:** Commercial service with excellent coverage

**Endpoint:**
```
GET https://api2.isbndb.com/book/{isbn}
```

**Pros:**
- ✅ Excellent coverage
- ✅ ISBN-based lookup
- ✅ High quality data

**Cons:**
- ⚠️ Requires API key (paid after 100 requests)
- ⚠️ Only works if PDF has ISBN metadata

---

### 4. PDF First Page Extraction 📄 **FALLBACK 3**
**Why:** Always available, guaranteed to work

**Method:** Extract and use the first page of the PDF as cover

**Pros:**
- ✅ Always works
- ✅ Most accurate representation
- ✅ No external dependencies

**Cons:**
- ⚠️ Not always visually appealing
- ⚠️ May include table of contents or legal pages

---

## 🏗️ Architecture

### Backend Components

```
domain/services/
├── cover-fetcher.interface.ts          # Cover fetcher abstraction
infrastructure/services/
├── google-books-cover.service.ts       # Google Books implementation
├── open-library-cover.service.ts       # Open Library implementation
├── pdf-cover-extractor.service.ts      # PDF first page extractor
├── cover-fetcher-orchestrator.service.ts # Tries all sources in order
infrastructure/database/
├── book-cover.orm-entity.ts            # Cover metadata storage
application/services/
├── book-cover-application.service.ts   # Business logic
```

---

## 💾 Database Schema

```typescript
// New entity: BookCover
{
  id: string (UUID)
  bookId: string (FK to Book)
  source: 'google-books' | 'open-library' | 'isbndb' | 'pdf-extract' | 'manual'
  thumbnailUrl: string          // Small (100x150)
  smallUrl: string              // Medium (200x300)
  mediumUrl: string             // Large (400x600)
  largeUrl: string              // Extra large (800x1200)
  localThumbnailPath: string    // Cached thumbnail
  localSmallPath: string        // Cached small
  localMediumPath: string       // Cached medium
  localLargePath: string        // Cached large
  fetchedAt: Date
  isCached: boolean
  metadata: {
    originalUrl: string
    width: number
    height: number
    format: string
  }
}
```

---

## 🔄 Cover Fetching Flow

```
Book Upload
    ↓
Extract Metadata (title, author, ISBN)
    ↓
[Cover Fetcher Orchestrator]
    ↓
Try Google Books API
    ├─ Success → Download & Cache → Store in DB → Done ✅
    └─ Fail → Try Open Library API
        ├─ Success → Download & Cache → Store in DB → Done ✅
        └─ Fail → Try ISBNdb API (if ISBN available)
            ├─ Success → Download & Cache → Store in DB → Done ✅
            └─ Fail → Extract PDF First Page
                ├─ Success → Generate Thumbnail → Store in DB → Done ✅
                └─ Fail → Use Default Placeholder → Done ⚠️
```

---

## 🎨 Frontend Integration

### Book Card with Cover

```html
<div class="book-card">
  <div class="book-cover">
    <img
      [src]="getBookCover(book)"
      [alt]="book.title"
      (error)="onCoverLoadError($event, book)"
      loading="lazy"
    />
  </div>
  <div class="book-info">
    <h4>{{ book.title }}</h4>
    <p>{{ book.author }}</p>
  </div>
</div>
```

### Cover Service

```typescript
@Injectable()
export class BookCoverService {
  getBookCover(bookId: string, size: 'thumbnail' | 'small' | 'medium' | 'large'): Observable<string> {
    // Returns URL or base64 data URL
  }

  fetchCoverForBook(bookId: string): Observable<BookCover> {
    // Triggers cover fetching process
  }

  refreshCover(bookId: string): Observable<BookCover> {
    // Re-fetch cover from APIs
  }

  uploadManualCover(bookId: string, file: File): Observable<BookCover> {
    // Allow user to upload custom cover
  }
}
```

---

## 📐 Implementation Details

### 1. Google Books Cover Service

```typescript
// backend/src/infrastructure/services/google-books-cover.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface CoverFetchResult {
  found: boolean;
  source: string;
  urls: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  metadata?: {
    originalUrl: string;
    width: number;
    height: number;
  };
}

@Injectable()
export class GoogleBooksCoverService {
  private readonly logger = new Logger(GoogleBooksCoverService.name);
  private readonly baseUrl = 'https://www.googleapis.com/books/v1/volumes';

  constructor(private readonly httpService: HttpService) {}

  async fetchCover(title: string, author?: string): Promise<CoverFetchResult> {
    try {
      // Build query
      let query = `intitle:${encodeURIComponent(title)}`;
      if (author) {
        query += `+inauthor:${encodeURIComponent(author)}`;
      }

      const url = `${this.baseUrl}?q=${query}&maxResults=1`;
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: 5000 })
      );

      if (!response.data.items || response.data.items.length === 0) {
        this.logger.log(`No results found for: ${title} by ${author}`);
        return { found: false, source: 'google-books', urls: {} };
      }

      const book = response.data.items[0];
      const imageLinks = book.volumeInfo?.imageLinks;

      if (!imageLinks) {
        this.logger.log(`No cover images for: ${title}`);
        return { found: false, source: 'google-books', urls: {} };
      }

      // Return URLs (Google Books returns http, upgrade to https)
      return {
        found: true,
        source: 'google-books',
        urls: {
          thumbnail: imageLinks.thumbnail?.replace('http://', 'https://'),
          small: imageLinks.small?.replace('http://', 'https://'),
          medium: imageLinks.medium?.replace('http://', 'https://'),
          large: imageLinks.large?.replace('http://', 'https://'),
        },
      };
    } catch (error) {
      this.logger.error(`Google Books API error: ${error.message}`);
      return { found: false, source: 'google-books', urls: {} };
    }
  }

  async downloadAndSave(url: string, bookId: string, size: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer', timeout: 10000 })
      );

      const buffer = Buffer.from(response.data);
      const filename = `cover-${bookId}-${size}.jpg`;
      const filepath = path.join('./uploads/covers', filename);

      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

      // Save file
      await fs.promises.writeFile(filepath, buffer);

      this.logger.log(`Cover saved: ${filepath}`);
      return filepath;
    } catch (error) {
      this.logger.error(`Failed to download cover: ${error.message}`);
      throw error;
    }
  }
}
```

---

### 2. Cover Fetcher Orchestrator

```typescript
// backend/src/infrastructure/services/cover-fetcher-orchestrator.service.ts
@Injectable()
export class CoverFetcherOrchestratorService {
  private readonly logger = new Logger(CoverFetcherOrchestratorService.name);

  constructor(
    private readonly googleBooksService: GoogleBooksCoverService,
    private readonly openLibraryService: OpenLibraryCoverService,
    private readonly pdfExtractorService: PdfCoverExtractorService,
  ) {}

  async fetchCover(
    title: string,
    author?: string,
    isbn?: string,
    pdfPath?: string
  ): Promise<CoverFetchResult> {
    this.logger.log(`Fetching cover for: ${title} by ${author || 'Unknown'}`);

    // 1. Try Google Books
    const googleResult = await this.googleBooksService.fetchCover(title, author);
    if (googleResult.found) {
      this.logger.log('✅ Cover found via Google Books');
      return googleResult;
    }

    // 2. Try Open Library
    const openLibResult = await this.openLibraryService.fetchCover(title, author);
    if (openLibResult.found) {
      this.logger.log('✅ Cover found via Open Library');
      return openLibResult;
    }

    // 3. Try ISBN lookup if available
    if (isbn) {
      const isbnResult = await this.openLibraryService.fetchCoverByISBN(isbn);
      if (isbnResult.found) {
        this.logger.log('✅ Cover found via ISBN lookup');
        return isbnResult;
      }
    }

    // 4. Extract from PDF first page
    if (pdfPath) {
      const pdfResult = await this.pdfExtractorService.extractCover(pdfPath);
      if (pdfResult.found) {
        this.logger.log('✅ Cover extracted from PDF');
        return pdfResult;
      }
    }

    // 5. No cover found - return placeholder
    this.logger.warn(`⚠️ No cover found for: ${title}`);
    return {
      found: false,
      source: 'placeholder',
      urls: {
        thumbnail: '/assets/placeholder-cover.jpg',
      },
    };
  }
}
```

---

### 3. PDF Cover Extractor

```typescript
// backend/src/infrastructure/services/pdf-cover-extractor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as pdfjsLib from 'pdfjs-dist';
import * as sharp from 'sharp';
import * as fs from 'fs';

@Injectable()
export class PdfCoverExtractorService {
  private readonly logger = new Logger(PdfCoverExtractorService.name);

  async extractCover(pdfPath: string): Promise<CoverFetchResult> {
    try {
      // Load PDF
      const data = await fs.promises.readFile(pdfPath);
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;

      // Get first page
      const page = await pdf.getPage(1);

      // Render page to canvas
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert canvas to image buffer
      const imageBuffer = canvas.toBuffer('image/png');

      // Generate thumbnails with sharp
      const bookId = path.basename(pdfPath, '.pdf');
      const coverDir = './uploads/covers';
      await fs.promises.mkdir(coverDir, { recursive: true });

      const thumbnailPath = path.join(coverDir, `cover-${bookId}-thumbnail.jpg`);
      const smallPath = path.join(coverDir, `cover-${bookId}-small.jpg`);
      const mediumPath = path.join(coverDir, `cover-${bookId}-medium.jpg`);

      // Create different sizes
      await sharp(imageBuffer)
        .resize(100, 150, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      await sharp(imageBuffer)
        .resize(200, 300, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toFile(smallPath);

      await sharp(imageBuffer)
        .resize(400, 600, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toFile(mediumPath);

      return {
        found: true,
        source: 'pdf-extract',
        urls: {
          thumbnail: thumbnailPath,
          small: smallPath,
          medium: mediumPath,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to extract PDF cover: ${error.message}`);
      return { found: false, source: 'pdf-extract', urls: {} };
    }
  }
}
```

---

## 🎨 UI/UX Design

### Library View with Covers

```
┌─────────────────────────────────────────────┐
│ 📚 Recently Opened                          │
├─────────────────────────────────────────────┤
│ ┌────┐  Clean Code                      📖│
│ │📕 │  by Robert C. Martin                │
│ │    │  ████████████░░░░░  42%            │
│ └────┘  📅 2 hours ago     [▶ Continue]   │
├─────────────────────────────────────────────┤
│ Library                         [Grid] [List]│
├─────────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│ │📕 │ │📘 │ │📗 │ │📙 │               │
│ │    │ │    │ │    │ │    │  Grid View   │
│ └────┘ └────┘ └────┘ └────┘               │
│  Book1  Book2  Book3  Book4                │
└─────────────────────────────────────────────┘
```

### Cover Fallback Strategy (CSS)

```scss
.book-cover {
  position: relative;
  width: 100%;
  height: 150px;
  border-radius: 4px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;

    &.loading {
      opacity: 0;
      animation: fadeIn 0.3s ease-in forwards;
    }

    &.error {
      display: none;
    }
  }

  // Fallback: Show book icon with title
  &:has(img.error)::before {
    content: '📚';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
  }

  &:has(img.error)::after {
    content: attr(data-title);
    position: absolute;
    bottom: 8px;
    left: 8px;
    right: 8px;
    color: white;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
}
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Cover Fetching Configuration
COVER_FETCHING_ENABLED=true
COVER_CACHE_DIR=./uploads/covers
COVER_CACHE_MAX_AGE_DAYS=90

# API Keys (optional)
GOOGLE_BOOKS_API_KEY=your-api-key-here  # Optional, increases rate limit
ISBNDB_API_KEY=your-api-key-here        # Optional, for ISBN lookup

# Feature Flags
ENABLE_GOOGLE_BOOKS_COVERS=true
ENABLE_OPEN_LIBRARY_COVERS=true
ENABLE_PDF_COVER_EXTRACTION=true
ENABLE_MANUAL_COVER_UPLOAD=true
```

---

## 🔒 Privacy & Performance

### Privacy Considerations
- ✅ Feature can be disabled per user preference
- ✅ No personal data sent to APIs (only title/author)
- ✅ All covers cached locally
- ✅ User can manually upload covers instead
- ✅ Clear indication of cover source

### Performance Optimizations
- ✅ Lazy loading for cover images
- ✅ WebP format with JPEG fallback
- ✅ Responsive images (srcset)
- ✅ Local caching (90 days default)
- ✅ Parallel fetching during upload
- ✅ Background job for batch processing
- ✅ Rate limiting for API calls

---

## 📊 Implementation Breakdown

### Phase 1: Core Infrastructure (8 hours)
- [ ] Create BookCover entity and repository
- [ ] Implement Google Books cover service
- [ ] Implement Open Library cover service
- [ ] Create Cover Fetcher Orchestrator
- [ ] Add cover fetching to book upload flow
- [ ] Write unit tests

### Phase 2: PDF Extraction Fallback (4 hours)
- [ ] Install pdf.js and sharp dependencies
- [ ] Implement PDF cover extractor service
- [ ] Generate multiple thumbnail sizes
- [ ] Add to orchestrator fallback chain
- [ ] Test with various PDFs

### Phase 3: Frontend Integration (6 hours)
- [ ] Create BookCoverService (frontend)
- [ ] Add cover display to book cards
- [ ] Implement lazy loading
- [ ] Add error handling and fallbacks
- [ ] Create placeholder designs
- [ ] Add loading skeletons

### Phase 4: Advanced Features (4 hours)
- [ ] Manual cover upload interface
- [ ] Cover refresh functionality
- [ ] User preferences for cover fetching
- [ ] Grid/List view toggle
- [ ] Cover zoom/preview modal

### Phase 5: Testing & Polish (3 hours)
- [ ] E2E tests for cover fetching
- [ ] Integration tests
- [ ] Performance testing
- [ ] UI polish and animations
- [ ] Documentation

**Total Estimated Time:** 25 hours

---

## 🎯 Success Metrics

- **Coverage:** >80% of books have covers fetched automatically
- **Performance:** Cover fetching adds <2s to upload time
- **Cache Hit Rate:** >90% after initial fetch
- **User Satisfaction:** Covers make books easier to identify
- **API Success Rate:** >95% successful fetches from at least one source

---

## 🚀 Future Enhancements

1. **AI Cover Generation** - Use DALL-E/Stable Diffusion for missing covers
2. **User-Contributed Covers** - Allow users to share covers
3. **3D Cover Effects** - CSS 3D transforms for book shelf effect
4. **Reading List Covers** - Generate composite covers for collections
5. **Cover Recommendations** - Suggest better covers if multiple found
6. **OCR Integration** - Extract title from cover for verification
7. **Series Detection** - Group book series by cover similarity
8. **Color Theming** - Extract dominant colors for UI theming

---

## 📚 Dependencies

### Backend
```json
{
  "dependencies": {
    "@nestjs/axios": "^3.0.0",
    "axios": "^1.6.2",
    "sharp": "^0.33.0",
    "pdfjs-dist": "^3.11.174",
    "canvas": "^2.11.2"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "@angular/common": "^18.0.0"
  }
}
```

---

## 🎨 Example Usage

```typescript
// Backend: Fetch cover during book upload
const coverResult = await this.coverFetcherOrchestrator.fetchCover(
  book.metadata.title,
  book.metadata.author,
  book.metadata.isbn,
  book.filePath
);

if (coverResult.found) {
  // Download and save covers
  const cover = await this.bookCoverService.saveCovers(
    book.id,
    coverResult
  );
  book.coverId = cover.id;
}

// Frontend: Display cover
<img
  [src]="bookCoverService.getCoverUrl(book.id, 'thumbnail')"
  [alt]="book.title"
  (error)="onCoverError(book)"
  loading="lazy"
/>
```

---

## 🎉 Benefits

1. **Visual Appeal** - Beautiful library with book covers
2. **Quick Recognition** - Instantly identify books by cover
3. **Professional Look** - Modern app appearance
4. **User Engagement** - More appealing to browse
5. **Automatic** - No manual work required
6. **Offline-First** - Covers cached locally
7. **Privacy-Respecting** - Optional feature
8. **Multiple Sources** - High success rate

---

*This feature transforms the ebook reader from a functional tool into a visually rich, modern reading experience that rivals commercial ebook platforms.*
