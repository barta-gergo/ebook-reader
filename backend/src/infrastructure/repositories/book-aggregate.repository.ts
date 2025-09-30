import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { BookAggregateRepository } from '../../domain/repositories/book-aggregate.repository.interface';
import { BookAggregate } from '../../domain/aggregates/book.aggregate';
import { BookId, UserId, BookMetadata, ReadPageCollection, TableOfContents, TocEntry } from '../../domain/value-objects';
import { ReadingProgress } from '../../domain/entities/reading-progress.entity';
import { BookOrmEntity } from '../database/entities/book.orm-entity';
import { ReadingProgressOrmEntity } from '../database/entities/reading-progress.orm-entity';
import { ReadPagesOrmEntity } from '../database/entities/read-pages.orm-entity';
import { TocItemOrmEntity } from '../database/entities/toc-item.orm-entity';

/**
 * Repository implementation for Book Aggregate
 * Handles mapping between domain aggregate and ORM entities
 */
@Injectable()
export class BookAggregateRepositoryImpl implements BookAggregateRepository {
  constructor(
    @InjectRepository(BookOrmEntity)
    private readonly bookRepository: Repository<BookOrmEntity>,
    @InjectRepository(ReadingProgressOrmEntity)
    private readonly readingProgressRepository: Repository<ReadingProgressOrmEntity>,
    @InjectRepository(ReadPagesOrmEntity)
    private readonly readPagesRepository: Repository<ReadPagesOrmEntity>,
    @InjectRepository(TocItemOrmEntity)
    private readonly tocItemRepository: Repository<TocItemOrmEntity>,
  ) {}

  async findById(id: BookId): Promise<BookAggregate | null> {
    const ormEntity = await this.bookRepository.findOne({ 
      where: { id: id.value }
    });
    
    if (!ormEntity) {
      return null;
    }

    // Explicitly load reading progress since OneToOne inverse relationships can be tricky
    const readingProgress = await this.readingProgressRepository.findOne({
      where: { bookId: id.value }
    });
    
    // Manually attach the reading progress to the book entity
    ormEntity.readingProgress = readingProgress || undefined;

    return await this.toDomain(ormEntity);
  }

  async findAll(): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository.find({ 
      order: { lastOpened: 'DESC', addedAt: 'DESC' }
    });
    
    // Load reading progress for all books
    const bookIds = ormEntities.map(entity => entity.id);
    const allReadingProgress = await this.readingProgressRepository.find({
      where: { bookId: In(bookIds) }
    });
    
    // Create a map for quick lookup
    const progressMap = new Map(allReadingProgress.map(progress => [progress.bookId, progress]));
    
    // Attach reading progress to each book entity
    ormEntities.forEach(entity => {
      entity.readingProgress = progressMap.get(entity.id);
    });
    
    const aggregates = await Promise.all(
      ormEntities.map(entity => this.toDomain(entity))
    );
    
