import { Injectable, Inject } from '@nestjs/common';
import { UserPreferencesRepository } from '../../../domain/repositories/user-preferences.repository';
import { USER_PREFERENCES_REPOSITORY } from '../../../domain/repositories/tokens';

export interface UserPreferencesDto {
  bookId: string;
  fitToPage: boolean;
  zoom: number;
  rotation: number;
}

export interface UpdateUserPreferencesDto {
  fitToPage?: boolean;
  zoom?: number;
  rotation?: number;
}

@Injectable()
export class ManageUserPreferencesCommand {
  constructor(
    @Inject(USER_PREFERENCES_REPOSITORY)
    private readonly userPreferencesRepository: UserPreferencesRepository
  ) {}

  async getUserPreferences(bookId: string): Promise<UserPreferencesDto> {
    const preferences = await this.userPreferencesRepository.findByBookId(bookId);
    return {
      bookId,
      fitToPage: preferences?.fitToPage ?? true,
      zoom: preferences?.zoom ?? 1.0,
      rotation: preferences?.rotation ?? 0,
    };
  }

  async updateUserPreferences(
    bookId: string, 
    updates: UpdateUserPreferencesDto
  ): Promise<UserPreferencesDto> {
    const preferences = await this.userPreferencesRepository.update(bookId, updates);
    return {
      bookId,
      fitToPage: preferences.fitToPage,
      zoom: preferences.zoom,
      rotation: preferences.rotation,
    };
  }
}