import { AggregateRoot } from '../events/aggregate-root';
import { BookId, UserId } from '../value-objects';
import { BookMetadata } from '../value-objects/book-metadata.value-object';
import { ReadPageCollection } from '../value-objects/read-page-collection.value-object';
import { TableOfContents } from '../value-objects/table-of-contents.value-object';
import { ReadingProgress } from '../entities/reading-progress.entity';
import { BookAddedEvent, BookDeletedEvent, BookOpenedEvent } from '../events/book-events';

/**
 * Book Aggregate Root
 * Encapsulates all book-related concepts and maintains consistency
 */
export class BookAggregate extends AggregateRoot {
  constructor(
    public readonly id: BookId,
    public readonly userId: UserId,
    public readonly metadata: BookMetadata,
    public readonly filePath: string,
    public readonly fileSize: number,
    public readonly mimeType: string,
    public readonly totalPages: number,
    public readonly addedAt: Date,
    public readonly lastOpened?: Date,
    public readonly textLength?: number,
    public readonly searchableText?: string,
    public readonly readingProgress?: ReadingProgress,
    public readonly readPages: ReadPageCollection = new ReadPageCollection(),
    public readonly tableOfContents: TableOfContents = TableOfContents.empty(),
    public coverId?: string,
  ) {
    super();
    this.validate();
  }

  private validate(): void {
    if (this.fileSize <= 0) {
      throw new Error('File size must be greater than 0');
    }
    if (!this.filePath?.trim()) {
      throw new Error('File path cannot be empty');
    }
    if (!this.mimeType?.trim()) {
      throw new Error('MIME type cannot be empty');
    }
    if (this.totalPages < 0) {
      throw new Error('Total pages cannot be negative');
    }
  }

  public static create(
    userId: UserId,
    metadata: BookMetadata,
    filePath: string,
    fileSize: number,
    mimeType: string,
    totalPages: number,
    textLength?: number,
    searchableText?: string,
  ): BookAggregate {
    const book = new BookAggregate(
      BookId.create(),
      userId,
      metadata,
      filePath,
      fileSize,
      mimeType,
      totalPages,
      new Date(),
      undefined,
      textLength,
      searchableText,
    );

    book.addDomainEvent(
      new BookAddedEvent(book.id, book.metadata.title, book.metadata.author, book.filePath)
    );

    return book;
  }

  // Business methods
  public open(): BookAggregate {
    const updatedBook = new BookAggregate(
      this.id,
      this.userId,
      this.metadata,
      this.filePath,
      this.fileSize,
      this.mimeType,
      this.totalPages,
      this.addedAt,
      new Date(), // Update last opened
      this.textLength,
      this.searchableText,
      this.readingProgress,
      this.readPages,
      this.tableOfContents,
    );

    updatedBook.addDomainEvent(
      new BookOpenedEvent(this.id, this.metadata.title)
    );

    return updatedBook;
  }

  public markPageAsRead(pageNumber: number): BookAggregate {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      throw new Error(`Invalid page number: ${pageNumber}. Must be between 1 and ${this.totalPages}`);
    }

    const updatedReadPages = this.readPages.addPage(pageNumber);
    
    return new BookAggregate(
      this.id,
      this.userId,
      this.metadata,
      this.filePath,
      this.fileSize,
      this.mimeType,
      this.totalPages,
      this.addedAt,
      this.lastOpened,
      this.textLength,
      this.searchableText,
      this.readingProgress,
      updatedReadPages,
      this.tableOfContents,
    );
  }

  public unmarkPageAsRead(pageNumber: number): BookAggregate {
    const updatedReadPages = this.readPages.removePage(pageNumber);
    
    return new BookAggregate(
      this.id,
      this.userId,
      this.metadata,
      this.filePath,
      this.fileSize,
      this.mimeType,
      this.totalPages,
      this.addedAt,
      this.lastOpened,
      this.textLength,
      this.searchableText,
      this.readingProgress,
      updatedReadPages,
      this.tableOfContents,
    );
  }

  public updateReadingProgress(
    currentPage: number,
    scrollPosition: number,
    additionalReadingTime: number = 0,
  ): BookAggregate {
    if (currentPage < 0 || currentPage > this.totalPages) {
      throw new Error(`Invalid page number: ${currentPage}. Must be between 0 and ${this.totalPages}`);
    }

    const updatedProgress = this.readingProgress
      ? this.readingProgress.updateProgress(currentPage, scrollPosition, this.totalPages, additionalReadingTime)
      : new ReadingProgress(
          `${this.id.value}-progress`,
          this.id,
          this.userId,
          currentPage,
          scrollPosition,
          this.totalPages > 0 ? (currentPage / this.totalPages) * 100 : 0,
          new Date(),
          additionalReadingTime,
        );

    return new BookAggregate(
      this.id,
      this.userId,
      this.metadata,
      this.filePath,
      this.fileSize,
      this.mimeType,
      this.totalPages,
      this.addedAt,
      this.lastOpened,
      this.textLength,
      this.searchableText,
      updatedProgress,
      this.readPages,
      this.tableOfContents,
    );
  }

  public setTableOfContents(toc: TableOfContents): BookAggregate {
    return new BookAggregate(
      this.id,
      this.userId,
      this.metadata,
      this.filePath,
      this.fileSize,
      this.mimeType,
      this.totalPages,
      this.addedAt,
      this.lastOpened,
      this.textLength,
      this.searchableText,
      this.readingProgress,
      this.readPages,
      toc,
    );
  }

  public delete(): void {
    this.addDomainEvent(
      new BookDeletedEvent(this.id, this.metadata.title)
    );
  }

  // Query methods
  public isPDF(): boolean {
    return this.mimeType === 'application/pdf';
  }

  public isCompleted(): boolean {
    return this.readingProgress?.isCompleted() ?? false;
  }

  public getProgressPercentage(): number {
    return this.readingProgress?.progressPercentage ?? 0;
  }

  public getReadPagesCount(): number {
    return this.readPages.getReadCount();
  }

  public isPageRead(pageNumber: number): boolean {
    return this.readPages.hasPage(pageNumber);
  }

  public hasTableOfContents(): boolean {
    return !this.tableOfContents.isEmpty();
  }

  public getDisplayName(): string {
    return this.metadata.getDisplayName();
  }

  // Domain business rules
  public canBeDeleted(): boolean {
    // Business rule: Books can always be deleted
    // In the future, you might add rules like "can't delete if borrowed"
    return true;
  }

  public calculateOverallProgress(): number {
    // Business logic: combine reading progress with read pages
    const progressFromCurrentPage = this.getProgressPercentage();
    const progressFromReadPages = this.readPages.calculateReadingProgress(this.totalPages);
    
    // Use the higher of the two progress indicators
    return Math.max(progressFromCurrentPage, progressFromReadPages);
  }
}