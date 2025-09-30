import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { ReadingProgressOrmEntity } from './reading-progress.orm-entity';
import { TocItemOrmEntity } from './toc-item.orm-entity';

@Entity('books')
export class BookOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  filePath: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column()
  totalPages: number;

  @Column({ nullable: true })
  subject?: string;

  @Column({ nullable: true })
  keywords?: string;

  @Column({ nullable: true })
  creator?: string;

  @Column({ nullable: true })
  producer?: string;

  @Column({ type: 'datetime', nullable: true })
  creationDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  modificationDate?: Date;

  @Column({ nullable: true })
  version?: string;

  @Column({ default: 0 })
  textLength: number;

  @Column({ type: 'text', nullable: true })
  searchableText?: string;

  @Column({ nullable: true })
  coverId?: string;

  @CreateDateColumn()
  addedAt: Date;

  @UpdateDateColumn()
  lastOpened?: Date;

  @OneToOne(() => ReadingProgressOrmEntity, progress => progress.book, { nullable: true, cascade: true })
  readingProgress?: ReadingProgressOrmEntity;

  @OneToMany(() => TocItemOrmEntity, tocItem => tocItem.book)
  tocItems: TocItemOrmEntity[];
}