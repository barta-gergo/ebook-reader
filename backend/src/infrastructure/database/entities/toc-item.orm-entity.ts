import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BookOrmEntity } from './book.orm-entity';

@Entity('toc_items')
export class TocItemOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  bookId: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column()
  page: number;

  @Column()
  level: number;

  @Column({ nullable: true })
  parentId?: string;

  @Column({ nullable: true })
  order?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => BookOrmEntity, book => book.tocItems)
  @JoinColumn({ name: 'bookId' })
  book: BookOrmEntity;

  @ManyToOne(() => TocItemOrmEntity, tocItem => tocItem.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: TocItemOrmEntity;

  @OneToMany(() => TocItemOrmEntity, tocItem => tocItem.parent)
  children: TocItemOrmEntity[];
}