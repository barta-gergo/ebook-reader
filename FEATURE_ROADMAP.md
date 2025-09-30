# 📚 EBook Reader - Feature Roadmap & Development Plan

> **Note**: Completed features have been moved to [COMPLETED_TASKS.md](./COMPLETED_TASKS.md) for better clarity.

## **Current State Assessment**

### ✅ **Implemented Features** (High-Level Summary)

#### Core Reading Engine
- PDF viewing with ng2-pdf-viewer integration
- Page navigation, zoom, rotation controls
- Reading progress tracking with visual progress bar
- Dark/light theme toggle
- Resizable library sidepanel

#### Library Management
- File upload via drag & drop + file picker
- PDF metadata extraction
- Book deletion and organization
- Recent books with quick access ✅
- Book cover fetching and display ✅

#### Search & Navigation
- Full-text search across all books ✅
- Search results with page navigation ✅
- AI-powered TOC extraction with HuriDocs ✅

#### Annotations & Bookmarks
- Complete bookmarks system ✅
- AI-powered bookmark note generation (Ollama) ✅

#### Authentication & Multi-User
- Google OAuth authentication ✅
- User-scoped data isolation ✅
- JWT-based session management ✅

#### Technical Architecture
- Angular 20 frontend + NestJS backend
- Domain-Driven Design (DDD) architecture
- SQLite database with TypeORM
- Meilisearch for full-text indexing

---

## **🚀 Active Development Roadmap**

### **Phase 1: Core Enhancement (Weeks 1-4)**
*Focus: Improve existing functionality and add essential reading features*

#### **Sprint 1 (Week 1-2): Enhanced Search & Navigation** ✅ **COMPLETED**
> See [COMPLETED_TASKS.md](./COMPLETED_TASKS.md) for full details

- ✅ Full-Text Search System
- ✅ Bookmarks System with AI-Powered Note Generation
- ✅ Table of Contents Extraction with HuriDocs AI

#### **Sprint 2 (Week 3-4): Reading Analytics & Experience**

**2.1 Reading Statistics Dashboard**
- [ ] Reading session tracking
- [ ] Daily/weekly/monthly aggregations
- [ ] Charts showing reading progress over time
- [ ] Reading speed calculations
- [ ] Daily reading goals tracking
- **Estimated Effort**: 14 hours

**2.2 Enhanced Progress Tracking**
- [ ] Reading velocity tracking
- [ ] Time-to-completion estimates
- [ ] More detailed progress indicators
- [ ] Reading time estimates per chapter/book
- **Estimated Effort**: 8 hours

**✅ 2.3 Recent Books & Quick Access** - **COMPLETED**
> See [COMPLETED_TASKS.md](./COMPLETED_TASKS.md) for full details

- ✅ Recent books API endpoint
- ✅ Recent books component with collapsible UI
- ✅ Continue reading functionality
- ✅ Progress percentage display (rounded)
- ✅ Last opened timestamp

---

### **Phase 2: Organization & Annotation (Weeks 5-8)**
*Focus: Advanced organization and note-taking capabilities*

#### **Sprint 3 (Week 5-6): Library Organization**

**3.2 Advanced Sorting & Filtering**
- **Backend**: Enhanced query capabilities
  - [ ] Sort by date, author, progress, rating, reading time
    - [ ] Extend book queries with dynamic sorting
    - [ ] Add sorting by reading statistics
    - [ ] Implement multi-column sorting
    - [ ] Add sort direction (asc/desc) support
    - [ ] Optimize queries with proper indexing
  - [ ] Complex filtering combinations
    - [ ] Add advanced filter query builder
    - [ ] Support AND/OR filter combinations
    - [ ] Add date range filtering
    - [ ] Implement text search within metadata
    - [ ] Add file size and page count filters
