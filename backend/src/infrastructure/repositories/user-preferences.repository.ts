import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferencesOrmEntity } from '../database/entities/user-preferences.orm-entity';
import { UserPreferences, UserPreferencesRepository } from '../../domain/repositories/user-preferences.repository';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserPreferencesRepositoryImpl implements UserPreferencesRepository {
  constructor(
    @InjectRepository(UserPreferencesOrmEntity)
    private readonly repository: Repository<UserPreferencesOrmEntity>,
  ) {}

  async findByBookId(bookId: string): Promise<UserPreferences | null> {
    const entity = await this.repository.findOne({ where: { bookId } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(preferences: Omit<UserPreferences, 'id' | 'lastUpdated'>): Promise<UserPreferences> {
    const entity = this.repository.create({
      id: uuidv4(),
      ...preferences,
    });
    
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(bookId: string, updates: Partial<Pick<UserPreferences, 'fitToPage' | 'zoom' | 'rotation'>>): Promise<UserPreferences> {
    let existing = await this.repository.findOne({ where: { bookId } });
    
    if (!existing) {
      // Create new preferences if none exist
      existing = this.repository.create({
        id: uuidv4(),
        bookId,
        fitToPage: true,
        zoom: 1.0,
        rotation: 0,
      });
    }

    Object.assign(existing, updates);
    const saved = await this.repository.save(existing);
    return this.toDomain(saved);
  }

  private toDomain(entity: UserPreferencesOrmEntity): UserPreferences {
    return {
      id: entity.id,
      bookId: entity.bookId,
      fitToPage: entity.fitToPage,
      zoom: entity.zoom,
      rotation: entity.rotation,
      lastUpdated: entity.lastUpdated,
    };
  }
}