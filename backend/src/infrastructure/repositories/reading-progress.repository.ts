import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingProgressRepository } from '../../domain/repositories/reading-progress.repository.interface';
import { ReadingProgress } from '../../domain/entities/reading-progress.entity';
import { ReadingProgressOrmEntity } from '../database/entities/reading-progress.orm-entity';
import { BookId, UserId } from '../../domain/value-objects';

@Injectable()
export class ReadingProgressRepositoryImpl implements ReadingProgressRepository {
  constructor(
    @InjectRepository(ReadingProgressOrmEntity)
    private readonly progressRepository: Repository<ReadingProgressOrmEntity>,
  ) {}

  async findById(id: string): Promise<ReadingProgress | null> {
    const ormEntity = await this.progressRepository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByBookId(bookId: string): Promise<ReadingProgress | null> {
    const ormEntity = await this.progressRepository.findOne({ where: { bookId } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async save(progress: ReadingProgress): Promise<ReadingProgress> {
    const ormEntity = this.toOrm(progress);
    const savedEntity = await this.progressRepository.save(ormEntity);
    return this.toDomain(savedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.progressRepository.delete(id);
  }

  async deleteByBookId(bookId: string): Promise<void> {
    await this.progressRepository.delete({ bookId });
  }

  async findRecentlyRead(limit: number): Promise<ReadingProgress[]> {
    const ormEntities = await this.progressRepository.find({
      order: { lastUpdated: 'DESC' },
      take: limit,
    });
    return ormEntities.map(entity => this.toDomain(entity));
  }

  private toDomain(ormEntity: ReadingProgressOrmEntity): ReadingProgress {
    return new ReadingProgress(
      ormEntity.id,
      BookId.fromString(ormEntity.bookId),
      UserId.fromString(ormEntity.userId),
      ormEntity.currentPage,
      ormEntity.scrollPosition,
      ormEntity.progressPercentage,
      ormEntity.lastUpdated,
      ormEntity.readingTimeMinutes,
    );
  }

  private toOrm(domain: ReadingProgress): ReadingProgressOrmEntity {
    const ormEntity = new ReadingProgressOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.bookId = domain.bookId.value;
    ormEntity.userId = domain.userId.value;
    ormEntity.currentPage = domain.currentPage;
    ormEntity.scrollPosition = domain.scrollPosition;
    ormEntity.progressPercentage = domain.progressPercentage;
    ormEntity.lastUpdated = domain.lastUpdated;
    ormEntity.readingTimeMinutes = domain.readingTimeMinutes;
    return ormEntity;
  }
}