- **Frontend**: Advanced filter controls
  - [ ] Multi-criteria sorting interface
    - [ ] Create advanced filter sidebar panel
    - [ ] Add sortable column headers
    - [ ] Implement filter chips/tags
    - [ ] Add clear all filters button
    - [ ] Show active filter count
  - [ ] Saved filter presets
    - [ ] Create filter preset management
    - [ ] Add preset saving/loading functionality
    - [ ] Implement default filter presets
    - [ ] Add preset sharing capabilities
    - [ ] Create quick filter shortcuts
- **Estimated Effort**: 10 hours

**3.3 Collections & Reading Lists**
- **Backend**: Collection entity and management
  - [ ] Custom user-defined collections
    - [ ] Create Collection entity with name, description, color
    - [ ] Add BookCollection junction table
    - [ ] Create collection repository and interfaces
    - [ ] Add database migration for collections
    - [ ] Implement collection ordering/sorting
  - [ ] "To Read", "Currently Reading", "Finished" lists
    - [ ] Create default system collections
    - [ ] Add automatic collection assignment logic
    - [ ] Implement reading status tracking
    - [ ] Add collection statistics and counts
    - [ ] Create collection-based progress tracking
- **Frontend**: Collection management UI
  - [ ] Collection creation and book assignment
    - [ ] Create collection management interface
    - [ ] Add book-to-collection assignment dialog
    - [ ] Implement collection drag-and-drop
    - [ ] Add bulk collection operations
    - [ ] Create collection editing interface
  - [ ] Progress tracking per collection
    - [ ] Show collection completion percentages
    - [ ] Add collection reading statistics
    - [ ] Create collection progress visualizations
    - [ ] Implement collection reading goals
    - [ ] Add collection reading time tracking
- **Estimated Effort**: 14 hours

#### **Sprint 4 (Week 7-8): Annotation System**

**4.1 Text Highlighting**
- **Backend**: Highlight storage system
  - [ ] Highlight coordinates and color data
    - [ ] Create Highlight entity with position coordinates
    - [ ] Store highlight boundaries and text content
    - [ ] Add color and style information
    - [ ] Create highlight repository and interfaces
    - [ ] Add database migration for highlights
  - [ ] Highlight CRUD operations
    - [ ] Create HighlightsController with full CRUD
    - [ ] Add highlight use cases (create, update, delete)
    - [ ] Implement highlight validation and DTOs
    - [ ] Add batch highlight operations
    - [ ] Create highlight search endpoints
- **Frontend**: Interactive highlighting
  - [ ] Text selection and color picker
    - [ ] Implement text selection detection
    - [ ] Create color picker component
    - [ ] Add highlight style options (solid, underline, etc.)
    - [ ] Implement highlight creation workflow
    - [ ] Add highlight keyboard shortcuts
  - [ ] Highlight persistence and rendering
    - [ ] Render highlights on PDF pages
    - [ ] Implement highlight hover effects
    - [ ] Add highlight editing capabilities
    - [ ] Create highlight deletion confirmation
    - [ ] Sync highlights across page navigation
- **Estimated Effort**: 16 hours

**4.2 Notes & Comments**
- **Backend**: Note entity linked to positions
  - [ ] Rich text note storage
    - [ ] Create Note entity with rich text content
    - [ ] Link notes to specific page positions
    - [ ] Add note metadata (created, modified dates)
    - [ ] Create note repository and interfaces
    - [ ] Add database migration for notes
  - [ ] Note search capabilities
    - [ ] Implement full-text search in notes
    - [ ] Add note filtering by date/book
    - [ ] Create note search endpoints
    - [ ] Add note tagging system
    - [ ] Implement note export functionality
- **Frontend**: Note-taking interface
  - [ ] Pop-up note editor
    - [ ] Create rich text editor component
    - [ ] Add note creation modal/popup
    - [ ] Implement note editing interface
    - [ ] Add note formatting options
    - [ ] Include note save/cancel functionality
  - [ ] Note indicators in margins
    - [ ] Display note icons on PDF pages
    - [ ] Add hover preview for notes
    - [ ] Implement note position indicators
    - [ ] Create note tooltip displays
    - [ ] Add note count indicators per page
  - [ ] Note browsing panel
    - [ ] Create notes sidebar panel
    - [ ] Add note search and filtering
    - [ ] Implement note sorting options
    - [ ] Create note preview cards
    - [ ] Add note navigation shortcuts
