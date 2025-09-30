import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TocItem } from '../../domain/entities/toc-item.entity';
import { TocItemRepository } from '../../domain/repositories/toc-item.repository.interface';
import { TocItemOrmEntity } from '../database/entities/toc-item.orm-entity';
import { BookId } from '../../domain/value-objects';

@Injectable()
export class TocItemRepositoryImpl implements TocItemRepository {
  constructor(
    @InjectRepository(TocItemOrmEntity)
    private readonly ormRepository: Repository<TocItemOrmEntity>
  ) {}

  async save(tocItem: TocItem): Promise<TocItem> {
    const ormEntity = this.toOrmEntity(tocItem);
    const saved = await this.ormRepository.save(ormEntity);
    return this.toDomainEntity(saved);
  }

  async findById(id: string): Promise<TocItem | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['children']
    });
    
    return ormEntity ? this.toDomainEntity(ormEntity) : null;
  }

  async findByBookId(bookId: BookId): Promise<TocItem[]> {
    const ormEntities = await this.ormRepository.find({
      where: { bookId: bookId.value },
      order: { level: 'ASC', order: 'ASC' },
      relations: ['children']
    });
    
    return ormEntities.map(entity => this.toDomainEntity(entity));
  }

  async findRootItemsByBookId(bookId: BookId): Promise<TocItem[]> {
    const ormEntities = await this.ormRepository.find({
      where: { bookId: bookId.value, parentId: null },
      order: { order: 'ASC' },
      relations: ['children']
    });
    
    return ormEntities.map(entity => this.toDomainEntity(entity));
  }

  async findChildrenByParentId(parentId: string): Promise<TocItem[]> {
    const ormEntities = await this.ormRepository.find({
      where: { parentId },
      order: { order: 'ASC' },
      relations: ['children']
    });
    
    return ormEntities.map(entity => this.toDomainEntity(entity));
  }

  async deleteByBookId(bookId: BookId): Promise<void> {
    await this.ormRepository.delete({ bookId: bookId.value });
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete({ id });
  }

  private toOrmEntity(domainEntity: TocItem): TocItemOrmEntity {
    const ormEntity = new TocItemOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.bookId = domainEntity.bookId.value;
    ormEntity.title = domainEntity.title;
    ormEntity.page = domainEntity.page;
    ormEntity.level = domainEntity.level;
    ormEntity.parentId = domainEntity.parentId;
    ormEntity.order = domainEntity.order;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }

  private toDomainEntity(ormEntity: TocItemOrmEntity): TocItem {
    return new TocItem(
      ormEntity.id,
      BookId.fromString(ormEntity.bookId),
      ormEntity.title,
      ormEntity.page,
      ormEntity.level,
      ormEntity.parentId,
      ormEntity.order,
      ormEntity.createdAt,
      ormEntity.updatedAt
    );
  }
}