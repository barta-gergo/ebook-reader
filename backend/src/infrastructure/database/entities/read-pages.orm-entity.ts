import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('read_pages')
export class ReadPagesOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  bookId: string;

  @Column()
  userId: string;

  @Column('text')
  readPages: string; // JSON string of number array

  @UpdateDateColumn()
  lastUpdated: Date;
}