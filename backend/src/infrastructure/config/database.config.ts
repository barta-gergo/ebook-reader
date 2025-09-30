import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BookOrmEntity } from '../database/entities/book.orm-entity';
import { ReadingProgressOrmEntity } from '../database/entities/reading-progress.orm-entity';
import { ReadPageOrmEntity } from '../database/entities/read-page.orm-entity';
import { ReadPagesOrmEntity } from '../database/entities/read-pages.orm-entity';
import { UserPreferencesOrmEntity } from '../database/entities/user-preferences.orm-entity';
import { UserProfileSettingsOrmEntity } from '../database/entities/user-profile-settings.orm-entity';
import { TocItemOrmEntity } from '../database/entities/toc-item.orm-entity';
import { UserOrmEntity } from '../database/entities/user.orm-entity';
import { BookmarkOrmEntity } from '../database/entities/bookmark.orm-entity';
import { BookCoverOrmEntity } from '../database/entities/book-cover.orm-entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'ebook-reader.db',
  entities: [BookOrmEntity, ReadingProgressOrmEntity, ReadPageOrmEntity, ReadPagesOrmEntity, UserPreferencesOrmEntity, UserProfileSettingsOrmEntity, TocItemOrmEntity, UserOrmEntity, BookmarkOrmEntity, BookCoverOrmEntity],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
};