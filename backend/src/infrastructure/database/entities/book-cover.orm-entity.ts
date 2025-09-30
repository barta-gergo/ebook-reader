import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BookOrmEntity } from './book.orm-entity';

@Entity('book_covers')
export class BookCoverOrmEntity {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Column('varchar', { length: 255, name: 'book_id' })
  bookId: string;

  @ManyToOne(() => BookOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: BookOrmEntity;

  @Column('varchar', { length: 50 })
  source: string; // 'google-books' | 'open-library' | 'isbndb' | 'pdf-extract' | 'manual' | 'placeholder'

  @Column('varchar', { length: 500, nullable: true, name: 'thumbnail_url' })
  thumbnailUrl?: string;

  @Column('varchar', { length: 500, nullable: true, name: 'small_url' })
  smallUrl?: string;

  @Column('varchar', { length: 500, nullable: true, name: 'medium_url' })
  mediumUrl?: string;

  @Column('varchar', { length: 500, nullable: true, name: 'large_url' })
  largeUrl?: string;

  @Column('varchar', { length: 500, nullable: true, name: 'local_thumbnail_path' })
  localThumbnailPath?: string;

  @Column('varchar', { length: 500, nullable: true, name: 'local_small_path' })
  localSmallPath?: string;

  @Column('varchar', { length: 500, nullable: true, name: 'local_medium_path' })
  localMediumPath?: string;

  @Column('varchar', { length: 500, nullable: true, name: 'local_large_path' })
  localLargePath?: string;

  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt: Date;

  @Column('boolean', { name: 'is_cached', default: false })
  isCached: boolean;

  @Column('simple-json', { nullable: true })
  metadata?: {
    originalUrl?: string;
    width?: number;
    height?: number;
    format?: string;
  };
}
