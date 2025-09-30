import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../database/entities/user.orm-entity';
import { UserId, EmailAddress } from '../../domain/value-objects';

@Injectable()
export class UserRepositoryImpl implements UserRepositoryInterface {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const ormEntity = await this.userRepository.findOne({ where: { id: id.value } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByEmail(email: EmailAddress): Promise<User | null> {
    const ormEntity = await this.userRepository.findOne({ where: { email: email.value } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const ormEntity = await this.userRepository.findOne({ where: { googleId } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async save(user: User): Promise<User> {
    const ormEntity = this.toOrm(user);
    const savedEntity = await this.userRepository.save(ormEntity);
    return this.toDomain(savedEntity);
  }

  async delete(id: UserId): Promise<void> {
    await this.userRepository.delete(id.value);
  }

  async findAll(): Promise<User[]> {
    const ormEntities = await this.userRepository.find();
    return ormEntities.map(entity => this.toDomain(entity));
  }

  async existsByEmail(email: EmailAddress): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email: email.value } });
    return count > 0;
  }

  async existsByGoogleId(googleId: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { googleId } });
    return count > 0;
  }

  private toDomain(ormEntity: UserOrmEntity): User {
    return new User(
      UserId.fromString(ormEntity.id),
      ormEntity.googleId,
      EmailAddress.create(ormEntity.email),
      ormEntity.name,
      ormEntity.pictureUrl,
      ormEntity.createdAt,
      ormEntity.updatedAt,
      ormEntity.lastLogin,
      ormEntity.isActive,
    );
  }

  private toOrm(domain: User): UserOrmEntity {
    const ormEntity = new UserOrmEntity();
    ormEntity.id = domain.id.value;
    ormEntity.googleId = domain.googleId;
    ormEntity.email = domain.email.value;
    ormEntity.name = domain.name;
    ormEntity.pictureUrl = domain.pictureUrl;
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;
    ormEntity.lastLogin = domain.lastLogin;
    ormEntity.isActive = domain.isActive;
    return ormEntity;
  }
}