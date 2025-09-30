import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('users')
@Unique(['googleId'])
@Unique(['email'])
export class UserOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  googleId: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  pictureUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLogin: Date | null;

  @Column({ default: true })
  isActive: boolean;
}