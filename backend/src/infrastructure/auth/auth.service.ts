import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserId, EmailAddress } from '../../domain/value-objects';
import { USER_REPOSITORY } from '../../domain/repositories/tokens';

export interface CreateUserFromGoogleDto {
  googleId: string;
  email: string;
  name: string;
  pictureUrl?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreateUser(dto: CreateUserFromGoogleDto): Promise<User> {
    // Try to find existing user by Google ID
    let user = await this.userRepository.findByGoogleId(dto.googleId);
    
    if (user) {
      // Update last login
      user = user.updateLastLogin();
      return await this.userRepository.save(user);
    }

    // Try to find by email (in case user exists but hasn't used Google OAuth before)
    const emailAddress = EmailAddress.create(dto.email);
    user = await this.userRepository.findByEmail(emailAddress);
    
    if (user) {
      // Update user with Google ID and login
      user = new User(
        user.id,
        dto.googleId,
        user.email,
        user.name,
        dto.pictureUrl || user.pictureUrl,
        user.createdAt,
        new Date(),
        new Date(),
        user.isActive,
      );
      return await this.userRepository.save(user);
    }

    // Create new user
    user = User.create(
      dto.googleId,
      dto.email,
      dto.name,
      dto.pictureUrl,
    );
    
    return await this.userRepository.save(user);
  }

  async validateUserById(userId: string): Promise<User | null> {
    const id = UserId.fromString(userId);
    return await this.userRepository.findById(id);
  }

  async login(user: User): Promise<LoginResponse> {
    const payload = {
      sub: user.id.value,
      email: user.email.value,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      user,
      accessToken,
    };
  }

  async validateGoogleUser(googleId: string): Promise<User | null> {
    return await this.userRepository.findByGoogleId(googleId);
  }

  async getUserById(userId: string): Promise<User | null> {
    const id = UserId.fromString(userId);
    return await this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const emailAddress = EmailAddress.create(email);
    return await this.userRepository.findByEmail(emailAddress);
  }

  async updateUserProfile(userId: string, name: string, pictureUrl?: string): Promise<User> {
    const id = UserId.fromString(userId);
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = user.updateProfile(name, pictureUrl);
    return await this.userRepository.save(updatedUser);
  }

  async deactivateUser(userId: string): Promise<User> {
    const id = UserId.fromString(userId);
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    const deactivatedUser = user.deactivate();
    return await this.userRepository.save(deactivatedUser);
  }
}