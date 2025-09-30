import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileSettingsRepository } from '../../domain/repositories/user-profile-settings.repository.interface';
import { UserProfileSettings } from '../../domain/value-objects/user-profile-settings.value-object';
import { UserId } from '../../domain/value-objects';
import { UserProfileSettingsOrmEntity } from '../database/entities/user-profile-settings.orm-entity';

@Injectable()
export class UserProfileSettingsRepositoryImpl implements UserProfileSettingsRepository {
  constructor(
    @InjectRepository(UserProfileSettingsOrmEntity)
    private readonly settingsRepository: Repository<UserProfileSettingsOrmEntity>,
  ) {}

  async findByUserId(userId: UserId): Promise<UserProfileSettings | null> {
    const ormEntity = await this.settingsRepository.findOne({
      where: { userId: userId.value }
    });

    if (!ormEntity) {
      return null;
    }

    return this.toDomain(ormEntity);
  }

  async save(userId: UserId, settings: UserProfileSettings): Promise<UserProfileSettings> {
    const ormEntity = this.toOrm(userId, settings);
    const savedEntity = await this.settingsRepository.save(ormEntity);
    return this.toDomain(savedEntity);
  }

  async exists(userId: UserId): Promise<boolean> {
    const count = await this.settingsRepository.count({
      where: { userId: userId.value }
    });
    return count > 0;
  }

  async delete(userId: UserId): Promise<void> {
    await this.settingsRepository.delete({ userId: userId.value });
  }

  private toDomain(ormEntity: UserProfileSettingsOrmEntity): UserProfileSettings {
    return UserProfileSettings.create({
      displayName: ormEntity.displayName,
      theme: ormEntity.theme,
      language: ormEntity.language,
      defaultZoom: ormEntity.defaultZoom,
      defaultFitToPage: ormEntity.defaultFitToPage,
      notificationsEnabled: ormEntity.notificationsEnabled,
      emailUpdates: ormEntity.emailUpdates,
      privacySettings: {
        profileVisible: ormEntity.profileVisible,
        readingStatsVisible: ormEntity.readingStatsVisible,
      },
      readingPreferences: {
        fontSize: ormEntity.fontSize,
        lineHeight: ormEntity.lineHeight,
        pageTransition: ormEntity.pageTransition,
        autoBookmark: ormEntity.autoBookmark,
        rememberLastPage: ormEntity.rememberLastPage,
      },
    });
  }

  private toOrm(userId: UserId, settings: UserProfileSettings): UserProfileSettingsOrmEntity {
    const entity = new UserProfileSettingsOrmEntity();
    entity.userId = userId.value;
    entity.displayName = settings.displayName || undefined;
    entity.theme = settings.theme;
    entity.language = settings.language;
    entity.defaultZoom = settings.defaultZoom;
    entity.defaultFitToPage = settings.defaultFitToPage;
    entity.notificationsEnabled = settings.notificationsEnabled;
    entity.emailUpdates = settings.emailUpdates;
    entity.profileVisible = settings.profileVisible;
    entity.readingStatsVisible = settings.readingStatsVisible;
    entity.fontSize = settings.fontSize;
    entity.lineHeight = settings.lineHeight;
    entity.pageTransition = settings.pageTransition;
    entity.autoBookmark = settings.autoBookmark;
    entity.rememberLastPage = settings.rememberLastPage;
    return entity;
  }
}