- **Estimated Effort**: 12 hours

---

### **Phase 3: Advanced Features (Weeks 9-12)**
*Focus: Multi-format support and personalization*

#### **Sprint 5 (Week 9-10): Multi-Format Support**

**5.1 EPUB Support**
- **Backend**: EPUB parsing
- **Frontend**: EPUB viewer component

**5.2 Text File Support**
- **Backend**: Plain text and Markdown parsers
  - [ ] Auto-detect file encoding
    - [ ] Add text file upload support (.txt, .md, .rtf)
    - [ ] Implement character encoding detection
    - [ ] Create text parsing service
    - [ ] Handle different line ending formats
    - [ ] Add text file validation and sanitization
  - [ ] Basic metadata extraction
    - [ ] Extract title from filename or content
    - [ ] Calculate text statistics (word count, reading time)
    - [ ] Add text file metadata to database
    - [ ] Support for front matter in Markdown files
    - [ ] Add text file indexing for search
- **Frontend**: Text viewer with formatting
  - [ ] Markdown rendering support
    - [ ] Install and configure markdown parser
    - [ ] Create text viewer component
    - [ ] Add markdown syntax highlighting
    - [ ] Support for markdown tables and links
    - [ ] Handle markdown images and media
  - [ ] Customizable text display
    - [ ] Add font size and family controls
    - [ ] Implement line spacing adjustments
    - [ ] Add text width and margin controls
    - [ ] Support for text themes and colors
    - [ ] Add text search and highlighting
- **Estimated Effort**: 8 hours

#### **Sprint 6 (Week 11-12): Personalization**

**6.1 Custom Themes & Fonts**
- **Backend**: User preference storage
  - [ ] Theme and font preference APIs
    - [ ] Extend UserPreferences entity with theme settings
    - [ ] Add theme preference CRUD endpoints
    - [ ] Store custom color schemes
    - [ ] Add font preference storage
    - [ ] Implement global vs. per-book preferences
- **Frontend**: Theme customization
  - [ ] Multiple color schemes
    - [ ] Create theme customization interface
    - [ ] Add predefined color scheme options
    - [ ] Implement custom color picker
    - [ ] Add theme preview functionality
    - [ ] Support for dark/light mode variations
  - [ ] Font family selection
    - [ ] Add font selection dropdown
    - [ ] Support for web fonts and system fonts
    - [ ] Add font size and weight controls
    - [ ] Implement font preview functionality
    - [ ] Add dyslexia-friendly font options
  - [ ] Per-book preferences
    - [ ] Add book-specific theme settings
    - [ ] Implement preference inheritance
    - [ ] Create quick theme switching
    - [ ] Add theme import/export functionality
    - [ ] Store reading position with preferences
- **Estimated Effort**: 12 hours

**6.2 Reading Mode Presets**
- **Frontend**: Preset reading modes
  - [ ] Day, night, sepia, high contrast modes
    - [ ] Create predefined reading mode presets
    - [ ] Implement mode-specific color schemes
    - [ ] Add blue light filter for night mode
    - [ ] Create high contrast accessibility mode
    - [ ] Add sepia/warm reading mode
  - [ ] Custom user-defined presets
    - [ ] Allow users to create custom presets
    - [ ] Add preset naming and description
    - [ ] Implement preset sharing functionality
    - [ ] Add preset import/export options
    - [ ] Create preset management interface
  - [ ] Quick mode switching
    - [ ] Add toolbar preset switcher
    - [ ] Implement keyboard shortcuts for modes
    - [ ] Add automatic mode switching (time-based)
    - [ ] Create mode transition animations
    - [ ] Add mode preview functionality
