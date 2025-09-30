import { Entity, PrimaryColumn, Column, UpdateDateColumn, OneToOne, JoinColumn, Unique } from 'typeorm';
import { BookOrmEntity } from './book.orm-entity';

@Entity('reading_progress')
@Unique(['bookId'])
export class ReadingProgressOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  bookId: string;

  @Column()
  userId: string;

  @Column()
  currentPage: number;

  @Column()
  scrollPosition: number;

  @Column('decimal', { precision: 5, scale: 2 })
  progressPercentage: number;

  @UpdateDateColumn()
  lastUpdated: Date;

  @Column({ default: 0 })
  readingTimeMinutes: number;

  @OneToOne(() => BookOrmEntity, book => book.readingProgress)
  @JoinColumn({ name: 'bookId', referencedColumnName: 'id' })
  book: BookOrmEntity;
}