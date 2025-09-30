import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

export interface UserProfileSettings {
  displayName?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  defaultZoom?: number;
  defaultFitToPage?: boolean;
  notificationsEnabled?: boolean;
  emailUpdates?: boolean;
  privacySettings?: {
    profileVisible?: boolean;
    readingStatsVisible?: boolean;
  };
  readingPreferences?: {
    fontSize?: 'small' | 'medium' | 'large';
    lineHeight?: number;
    pageTransition?: 'instant' | 'fade' | 'slide';
    autoBookmark?: boolean;
    rememberLastPage?: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  pictureUrl: string | null;
  settings: UserProfileSettings;
}

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading = false;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  showSettings = false;

  // Form backing fields
  displayName = '';
  theme: 'light' | 'dark' | 'system' = 'system';
  language = 'en';
  defaultZoom = 1.0;
  defaultFitToPage = true;
  notificationsEnabled = true;
  emailUpdates = false;
  profileVisible = true;
  readingStatsVisible = true;
  fontSize: 'small' | 'medium' | 'large' = 'medium';
  lineHeight = 1.5;
  pageTransition: 'instant' | 'fade' | 'slide' = 'instant';
  autoBookmark = true;
  rememberLastPage = true;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  async loadUserProfile(): Promise<void> {
    this.isLoading = true;
    try {
      const profile = await this.authService.getUserProfile();
      this.userProfile = profile;
      this.populateForm(profile.settings);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private populateForm(settings: UserProfileSettings): void {
    this.displayName = settings.displayName || '';
    this.theme = settings.theme || 'system';
    this.language = settings.language || 'en';
    this.defaultZoom = settings.defaultZoom || 1.0;
    this.defaultFitToPage = settings.defaultFitToPage !== undefined ? settings.defaultFitToPage : true;
    this.notificationsEnabled = settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true;
    this.emailUpdates = settings.emailUpdates !== undefined ? settings.emailUpdates : false;
    this.profileVisible = settings.privacySettings?.profileVisible !== undefined ? settings.privacySettings.profileVisible : true;
    this.readingStatsVisible = settings.privacySettings?.readingStatsVisible !== undefined ? settings.privacySettings.readingStatsVisible : true;
    this.fontSize = settings.readingPreferences?.fontSize || 'medium';
    this.lineHeight = settings.readingPreferences?.lineHeight || 1.5;
    this.pageTransition = settings.readingPreferences?.pageTransition || 'instant';
    this.autoBookmark = settings.readingPreferences?.autoBookmark !== undefined ? settings.readingPreferences.autoBookmark : true;
    this.rememberLastPage = settings.readingPreferences?.rememberLastPage !== undefined ? settings.readingPreferences.rememberLastPage : true;
  }

  openSettings(): void {
    this.showSettings = true;
  }

  closeSettings(): void {
    this.showSettings = false;
    this.saveStatus = 'idle';
  }

  async saveSettings(): Promise<void> {
    if (!this.userProfile) return;

    this.saveStatus = 'saving';
    try {
      const updatedSettings: UserProfileSettings = {
        displayName: this.displayName || undefined,
        theme: this.theme,
        language: this.language,
        defaultZoom: this.defaultZoom,
        defaultFitToPage: this.defaultFitToPage,
        notificationsEnabled: this.notificationsEnabled,
        emailUpdates: this.emailUpdates,
        privacySettings: {
          profileVisible: this.profileVisible,
          readingStatsVisible: this.readingStatsVisible,
        },
        readingPreferences: {
          fontSize: this.fontSize,
          lineHeight: this.lineHeight,
          pageTransition: this.pageTransition,
          autoBookmark: this.autoBookmark,
          rememberLastPage: this.rememberLastPage,
        },
      };

      await this.authService.updateUserSettings(updatedSettings);
      this.saveStatus = 'saved';
      
      // Apply theme immediately
      this.applyTheme(this.theme);
      
      setTimeout(() => {
        this.saveStatus = 'idle';
      }, 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.saveStatus = 'error';
      setTimeout(() => {
        this.saveStatus = 'idle';
      }, 3000);
    }
  }

  async resetToDefaults(): Promise<void> {
    if (!confirm('Are you sure you want to reset all settings to their default values?')) {
      return;
    }

    this.saveStatus = 'saving';
    try {
      const defaultSettings = await this.authService.resetUserSettings();
      this.populateForm(defaultSettings);
      this.saveStatus = 'saved';
      
      setTimeout(() => {
        this.saveStatus = 'idle';
      }, 2000);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.saveStatus = 'error';
      setTimeout(() => {
        this.saveStatus = 'idle';
      }, 3000);
    }
  }

  private applyTheme(theme: 'light' | 'dark' | 'system'): void {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    
    if (theme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      body.classList.add(`${theme}-theme`);
    }
  }

  onZoomChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.defaultZoom = parseFloat(target.value);
  }

  onLineHeightChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.lineHeight = parseFloat(target.value);
  }
}