- **Estimated Effort**: 8 hours

**6.3 Advanced Reading Preferences**
- **Frontend**: Granular preference controls
  - [ ] Line spacing, margins, justification
    - [ ] Add line height adjustment controls
    - [ ] Implement margin size controls
    - [ ] Add text justification options
    - [ ] Create paragraph spacing controls
    - [ ] Add text indentation options
  - [ ] Reading width and column options
    - [ ] Add content width adjustment
    - [ ] Implement column layout options
    - [ ] Add reading area centering
    - [ ] Create responsive width breakpoints
    - [ ] Add full-width reading mode
  - [ ] Per-book preference inheritance
    - [ ] Implement preference cascading system
    - [ ] Add global default preferences
    - [ ] Create book-specific overrides
    - [ ] Add preference reset functionality
    - [ ] Implement preference synchronization
- **Estimated Effort**: 10 hours

---

### **Phase 4: Intelligence & Integration (Weeks 13-16)**
*Focus: Smart features and external integrations*

#### **Sprint 7 (Week 13-14): Smart Features**

**7.1 Reading Analytics & Insights**
- **Backend**: Advanced analytics service
  - [ ] Reading pattern analysis
    - [ ] Create advanced analytics service
    - [ ] Track reading session patterns
    - [ ] Analyze reading time distribution
    - [ ] Identify optimal reading times
    - [ ] Generate reading habit insights
  - [ ] Velocity and engagement metrics
    - [ ] Calculate reading velocity trends
    - [ ] Track engagement scores per book/genre
    - [ ] Analyze reading completion rates
    - [ ] Identify reading difficulty patterns
    - [ ] Create predictive reading models
- **Frontend**: Insights dashboard
  - [ ] Reading heatmaps and trends
    - [ ] Create analytics dashboard component
    - [ ] Add reading time heatmap visualization
    - [ ] Show reading trend charts
    - [ ] Display weekly/monthly patterns
    - [ ] Add interactive date range selection
  - [ ] Personalized reading recommendations
    - [ ] Implement recommendation engine
    - [ ] Suggest optimal reading times
    - [ ] Recommend similar books
    - [ ] Suggest reading goals
    - [ ] Add reading pace recommendations
- **Estimated Effort**: 16 hours

**7.2 Smart Bookmarks & Auto-Detection**
- **Backend**: Content analysis service
  - [ ] Chapter boundary detection
    - [ ] Create content analysis service
    - [ ] Implement chapter detection algorithms
    - [ ] Parse document structure and headings
    - [ ] Detect natural reading breaks
    - [ ] Add machine learning for pattern recognition
  - [ ] Interesting passage identification
    - [ ] Implement text complexity analysis
    - [ ] Detect quotes and key passages
    - [ ] Identify important paragraphs
    - [ ] Add sentiment analysis for content
    - [ ] Create passage ranking algorithms
- **Frontend**: Smart bookmark suggestions
  - [ ] Auto-bookmark on natural stopping points
    - [ ] Add auto-bookmark functionality
    - [ ] Suggest bookmarks at chapter ends
    - [ ] Create bookmark suggestion notifications
    - [ ] Add smart pause detection
    - [ ] Implement bookmark cleanup tools
  - [ ] Content-aware navigation hints
    - [ ] Add contextual navigation suggestions
    - [ ] Show reading progress indicators
    - [ ] Create intelligent page recommendations
    - [ ] Add related content suggestions
    - [ ] Implement smart resume functionality
- **Estimated Effort**: 12 hours

#### **Sprint 8 (Week 15-16): External Integrations**

**8.1 Cloud Storage Integration**
- **Backend**: Cloud storage adapters
  - [ ] Google Drive, Dropbox APIs
    - [ ] Install cloud storage SDK dependencies
    - [ ] Create cloud storage abstraction layer
    - [ ] Implement Google Drive integration
    - [ ] Add Dropbox integration
    - [ ] Create authentication flow
  - [ ] Sync service implementation
    - [ ] Create sync service architecture
    - [ ] Implement file upload/download
    - [ ] Add conflict detection and resolution
    - [ ] Create sync scheduling system
    - [ ] Add progress tracking for sync operations
