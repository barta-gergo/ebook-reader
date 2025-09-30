import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BookOrmEntity } from './book.orm-entity';

@Entity('read_pages')
export class ReadPageOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  bookId: string;

  @Column()
  userId: string;

  @Column()
  pageNumber: number;

  @Column()
  markedAt: Date;

  @ManyToOne(() => BookOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: BookOrmEntity;
}