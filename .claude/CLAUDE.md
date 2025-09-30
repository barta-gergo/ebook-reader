On new task check if we have relevant todos in: FEATURE_ROADMAP.md
The db is sqlite.
We using search indexing meili search.
We have e2e tests, backend tests and frontend tests.
Dont use 'enhanced' prefix.

Create tests for all code you add.
When you estimate it is useless to tell time duration month or anything. Since it will be done by coding agent.

# Project Architecture

## Backend (NestJS + TypeScript)
- **Domain-Driven Design (DDD)** with clean architecture
- **Layers**:
  - Domain: Entities, Value Objects, Aggregates, Repository Interfaces
  - Application: Commands, Queries, Application Services
  - Infrastructure: ORM Entities, Repository Implementations, External Services
  - Presentation: Controllers (REST API)
- **Database**: SQLite with TypeORM
- **Search**: Meilisearch for full-text search
- **Authentication**: JWT with Google OAuth
- **Testing**: Jest for unit and integration tests

## Frontend (Angular + TypeScript)
- **Standalone Components** architecture
- **Services**: HTTP client services with RxJS reactive state management
- **UI Components**:
  - Book list/library view
  - PDF viewer with ng2-pdf-viewer
  - Search interface
  - User profile and settings
  - Bookmarks panel
- **Styling**: SCSS with CSS variables for theming
- **Testing**: Karma + Jasmine

## Key Features Implemented
1. **Multi-user data isolation** - User-scoped data access
2. **Reading progress tracking** - Page-level progress with visual indicators
3. **Bookmarks system** - Add/edit/delete bookmarks with notes
4. **AI-powered bookmark notes** - Generate bookmark summaries using local LLM (Ollama)
5. **Full-text search** - Search across all books using Meilisearch
6. **Table of Contents** - Extract and display PDF TOC
7. **User preferences** - Theme, zoom, reading settings
8. **OAuth authentication** - Google sign-in

## Development Workflow
1. **Backend changes**: Always update TypeORM entities in both `entities/` and register in `database.config.ts`
2. **New features**: Follow DDD pattern - Domain → Application → Infrastructure → Presentation
3. **Testing**: Write tests for all new code (unit + integration)
4. **API**: Controllers use NestJS decorators, return DTOs, validate with guards
5. **Frontend**: Services manage state with BehaviorSubject, components subscribe to observables
6. **Styling**: Use CSS variables defined in styles.scss for consistent theming

## LLM Integration (Ollama)
- **Architecture**: Strategy Pattern with pluggable LLM service providers
- **Current Provider**: OllamaLLMService (local LLM via Ollama)
- **Configuration**: Environment variables in `.env`
  - `OLLAMA_BASE_URL=http://localhost:11434`
  - `LLM_MODEL=gemma3:1b` (or llama3.2:3b recommended)
  - `LLM_PROVIDER=ollama`
- **PDF Text Extraction**: Uses `pdf-parse` library for page-specific text extraction
- **Use Case**: Generate AI-powered bookmark notes from PDF page content
- **Key Files**:
  - Domain: `domain/services/llm.interface.ts` (abstraction)
  - Infrastructure: `infrastructure/services/ollama-llm.service.ts` (implementation)
  - Application: `application/services/bookmark.application.service.ts` (generateNoteForPage method)
  - Text Extraction: `infrastructure/services/text-indexing.service.ts` (getPageText method)

## Common Pitfalls to Avoid
- Forgetting to add new ORM entities to `database.config.ts` entities array
- Not registering providers in `app.module.ts` or relevant module (use tokens for DI)
- Missing JWT guards on protected endpoints
- Not implementing user isolation checks in services
- Forgetting to create tests for new features
- PDF page extraction: Database `totalPages` may differ from actual PDF page count - always verify with actual PDF
- LLM prompts: Use plain text instructions, explicitly forbid markdown/formatting in system prompts
- When using Strategy Pattern for services: Define interface in domain layer, implement in infrastructure layer