import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookmarkRepository } from '../../domain/repositories/bookmark.repository.interface';
import { Bookmark } from '../../domain/entities/bookmark.entity';
import { BookmarkOrmEntity } from '../database/entities/bookmark.orm-entity';
import { BookId, UserId } from '../../domain/value-objects';

@Injectable()
export class BookmarkRepositoryImpl implements BookmarkRepository {
  constructor(
    @InjectRepository(BookmarkOrmEntity)
    private readonly repository: Repository<BookmarkOrmEntity>,
  ) {}

  async save(bookmark: Bookmark): Promise<Bookmark> {
    const ormEntity: BookmarkOrmEntity = {
      id: bookmark.id,
      bookId: bookmark.bookId.value,
      userId: bookmark.userId.value,
      pageNumber: bookmark.pageNumber,
      scrollPosition: bookmark.scrollPosition,
      title: bookmark.title,
      note: bookmark.note,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
    };

    const saved = await this.repository.save(ormEntity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Bookmark | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByBookId(bookId: BookId): Promise<Bookmark[]> {
    const entities = await this.repository.find({
      where: { bookId: bookId.value },
      order: { pageNumber: 'ASC', createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByUserId(userId: UserId): Promise<Bookmark[]> {
    const entities = await this.repository.find({
      where: { userId: userId.value },
      order: { createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByBookIdAndUserId(bookId: BookId, userId: UserId): Promise<Bookmark[]> {
    const entities = await this.repository.find({
      where: {
        bookId: bookId.value,
        userId: userId.value
      },
      order: { pageNumber: 'ASC', createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteAllByBookId(bookId: BookId): Promise<void> {
    await this.repository.delete({ bookId: bookId.value });
  }

  async deleteAllByUserId(userId: UserId): Promise<void> {
    await this.repository.delete({ userId: userId.value });
  }

  private toDomain(entity: BookmarkOrmEntity): Bookmark {
    return Bookmark.reconstitute({
      id: entity.id,
      bookId: BookId.create(entity.bookId),
      userId: UserId.create(entity.userId),
      pageNumber: entity.pageNumber,
      scrollPosition: entity.scrollPosition,
      title: entity.title,
      note: entity.note,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