- **Frontend**: Cloud sync interface
  - [ ] Account connection and sync controls
    - [ ] Create cloud account connection UI
    - [ ] Add OAuth authentication flow
    - [ ] Implement sync status indicators
    - [ ] Create manual sync triggers
    - [ ] Add account management interface
  - [ ] Conflict resolution UI
    - [ ] Create conflict resolution dialog
    - [ ] Show file differences and options
    - [ ] Add merge conflict handling
    - [ ] Implement backup and restore options
    - [ ] Create sync history and logs
- **Estimated Effort**: 18 hours

**8.2 Import/Export Functionality**
- **Backend**: Data migration services
  - [ ] Kindle/Kobo library import
    - [ ] Create library import service
    - [ ] Parse Kindle library files
    - [ ] Add Kobo library format support
    - [ ] Import reading progress and bookmarks
    - [ ] Handle metadata mapping and validation
  - [ ] Standard format exports
    - [ ] Create data export service
    - [ ] Add JSON/CSV export formats
    - [ ] Include reading statistics in exports
    - [ ] Create backup and restore functionality
    - [ ] Add selective export options
- **Frontend**: Migration wizard
  - [ ] Step-by-step import process
    - [ ] Create migration wizard component
    - [ ] Add file selection and validation
    - [ ] Implement progress tracking UI
    - [ ] Show import preview and summary
    - [ ] Add error handling and retry options
  - [ ] Progress tracking and validation
    - [ ] Display real-time import progress
    - [ ] Add validation error reporting
    - [ ] Create import conflict resolution
    - [ ] Show import success/failure summary
    - [ ] Add rollback functionality for failed imports
- **Estimated Effort**: 14 hours

---

### **Phase 5: Accessibility & Polish (Weeks 17-20)**
*Focus: Accessibility, performance, and user experience refinement*

#### **Sprint 9 (Week 17-18): Accessibility**

**9.1 Text-to-Speech Integration**
- **Backend**: TTS service integration
  - [ ] Web Speech API implementation
    - [ ] Create TTS service using Web Speech API
    - [ ] Add text extraction for speech
    - [ ] Implement voice configuration storage
    - [ ] Add TTS endpoints to API
    - [ ] Handle TTS error cases and fallbacks
  - [ ] Voice selection and controls
    - [ ] Implement available voice detection
    - [ ] Add voice preference storage
    - [ ] Create speech rate and pitch controls
    - [ ] Add voice quality optimization
    - [ ] Implement voice previewing
- **Frontend**: Audio reading controls
  - [ ] Play/pause/speed controls
    - [ ] Create audio control component
    - [ ] Add play/pause/stop functionality
    - [ ] Implement speed control slider
    - [ ] Add volume control
    - [ ] Create audio progress indicators
  - [ ] Visual reading progress sync
    - [ ] Sync text highlighting with speech
    - [ ] Add word-level highlighting
    - [ ] Implement auto-scroll during speech
    - [ ] Create sentence/paragraph tracking
    - [ ] Add speech navigation controls
- **Estimated Effort**: 12 hours

**9.2 Accessibility Compliance**
- **Frontend**: ARIA and keyboard navigation
  - [ ] Screen reader compatibility
    - [ ] Add ARIA labels to all interactive elements
    - [ ] Implement proper heading hierarchy
    - [ ] Add screen reader announcements
    - [ ] Create accessible table navigation
    - [ ] Add live region updates for dynamic content
  - [ ] Full keyboard control
    - [ ] Implement comprehensive keyboard shortcuts
    - [ ] Add tab navigation order
    - [ ] Create focus management system
    - [ ] Add keyboard accessibility hints
    - [ ] Implement escape key handling
  - [ ] High contrast mode improvements
    - [ ] Enhance existing high contrast theme
    - [ ] Add Windows high contrast mode detection
    - [ ] Improve color contrast ratios
    - [ ] Add focus indicators
    - [ ] Create accessible color schemes
