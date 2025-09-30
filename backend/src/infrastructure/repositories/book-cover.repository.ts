import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookCover, CoverSource, CoverUrls, CoverMetadata } from '../../domain/entities/book-cover.entity';
import { BookCoverRepository } from '../../domain/repositories/book-cover.repository.interface';
import { BookCoverOrmEntity } from '../database/entities/book-cover.orm-entity';
import { BookId } from '../../domain/value-objects';

@Injectable()
export class BookCoverRepositoryImpl implements BookCoverRepository {
  private readonly logger = new Logger(BookCoverRepositoryImpl.name);

  constructor(
    @InjectRepository(BookCoverOrmEntity)
    private readonly coverRepository: Repository<BookCoverOrmEntity>,
  ) {}

  async findByBookId(bookId: BookId): Promise<BookCover | null> {
    const ormEntity = await this.coverRepository.findOne({
      where: { bookId: bookId.value },
    });

    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findById(id: string): Promise<BookCover | null> {
    const ormEntity = await this.coverRepository.findOne({
      where: { id },
    });

    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async save(cover: BookCover): Promise<BookCover> {
    const ormEntity = this.toOrm(cover);
    const saved = await this.coverRepository.save(ormEntity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.coverRepository.delete({ id });
  }

  async deleteByBookId(bookId: BookId): Promise<void> {
    await this.coverRepository.delete({ bookId: bookId.value });
  }

  async exists(bookId: BookId): Promise<boolean> {
    const count = await this.coverRepository.count({
      where: { bookId: bookId.value },
    });
    return count > 0;
  }

  async findStaleCovers(maxAgeDays: number): Promise<BookCover[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const ormEntities = await this.coverRepository
      .createQueryBuilder('cover')
      .where('cover.fetched_at < :cutoffDate', { cutoffDate })
      .getMany();

    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async countCached(): Promise<number> {
    return await this.coverRepository.count({
      where: { isCached: true },
    });
  }

  /**
   * Convert ORM entity to domain entity
   */
  private toDomain(ormEntity: BookCoverOrmEntity): BookCover {
    const urls: CoverUrls = {
      thumbnail: ormEntity.thumbnailUrl,
      small: ormEntity.smallUrl,
      medium: ormEntity.mediumUrl,
      large: ormEntity.largeUrl,
    };

    const localPaths = {
      thumbnail: ormEntity.localThumbnailPath,
      small: ormEntity.localSmallPath,
      medium: ormEntity.localMediumPath,
      large: ormEntity.localLargePath,
    };

    return BookCover.reconstitute(
      ormEntity.id,
      BookId.fromString(ormEntity.bookId),
      ormEntity.source as CoverSource,
      urls,
      localPaths,
      ormEntity.fetchedAt,
      ormEntity.isCached,
      ormEntity.metadata as CoverMetadata | undefined
    );
  }

  /**
   * Convert domain entity to ORM entity
   */
  private toOrm(cover: BookCover): BookCoverOrmEntity {
    const ormEntity = new BookCoverOrmEntity();
    ormEntity.id = cover.id;
    ormEntity.bookId = cover.bookId.value;
    ormEntity.source = cover.source;
    ormEntity.thumbnailUrl = cover.thumbnailUrl;
    ormEntity.smallUrl = cover.smallUrl;
    ormEntity.mediumUrl = cover.mediumUrl;
    ormEntity.largeUrl = cover.largeUrl;
    ormEntity.localThumbnailPath = cover.localThumbnailPath;
    ormEntity.localSmallPath = cover.localSmallPath;
    ormEntity.localMediumPath = cover.localMediumPath;
    ormEntity.localLargePath = cover.localLargePath;
    ormEntity.fetchedAt = cover.fetchedAt;
    ormEntity.isCached = cover.isCached;
    ormEntity.metadata = cover.metadata;
    return ormEntity;
  }
}
