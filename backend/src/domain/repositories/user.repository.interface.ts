import { User } from '../entities/user.entity';
import { UserId, EmailAddress } from '../value-objects';

export interface UserRepositoryInterface {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: EmailAddress): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: UserId): Promise<void>;
  findAll(): Promise<User[]>;
  existsByEmail(email: EmailAddress): Promise<boolean>;
  existsByGoogleId(googleId: string): Promise<boolean>;
}