- **Estimated Effort**: 10 hours

**9.3 Dyslexia & Vision Support**
- **Frontend**: Accessibility fonts and layouts
  - [ ] OpenDyslexic font integration
    - [ ] Add OpenDyslexic font files to project
    - [ ] Create dyslexia-friendly font option
    - [ ] Add font switching controls
    - [ ] Implement font weight adjustments
    - [ ] Create reading comfort presets
  - [ ] Large text modes
    - [ ] Add scalable text size options
    - [ ] Create zoom functionality for all text
    - [ ] Implement responsive text scaling
    - [ ] Add UI element scaling
    - [ ] Create magnification tools
  - [ ] Color customization for readability
    - [ ] Add background color options
    - [ ] Implement text color customization
    - [ ] Create contrast adjustment tools
    - [ ] Add color blindness support
    - [ ] Implement reading rulers/guides
- **Estimated Effort**: 8 hours

#### **Sprint 10 (Week 19-20): Performance & Polish**

**10.1 Performance Optimization**
- **Backend**: Query optimization and caching
  - [ ] Database indexing improvements
    - [ ] Analyze query performance bottlenecks
    - [ ] Add database indexes for frequent queries
    - [ ] Optimize search query performance
    - [ ] Implement query result pagination
    - [ ] Add database connection pooling
  - [ ] Response caching strategies
    - [ ] Implement Redis caching layer
    - [ ] Add API response caching
    - [ ] Create cache invalidation strategies
    - [ ] Add CDN integration for static assets
    - [ ] Implement browser caching headers
- **Frontend**: Lazy loading and virtual scrolling
  - [ ] Component optimization
    - [ ] Implement lazy loading for book components
    - [ ] Add virtual scrolling for large lists
    - [ ] Optimize PDF rendering performance
    - [ ] Implement component memoization
    - [ ] Add progressive image loading
  - [ ] Bundle size reduction
    - [ ] Analyze and optimize bundle size
    - [ ] Implement code splitting
    - [ ] Add tree shaking optimization
    - [ ] Optimize dependency imports
    - [ ] Implement lazy route loading
- **Estimated Effort**: 12 hours

**10.2 User Experience Refinement**
- **Frontend**: UI/UX improvements
  - [ ] Animation and transition polish
    - [ ] Add smooth page transitions
    - [ ] Implement hover and focus animations
    - [ ] Create loading animations
    - [ ] Add micro-interactions for user feedback
    - [ ] Optimize animation performance
  - [ ] Loading state improvements
    - [ ] Add skeleton loading screens
    - [ ] Implement progressive loading indicators
    - [ ] Create contextual loading messages
    - [ ] Add loading progress for large operations
    - [ ] Improve perceived performance with optimistic UI
  - [ ] Error handling and user feedback
    - [ ] Create comprehensive error handling system
    - [ ] Add user-friendly error messages
    - [ ] Implement retry mechanisms
    - [ ] Add success feedback notifications
    - [ ] Create help and guidance tooltips
- **Estimated Effort**: 8 hours

**10.3 Testing & Documentation**
- **Backend/Frontend**: Comprehensive testing
  - [ ] Unit test coverage increase
    - [ ] Increase backend unit test coverage to >80%
    - [ ] Add frontend component unit tests
    - [ ] Create service layer test suites
    - [ ] Add repository and use case tests
    - [ ] Implement test data factories
  - [ ] E2E test scenarios
    - [ ] Create end-to-end test automation
    - [ ] Add critical user journey tests
    - [ ] Implement cross-browser testing
    - [ ] Add mobile responsive tests
    - [ ] Create performance regression tests
  - [ ] API documentation updates
    - [ ] Update Swagger/OpenAPI documentation
    - [ ] Add code examples and usage guides
    - [ ] Create developer onboarding documentation
    - [ ] Add deployment and configuration guides
    - [ ] Create troubleshooting documentation
