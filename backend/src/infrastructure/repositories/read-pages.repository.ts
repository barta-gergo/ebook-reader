import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadPagesRepository } from '../../domain/repositories/read-pages.repository.interface';
import { ReadPages } from '../../domain/entities/read-pages.entity';
import { ReadPagesOrmEntity } from '../database/entities/read-pages.orm-entity';
import { BookId } from '../../domain/value-objects';

@Injectable()
export class ReadPagesRepositoryImpl implements ReadPagesRepository {
  constructor(
    @InjectRepository(ReadPagesOrmEntity)
    private readonly readPagesRepository: Repository<ReadPagesOrmEntity>,
  ) {}

  async findByBookId(bookId: string): Promise<ReadPages | null> {
    const ormEntity = await this.readPagesRepository.findOne({ where: { bookId } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async save(readPages: ReadPages): Promise<ReadPages> {
    const ormEntity = this.toOrm(readPages);
    const savedEntity = await this.readPagesRepository.save(ormEntity);
    return this.toDomain(savedEntity);
  }

  async delete(bookId: string): Promise<void> {
    await this.readPagesRepository.delete({ bookId });
  }

  private toDomain(ormEntity: ReadPagesOrmEntity): ReadPages {
    const readPagesArray = JSON.parse(ormEntity.readPages) as number[];
    return new ReadPages(
      ormEntity.id,
      BookId.fromString(ormEntity.bookId),
      readPagesArray,
      ormEntity.lastUpdated,
    );
  }

  private toOrm(domain: ReadPages): ReadPagesOrmEntity {
    const ormEntity = new ReadPagesOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.bookId = domain.bookId.value;
    ormEntity.readPages = JSON.stringify(domain.readPages);
    ormEntity.lastUpdated = domain.lastUpdated;
    return ormEntity;
  }
}