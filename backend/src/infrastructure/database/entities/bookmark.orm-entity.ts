import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('bookmarks')
@Index(['bookId', 'userId'])
@Index(['userId'])
export class BookmarkOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  bookId: string;

  @Column('uuid')
  userId: string;

  @Column('int')
  pageNumber: number;

  @Column('float')
  scrollPosition: number;

  @Column('varchar', { length: 255, nullable: true })
  title?: string;

  @Column('text', { nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