- **Estimated Effort**: 10 hours

---

### **Phase 6: User Authentication & Multi-User Support (Weeks 21-24)** ✅ **COMPLETED**
> See [COMPLETED_TASKS.md](./COMPLETED_TASKS.md) for full details

- ✅ Google OAuth 2.0 integration
- ✅ JWT-based session management
- ✅ Frontend authentication flow
- ✅ User-scoped data isolation
- ✅ Multi-user data architecture

#### **Remaining Multi-User Enhancements**

**User Data Management**
- [ ] Add bulk user data operations
- [ ] Create user data export/import endpoints
- [ ] Implement user account deletion
- [ ] Add user data cleanup procedures
- [ ] Create user storage quota management
- [ ] Add user activity logging
- [ ] Implement user data backup strategies

**User Experience & Profile**
- [ ] User profile editing interface
- [ ] User preference synchronization
- [ ] User theme settings per account
- [ ] User onboarding flow
- [ ] User dashboard with statistics

**User Sharing & Collaboration**
- [ ] Book sharing between users
- [ ] Reading list sharing
- [ ] Collections sharing
- [ ] Annotation sharing (optional)

**Security & Privacy**
- [ ] GDPR compliance features
- [ ] Rate limiting per user
- [ ] User data download (GDPR)
- [ ] User account deletion flow
- [ ] User consent management

#### **Technical Implementation Details**

**Database Schema Updates**
```sql
-- User table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Update existing tables to include user_id
ALTER TABLE books ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reading_progress ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE bookmarks ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE highlights ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_preferences ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
```

**New Service Dependencies**
```json
{
  "backend": [
    "@nestjs/passport": "^10.0.2",
    "@nestjs/jwt": "^10.2.0",
    "passport": "^0.6.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "@types/passport-google-oauth20": "^2.0.14",
    "@types/passport-jwt": "^3.0.13"
  ],
  "frontend": [
    "@google-cloud/local-auth": "^3.0.1",
    "google-auth-library": "^9.4.1"
  ]
}
```

**Environment Variables**
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Session Configuration
SESSION_SECRET=your_session_secret
SESSION_TIMEOUT=24h
```

**Frontend Authentication Service**
```typescript
// Example authentication service structure
@Injectable()
export class AuthService {
  signInWithGoogle(): void
  signOut(): Promise<void>
  getCurrentUser(): Observable<User | null>
  getAuthToken(): string | null
  refreshToken(): Promise<string>
  isAuthenticated(): boolean
}
```

---

## **📊 Implementation Priority Matrix**

### **✅ COMPLETED PRIORITIES**
> Detailed completion records available in [COMPLETED_TASKS.md](./COMPLETED_TASKS.md)

1. ✅ HuriDocs AI TOC Integration (20% → 85% success rate)
2. ✅ Google OAuth & Multi-User System
3. ✅ Full-Text Search System
4. ✅ Bookmarks with AI Note Generation
5. ✅ Recent Books & Quick Access
6. ✅ Book Cover Fetcher

### **🔥 NEXT PRIORITIES**
1. User Profile Management - Settings, preferences, and account management
2. TOC Quality Enhancements - Confidence scoring, editing interface
3. Reading Statistics Dashboard
4. Categories & Tags System

### **High Impact, Low Effort (Quick Wins)**
1. ✅ Recent books section - COMPLETED
2. Reading statistics dashboard
3. Advanced sorting options

### **High Impact, Medium Effort**
1. ✅ Full-text search - COMPLETED
2. Text highlighting system
3. EPUB format support
4. Custom themes
5. ✅ AI-powered TOC extraction - COMPLETED

### **High Impact, High Effort**
1. ✅ Google OAuth & Multi-User - COMPLETED
2. Comprehensive annotation system
3. Cloud storage integration
4. Smart reading analytics

### **Low Priority (Future Consideration)**
1. Social features and sharing
2. Advanced PDF editing
3. OCR integration
4. Mobile app development
5. AI-powered recommendations

---

## **🛠 Technical Implementation Notes**

### **Database Schema Extensions**
```sql
-- New tables to implement
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(id),
  page_number INTEGER,
  scroll_position FLOAT,
  title VARCHAR(255),
  note TEXT,
  created_at TIMESTAMP
);

