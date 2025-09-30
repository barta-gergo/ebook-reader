import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('user_preferences')
export class UserPreferencesOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  bookId: string;

  @Column('boolean', { default: true })
  fitToPage: boolean;

  @Column('float', { default: 1.0 })
  zoom: number;

  @Column('int', { default: 0 })
  rotation: number;

  @UpdateDateColumn()
  lastUpdated: Date;
}