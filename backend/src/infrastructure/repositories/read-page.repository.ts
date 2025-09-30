import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadPageRepository } from '../../domain/repositories/read-page.repository.interface';
import { ReadPage } from '../../domain/entities/read-page.entity';
import { ReadPageOrmEntity } from '../database/entities/read-page.orm-entity';
import { BookId, UserId } from '../../domain/value-objects';

@Injectable()
export class ReadPageRepositoryImpl implements ReadPageRepository {
  constructor(
    @InjectRepository(ReadPageOrmEntity)
    private readonly readPageOrmRepository: Repository<ReadPageOrmEntity>,
  ) {}

  async findByBookId(bookId: BookId): Promise<ReadPage[]> {
    const ormEntities = await this.readPageOrmRepository.find({
      where: { bookId: bookId.value },
      order: { pageNumber: 'ASC' }
    });

    return ormEntities.map(this.toDomain);
  }

  async save(readPage: ReadPage): Promise<ReadPage> {
    const ormEntity: ReadPageOrmEntity = {
      id: readPage.id,
      bookId: readPage.bookId.value,
      userId: readPage.userId.value,
      pageNumber: readPage.pageNumber,
      markedAt: readPage.markedAt,
      book: null // Will be populated by TypeORM if needed
    };

    const saved = await this.readPageOrmRepository.save(ormEntity);
    return this.toDomain(saved);
  }

  async delete(bookId: BookId, pageNumber: number): Promise<void> {
    await this.readPageOrmRepository.delete({ bookId: bookId.value, pageNumber });
  }

  async deleteAllByBookId(bookId: BookId): Promise<void> {
    await this.readPageOrmRepository.delete({ bookId: bookId.value });
  }

  private toDomain(ormEntity: ReadPageOrmEntity): ReadPage {
    return new ReadPage(
      ormEntity.id,
      BookId.fromString(ormEntity.bookId),
      UserId.fromString(ormEntity.userId),
      ormEntity.pageNumber,
      ormEntity.markedAt,
    );
  }
}