CREATE TABLE highlights (
  id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(id),
  page_number INTEGER,
  coordinates JSON,
  color VARCHAR(7),
  text_content TEXT,
  created_at TIMESTAMP
);

CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  color VARCHAR(7),
  created_at TIMESTAMP
);

CREATE TABLE book_categories (
  book_id UUID REFERENCES books(id),
  category_id UUID REFERENCES categories(id),
  PRIMARY KEY (book_id, category_id)
);
```

### **New Service Dependencies**
```json
{
  "backend": [
    "pdf-parse": "^1.1.1",
    "axios": "^1.6.2",
    "form-data": "^4.0.0",
    "epub-parser": "^0.3.0",
    "node-html-parser": "^6.1.0",
    "mammoth": "^1.6.0"
  ],
  "backend-dev": [
    "@types/form-data": "^4.0.0"
  ],
  "frontend": [
    "@angular/cdk": "^20.2.5",
    "chart.js": "^4.4.0",
    "ng2-charts": "^6.0.1",
    "highlight.js": "^11.9.0"
  ],
  "infrastructure": [
    "huridocs/pdf-table-of-contents-extractor (Docker image)"
  ]
}
```

### **Docker Configuration Updates**
```yaml
# docker-compose.yml
version: '3.8'
services:
  # Existing services...
  
  huridocs-toc:
    image: huridocs/pdf-table-of-contents-extractor
    container_name: ebook-reader-huridocs-toc
    ports:
      - "5060:5060"
    environment:
      - DOCKER_MEMORY=4g
    volumes:
      - ./uploads:/app/uploads
    networks:
      - ebook-reader-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5060/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  ebook-reader-network:
    driver: bridge
```

### **Environment Variables**
```bash
# .env additions
HURIDOCS_TOC_URL=http://localhost:5060
HURIDOCS_ENABLED=true
HURIDOCS_TIMEOUT=120000
HURIDOCS_FAST_MODE=false
TOC_EXTRACTION_MAX_RETRIES=3
```

### **Performance Considerations**
- Implement database indexing on search fields
- Use virtual scrolling for large book lists
- Lazy load PDF pages outside viewport
- Cache frequently accessed book metadata
- Implement progressive web app caching strategies

---

## **📈 Success Metrics**

### **Development Metrics**
- Code coverage: >80%
- Build time: <2 minutes
- Bundle size: <2MB (frontend)
- API response time: <200ms

### **User Experience Metrics**
- Page load time: <3 seconds
- PDF rendering time: <5 seconds
- Search response time: <1 second
- Offline functionality: 100% for cached books

### **Feature Adoption Metrics**
- Bookmark usage: >60% of users
- Search usage: >40% of users
- Theme customization: >30% of users
- Multi-format usage: >25% of users

---

## **🔄 Continuous Improvement Plan**

### **Monthly Reviews**
- Performance monitoring and optimization
- User feedback integration
- Security updates and patches
- Dependency updates

### **Quarterly Enhancements**
- New format support evaluation
- Advanced feature prototyping
- Integration partner assessment
- Accessibility audit and improvements

### **Annual Major Releases**
- Architecture review and refactoring
- Technology stack updates
- Major feature additions
- Mobile app consideration

---

*This roadmap provides a structured approach to evolving the ebook reader from a solid foundation into a comprehensive digital reading platform. Each phase builds upon previous work while maintaining focus on user value and technical excellence.*