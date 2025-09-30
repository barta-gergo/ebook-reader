import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_profile_settings')
export class UserProfileSettingsOrmEntity {
  @PrimaryColumn()
  userId: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ default: 'system' })
  theme: 'light' | 'dark' | 'system';

  @Column({ default: 'en' })
  language: string;

  @Column('float', { default: 1.0 })
  defaultZoom: number;

  @Column('boolean', { default: true })
  defaultFitToPage: boolean;

  @Column('boolean', { default: true })
  notificationsEnabled: boolean;

  @Column('boolean', { default: false })
  emailUpdates: boolean;

  @Column('boolean', { default: true })
  profileVisible: boolean;

  @Column('boolean', { default: true })
  readingStatsVisible: boolean;

  @Column({ default: 'medium' })
  fontSize: 'small' | 'medium' | 'large';

  @Column('float', { default: 1.5 })
  lineHeight: number;

  @Column({ default: 'instant' })
  pageTransition: 'instant' | 'fade' | 'slide';

  @Column('boolean', { default: true })
  autoBookmark: boolean;

  @Column('boolean', { default: true })
  rememberLastPage: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}