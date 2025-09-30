import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { databaseConfig } from './infrastructure/config/database.config';
import { BookOrmEntity } from './infrastructure/database/entities/book.orm-entity';
import { ReadingProgressOrmEntity } from './infrastructure/database/entities/reading-progress.orm-entity';
import { ReadPageOrmEntity } from './infrastructure/database/entities/read-page.orm-entity';
import { ReadPagesOrmEntity } from './infrastructure/database/entities/read-pages.orm-entity';
import { UserPreferencesOrmEntity } from './infrastructure/database/entities/user-preferences.orm-entity';
import { TocItemOrmEntity } from './infrastructure/database/entities/toc-item.orm-entity';
import { UserOrmEntity } from './infrastructure/database/entities/user.orm-entity';
import { BookmarkOrmEntity } from './infrastructure/database/entities/bookmark.orm-entity';
import { BookCoverOrmEntity } from './infrastructure/database/entities/book-cover.orm-entity';
import { BooksController } from './presentation/controllers/books.controller';
import { BookmarksController } from './presentation/controllers/bookmarks.controller';
import { CoversController } from './presentation/controllers/covers.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { AuthModule } from './infrastructure/auth/auth.module';
import { ReadPageRepositoryImpl } from './infrastructure/repositories/read-page.repository';
import { UserPreferencesRepositoryImpl } from './infrastructure/repositories/user-preferences.repository';
import { TocItemRepositoryImpl } from './infrastructure/repositories/toc-item.repository';
import { PdfMetadataService } from './infrastructure/services/pdf-metadata.service';
import { TextIndexingService } from './infrastructure/services/text-indexing.service';
import { MeilisearchService } from './infrastructure/services/meilisearch.service';
import { HuriDocsTocService } from './infrastructure/services/huridocs-toc.service';
import { FileSystemServiceImpl } from './infrastructure/services/file-system.service';
import { OllamaLLMService } from './infrastructure/services/ollama-llm.service';
import { GoogleBooksCoverService } from './infrastructure/services/google-books-cover.service';
import { OpenLibraryCoverService } from './infrastructure/services/open-library-cover.service';
import { CoverFetcherOrchestratorService } from './infrastructure/services/cover-fetcher-orchestrator.service';
import { BookCoverRepositoryImpl } from './infrastructure/repositories/book-cover.repository';
// Commands
import { AddBookCommand } from './application/commands/book/add-book.command';
import { DeleteBookCommand } from './application/commands/book/delete-book.command';
import { UploadBookCommand } from './application/commands/book/upload-book.command';
import { UpdateReadingProgressCommand } from './application/commands/reading-progress/update-reading-progress.command';
import { MarkPageAsReadCommand } from './application/commands/reading-progress/mark-page-as-read.command';
import { UnmarkPageAsReadCommand } from './application/commands/reading-progress/unmark-page-as-read.command';
import { SaveBookTocCommand } from './application/commands/toc/save-book-toc.command';
import { ManageUserPreferencesCommand } from './application/commands/user-preferences/manage-user-preferences.command';
import { ReindexAllBooksCommand } from './application/commands/system/reindex-all-books.command';

// Queries  
import { GetAllBooksQuery } from './application/queries/book/get-all-books.query';
import { GetBookByIdQuery } from './application/queries/book/get-book-by-id.query';
import { SearchBooksByTitleQuery } from './application/queries/search/search-books-by-title.query';
import { SearchBooksByAuthorQuery } from './application/queries/search/search-books-by-author.query';
import { SearchBooksByContentQuery } from './application/queries/search/search-books-by-content.query';
import { GetReadPagesQuery } from './application/queries/reading-progress/get-read-pages.query';
import { GetReadingProgressQuery } from './application/queries/reading-progress/get-reading-progress.query';
import { GetBookTocQuery } from './application/queries/toc/get-book-toc.query';
import { BookAggregateApplicationService } from './application/services/book-aggregate-application.service';
import { BookmarkApplicationService } from './application/services/bookmark.application.service';
import { BookCoverApplicationService } from './application/services/book-cover-application.service';
import { BookAggregateRepositoryImpl } from './infrastructure/repositories/book-aggregate.repository';
import { BookmarkRepositoryImpl } from './infrastructure/repositories/bookmark.repository';
import { BookDomainService } from './domain/services/book-domain.service';
import { READ_PAGE_REPOSITORY, USER_PREFERENCES_REPOSITORY, TOC_ITEM_REPOSITORY, FILE_SYSTEM_SERVICE, PDF_METADATA_SERVICE, SEARCH_SERVICE, TEXT_INDEXING_SERVICE, TOC_EXTRACTION_SERVICE, BOOK_AGGREGATE_REPOSITORY, BOOKMARK_REPOSITORY, LLM_SERVICE, BOOK_COVER_REPOSITORY } from './domain/repositories/tokens';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([BookOrmEntity, ReadingProgressOrmEntity, ReadPageOrmEntity, ReadPagesOrmEntity, UserPreferencesOrmEntity, TocItemOrmEntity, UserOrmEntity, BookmarkOrmEntity, BookCoverOrmEntity]),
    HttpModule,
    AuthModule,
  ],
  controllers: [BooksController, BookmarksController, CoversController, AuthController],
  providers: [
    BookAggregateApplicationService,
    BookmarkApplicationService,
    BookCoverApplicationService,
    BookDomainService,
    PdfMetadataService,
    HuriDocsTocService,
    TextIndexingService,
    MeilisearchService,
    GoogleBooksCoverService,
    OpenLibraryCoverService,
    CoverFetcherOrchestratorService,
    // Commands
    AddBookCommand,
    DeleteBookCommand,
    UploadBookCommand,
    UpdateReadingProgressCommand,
    MarkPageAsReadCommand,
    UnmarkPageAsReadCommand,
    SaveBookTocCommand,
    ManageUserPreferencesCommand,
    ReindexAllBooksCommand,
    // Queries
    GetAllBooksQuery,
    GetBookByIdQuery,
    SearchBooksByTitleQuery,
    SearchBooksByAuthorQuery,
    SearchBooksByContentQuery,
    GetReadPagesQuery,
    GetReadingProgressQuery,
    GetBookTocQuery,
    {
      provide: READ_PAGE_REPOSITORY,
      useClass: ReadPageRepositoryImpl,
    },
    {
      provide: USER_PREFERENCES_REPOSITORY,
      useClass: UserPreferencesRepositoryImpl,
    },
    {
      provide: FILE_SYSTEM_SERVICE,
      useClass: FileSystemServiceImpl,
    },
    {
      provide: TOC_ITEM_REPOSITORY,
      useClass: TocItemRepositoryImpl,
    },
    {
      provide: PDF_METADATA_SERVICE,
      useClass: PdfMetadataService,
    },
    {
      provide: SEARCH_SERVICE,
      useClass: MeilisearchService,
    },
    {
      provide: TEXT_INDEXING_SERVICE,
      useClass: TextIndexingService,
    },
    {
      provide: TOC_EXTRACTION_SERVICE,
      useClass: HuriDocsTocService,
    },
    {
      provide: BOOK_AGGREGATE_REPOSITORY,
      useClass: BookAggregateRepositoryImpl,
    },
    {
      provide: BOOKMARK_REPOSITORY,
      useClass: BookmarkRepositoryImpl,
    },
    {
      provide: LLM_SERVICE,
      useClass: OllamaLLMService,
    },
    {
      provide: BOOK_COVER_REPOSITORY,
      useClass: BookCoverRepositoryImpl,
    },
  ],
})
export class AppModule {}