import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { UserProfileSettingsRepository } from '../../domain/repositories/user-profile-settings.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserProfileSettings, UserProfileSettingsData } from '../../domain/value-objects/user-profile-settings.value-object';
import { UserId } from '../../domain/value-objects';
import { USER_REPOSITORY, USER_PROFILE_SETTINGS_REPOSITORY } from '../../domain/repositories/tokens';

export interface UserProfileResponse {
  id: string;
  googleId: string;
  email: string;
  name: string;
  pictureUrl: string | null;
  createdAt: Date;
  lastLogin: Date | null;
  settings: UserProfileSettingsData;
}

export interface UpdateUserProfileRequest {
  name?: string;
  settings?: UserProfileSettingsData;
}

@Injectable()
export class UserProfileApplicationService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    @Inject(USER_PROFILE_SETTINGS_REPOSITORY)
    private readonly settingsRepository: UserProfileSettingsRepository,
  ) {}

  /**
   * Get user profile with settings
   */
  async getUserProfile(userId: UserId): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId.value} not found`);
    }

    // Get user settings or create default ones
    let settings = await this.settingsRepository.findByUserId(userId);
    if (!settings) {
      settings = UserProfileSettings.create();
      await this.settingsRepository.save(userId, settings);
    }

    return {
      id: user.id.value,
      googleId: user.googleId,
      email: user.email.value,
      name: user.name,
      pictureUrl: user.pictureUrl,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      settings: settings.toData(),
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: UserId, updateRequest: UpdateUserProfileRequest): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId.value} not found`);
    }

    // Update user basic info if provided
    let updatedUser = user;
    if (updateRequest.name) {
      updatedUser = user.updateProfile(updateRequest.name);
      await this.userRepository.save(updatedUser);
    }

    // Update settings if provided
    let settings = await this.settingsRepository.findByUserId(userId);
    if (!settings) {
      settings = UserProfileSettings.create();
    }

    if (updateRequest.settings) {
      settings = UserProfileSettings.create(updateRequest.settings);
      await this.settingsRepository.save(userId, settings);
    }

    return {
      id: updatedUser.id.value,
      googleId: updatedUser.googleId,
      email: updatedUser.email.value,
      name: updatedUser.name,
      pictureUrl: updatedUser.pictureUrl,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin,
      settings: settings.toData(),
    };
  }

  /**
   * Update user settings only
   */
  async updateUserSettings(userId: UserId, settingsData: UserProfileSettingsData): Promise<UserProfileSettingsData> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId.value} not found`);
    }

    let settings = await this.settingsRepository.findByUserId(userId);
    if (!settings) {
      settings = UserProfileSettings.create();
    }

    const updatedSettings = UserProfileSettings.create(settingsData);
    await this.settingsRepository.save(userId, updatedSettings);

    return updatedSettings.toData();
  }

  /**
   * Get user settings only
   */
  async getUserSettings(userId: UserId): Promise<UserProfileSettingsData> {
    let settings = await this.settingsRepository.findByUserId(userId);
    if (!settings) {
      settings = UserProfileSettings.create();
      await this.settingsRepository.save(userId, settings);
    }

    return settings.toData();
  }

  /**
   * Reset user settings to defaults
   */
  async resetUserSettings(userId: UserId): Promise<UserProfileSettingsData> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId.value} not found`);
    }

    const defaultSettings = UserProfileSettings.create();
    await this.settingsRepository.save(userId, defaultSettings);

    return defaultSettings.toData();
  }

  /**
   * Delete user profile and all associated data
   */
  async deleteUserProfile(userId: UserId): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId.value} not found`);
    }

    // Delete settings first
    await this.settingsRepository.delete(userId);
    
    // Deactivate user (don't actually delete for data integrity)
    const deactivatedUser = user.deactivate();
    await this.userRepository.save(deactivatedUser);
  }
}