import { UserId } from '../value-objects';
import { UserProfileSettings } from '../value-objects/user-profile-settings.value-object';

export interface UserProfileSettingsRepository {
  /**
   * Find user profile settings by user ID
   */
  findByUserId(userId: UserId): Promise<UserProfileSettings | null>;

  /**
   * Save user profile settings
   */
  save(userId: UserId, settings: UserProfileSettings): Promise<UserProfileSettings>;

  /**
   * Check if user profile settings exist
   */
  exists(userId: UserId): Promise<boolean>;

  /**
   * Delete user profile settings
   */
  delete(userId: UserId): Promise<void>;
}