    return aggregates;
  }

  async findAllByUserId(userId: UserId): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository.find({ 
      where: { userId: userId.value },
      order: { lastOpened: 'DESC', addedAt: 'DESC' }
    });
    
    // Load reading progress for all books
    const bookIds = ormEntities.map(entity => entity.id);
    const allReadingProgress = await this.readingProgressRepository.find({
      where: { bookId: In(bookIds) }
    });
    
    // Create a map for quick lookup
    const progressMap = new Map(allReadingProgress.map(progress => [progress.bookId, progress]));
    
    // Attach reading progress to each book entity
    ormEntities.forEach(entity => {
      entity.readingProgress = progressMap.get(entity.id);
    });
    
    const aggregates = await Promise.all(
      ormEntities.map(entity => this.toDomain(entity))
    );
    
    return aggregates;
  }

  async save(book: BookAggregate): Promise<BookAggregate> {
    // Save main book entity
    const ormEntity = this.toOrm(book);
    const savedEntity = await this.bookRepository.save(ormEntity);

    // Save reading progress if exists
    if (book.readingProgress) {
      // Check if reading progress already exists for this book
      const existingProgress = await this.readingProgressRepository.findOne({
        where: { bookId: book.id.value }
      });
      
      const progressOrm = this.readingProgressToOrm(book.readingProgress, book.id);
      
      // If it exists, use the existing ID to update instead of creating new
      if (existingProgress) {
        progressOrm.id = existingProgress.id;
      }
      
      await this.readingProgressRepository.save(progressOrm);
    }

    // Save read pages
    const readPagesOrm = this.readPagesToOrm(book.readPages, book.id, book.userId);
    if (readPagesOrm) {
      await this.readPagesRepository.save(readPagesOrm);
    } else {
      // Delete if no pages are read
      await this.readPagesRepository.delete({ bookId: book.id.value });
    }

    // Save table of contents
    await this.saveTocItems(book.tableOfContents, book.id, book.userId);

    // Reload the book with all relations to ensure we have the latest data
    const reloadedBook = await this.findById(book.id);
    if (!reloadedBook) {
      throw new Error(`Failed to reload book after save: ${book.id.value}`);
    }
    
    return reloadedBook;
  }

  async delete(id: BookId): Promise<void> {
    // Delete related entities first (cascade should handle this, but being explicit)
    await this.readingProgressRepository.delete({ bookId: id.value });
    await this.readPagesRepository.delete({ bookId: id.value });
    await this.tocItemRepository.delete({ bookId: id.value });
    await this.bookRepository.delete(id.value);
  }

  async findByTitle(title: string): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository.find({
      where: { title: Like(`%${title}%`) },
      relations: ['readingProgress']
    });
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async findByAuthor(author: string): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository.find({
      where: { author: Like(`%${author}%`) },
      relations: ['readingProgress']
    });
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async findCompleted(): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.readingProgress', 'progress')
      .where('progress.progressPercentage >= 100')
      .getMany();
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async findInProgress(): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.readingProgress', 'progress')
      .where('progress.progressPercentage > 0 AND progress.progressPercentage < 100')
      .getMany();
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async findByProgressRange(minPercent: number, maxPercent: number): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.readingProgress', 'progress')
      .where('progress.progressPercentage >= :min AND progress.progressPercentage <= :max', 
             { min: minPercent, max: maxPercent })
      .getMany();
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async exists(id: BookId): Promise<boolean> {
    const count = await this.bookRepository.count({ where: { id: id.value } });
    return count > 0;
  }

  async count(): Promise<number> {
    return await this.bookRepository.count();
  }

  async findByTitleAndUserId(title: string, userId: UserId): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository.find({
      where: { 
        title: Like(`%${title}%`),
        userId: userId.value 
      },
      relations: ['readingProgress']
    });
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async findByAuthorAndUserId(author: string, userId: UserId): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository.find({
      where: { 
        author: Like(`%${author}%`),
        userId: userId.value 
      },
      relations: ['readingProgress']
    });
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async findCompletedByUserId(userId: UserId): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.readingProgress', 'progress')
      .where('book.userId = :userId', { userId: userId.value })
      .andWhere('progress.progressPercentage >= 100')
      .getMany();
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async findInProgressByUserId(userId: UserId): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.readingProgress', 'progress')
      .where('book.userId = :userId', { userId: userId.value })
      .andWhere('progress.progressPercentage > 0 AND progress.progressPercentage < 100')
      .getMany();
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async findByProgressRangeAndUserId(minPercent: number, maxPercent: number, userId: UserId): Promise<BookAggregate[]> {
    const ormEntities = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.readingProgress', 'progress')
      .where('book.userId = :userId', { userId: userId.value })
      .andWhere('progress.progressPercentage >= :min AND progress.progressPercentage <= :max', 
               { min: minPercent, max: maxPercent })
      .getMany();
    
    return await Promise.all(ormEntities.map(entity => this.toDomain(entity)));
  }

  async existsForUser(id: BookId, userId: UserId): Promise<boolean> {
    const count = await this.bookRepository.count({ 
      where: { 
        id: id.value,
        userId: userId.value 
      } 
    });
    return count > 0;
  }

  async countByUserId(userId: UserId): Promise<number> {
    return await this.bookRepository.count({ 
      where: { userId: userId.value } 
    });
  }

  // Private mapping methods
  private async toDomain(ormEntity: BookOrmEntity): Promise<BookAggregate> {
    // Create metadata value object
    const metadata = BookMetadata.create({
      title: ormEntity.title,
      author: ormEntity.author,
      subject: ormEntity.subject,
      keywords: ormEntity.keywords,
      creator: ormEntity.creator,
      producer: ormEntity.producer,
      creationDate: ormEntity.creationDate,
      modificationDate: ormEntity.modificationDate,
      version: ormEntity.version,
    });

    // Convert reading progress
    const readingProgress = ormEntity.readingProgress 
      ? new ReadingProgress(
          ormEntity.readingProgress.id,
          BookId.fromString(ormEntity.readingProgress.bookId),
          UserId.fromString(ormEntity.readingProgress.userId),
          ormEntity.readingProgress.currentPage,
          ormEntity.readingProgress.scrollPosition,
          ormEntity.readingProgress.progressPercentage,
          ormEntity.readingProgress.lastUpdated,
          ormEntity.readingProgress.readingTimeMinutes,
        )
      : undefined;

    // Load read pages
    const readPagesEntity = await this.readPagesRepository.findOne({
      where: { bookId: ormEntity.id }
    });
    const readPages = readPagesEntity 
      ? new ReadPageCollection(JSON.parse(readPagesEntity.readPages))
      : new ReadPageCollection();

    // Load table of contents
    const tocItems = await this.tocItemRepository.find({
      where: { bookId: ormEntity.id },
      order: { order: 'ASC' }
    });
    const tableOfContents = this.tocItemsToTableOfContents(tocItems);

    return new BookAggregate(
      BookId.fromString(ormEntity.id),
      UserId.fromString(ormEntity.userId),
      metadata,
      ormEntity.filePath,
      ormEntity.fileSize,
      ormEntity.mimeType,
      ormEntity.totalPages,
      ormEntity.addedAt,
      ormEntity.lastOpened,
      ormEntity.textLength,
      ormEntity.searchableText,
      readingProgress,
      readPages,
      tableOfContents,
      ormEntity.coverId,
    );
  }

  private toOrm(aggregate: BookAggregate): BookOrmEntity {
    const ormEntity = new BookOrmEntity();
    ormEntity.id = aggregate.id.value;
    ormEntity.userId = aggregate.userId.value;
    ormEntity.title = aggregate.metadata.title;
    ormEntity.author = aggregate.metadata.author;
    ormEntity.filePath = aggregate.filePath;
    ormEntity.fileSize = aggregate.fileSize;
    ormEntity.mimeType = aggregate.mimeType;
    ormEntity.totalPages = aggregate.totalPages;
    ormEntity.subject = aggregate.metadata.subject;
    ormEntity.keywords = aggregate.metadata.keywords;
    ormEntity.creator = aggregate.metadata.creator;
    ormEntity.producer = aggregate.metadata.producer;
    ormEntity.creationDate = aggregate.metadata.creationDate;
    ormEntity.modificationDate = aggregate.metadata.modificationDate;
    ormEntity.version = aggregate.metadata.version;
    ormEntity.textLength = aggregate.textLength || 0;
    ormEntity.searchableText = aggregate.searchableText;
    ormEntity.coverId = aggregate.coverId;
    ormEntity.addedAt = aggregate.addedAt;
    ormEntity.lastOpened = aggregate.lastOpened;
    return ormEntity;
  }

  private readingProgressToOrm(progress: ReadingProgress, bookId: BookId): ReadingProgressOrmEntity {
    const ormEntity = new ReadingProgressOrmEntity();
    ormEntity.id = progress.id;
    ormEntity.bookId = bookId.value;
    ormEntity.userId = progress.userId.value;
    ormEntity.currentPage = progress.currentPage;
    ormEntity.scrollPosition = progress.scrollPosition;
    ormEntity.progressPercentage = progress.progressPercentage;
    ormEntity.lastUpdated = progress.lastUpdated;
    ormEntity.readingTimeMinutes = progress.readingTimeMinutes;
    return ormEntity;
  }

  private readPagesToOrm(readPages: ReadPageCollection, bookId: BookId, userId: UserId): ReadPagesOrmEntity | null {
    if (readPages.isEmpty()) {
      return null;
    }

    const ormEntity = new ReadPagesOrmEntity();
    ormEntity.id = `read-pages-${bookId.value}`;
    ormEntity.bookId = bookId.value;
    ormEntity.userId = userId.value;
    ormEntity.readPages = JSON.stringify(readPages.getReadPages());
    ormEntity.lastUpdated = new Date();
    return ormEntity;
  }

  private async saveTocItems(toc: TableOfContents, bookId: BookId, userId: UserId): Promise<void> {
    // Delete existing TOC items
    await this.tocItemRepository.delete({ bookId: bookId.value });

    if (toc.isEmpty()) {
      return;
    }

    // Save new TOC items
    const saveEntry = async (entry: TocEntry, parentId?: string, order: number = 0): Promise<void> => {
      const ormEntity = new TocItemOrmEntity();
      ormEntity.id = `toc-${bookId.value}-${Date.now()}-${Math.random()}`;
      ormEntity.bookId = bookId.value;
      ormEntity.userId = userId.value;
      ormEntity.title = entry.title;
      ormEntity.page = entry.page;
      ormEntity.level = entry.level;
      ormEntity.parentId = parentId;
      ormEntity.order = order;

      const saved = await this.tocItemRepository.save(ormEntity);

      // Save children
      for (let i = 0; i < entry.children.length; i++) {
        await saveEntry(entry.children[i], saved.id, i);
      }
    };

    const entries = toc.getEntries();
    for (let i = 0; i < entries.length; i++) {
      await saveEntry(entries[i], undefined, i);
    }
  }

  private tocItemsToTableOfContents(tocItems: TocItemOrmEntity[]): TableOfContents {
    if (tocItems.length === 0) {
      return TableOfContents.empty();
    }

    // Build hierarchy
    const itemMap = new Map<string, TocEntry>();
    const rootItems: TocEntry[] = [];

    // First pass: create all entries
    for (const item of tocItems) {
      const entry = new TocEntry(item.title, item.page, item.level);
      itemMap.set(item.id, entry);
    }

    // Second pass: build hierarchy
    for (const item of tocItems) {
      const entry = itemMap.get(item.id)!;
      
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          // Add as child to parent
          const updatedParent = parent.addChild(entry);
          itemMap.set(item.parentId, updatedParent);
        }
      } else {
        rootItems.push(entry);
      }
    }

    return TableOfContents.create(rootItems);
  }
}