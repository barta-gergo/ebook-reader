export interface UserProfileSettingsData {
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

export class UserProfileSettings {
  private constructor(
    private readonly _displayName: string | null,
    private readonly _theme: 'light' | 'dark' | 'system',
    private readonly _language: string,
    private readonly _defaultZoom: number,
    private readonly _defaultFitToPage: boolean,
    private readonly _notificationsEnabled: boolean,
    private readonly _emailUpdates: boolean,
    private readonly _profileVisible: boolean,
    private readonly _readingStatsVisible: boolean,
    private readonly _fontSize: 'small' | 'medium' | 'large',
    private readonly _lineHeight: number,
    private readonly _pageTransition: 'instant' | 'fade' | 'slide',
    private readonly _autoBookmark: boolean,
    private readonly _rememberLastPage: boolean,
  ) {}

  public static create(data: UserProfileSettingsData = {}): UserProfileSettings {
    return new UserProfileSettings(
      data.displayName || null,
      data.theme || 'system',
      data.language || 'en',
      data.defaultZoom || 1.0,
      data.defaultFitToPage !== undefined ? data.defaultFitToPage : true,
      data.notificationsEnabled !== undefined ? data.notificationsEnabled : true,
      data.emailUpdates !== undefined ? data.emailUpdates : false,
      data.privacySettings?.profileVisible !== undefined ? data.privacySettings.profileVisible : true,
      data.privacySettings?.readingStatsVisible !== undefined ? data.privacySettings.readingStatsVisible : true,
      data.readingPreferences?.fontSize || 'medium',
      data.readingPreferences?.lineHeight || 1.5,
      data.readingPreferences?.pageTransition || 'instant',
      data.readingPreferences?.autoBookmark !== undefined ? data.readingPreferences.autoBookmark : true,
      data.readingPreferences?.rememberLastPage !== undefined ? data.readingPreferences.rememberLastPage : true,
    );
  }

  public static fromJson(json: string): UserProfileSettings {
    try {
      const data = JSON.parse(json) as UserProfileSettingsData;
      return UserProfileSettings.create(data);
    } catch (error) {
      // Return default settings if JSON is invalid
      return UserProfileSettings.create();
    }
  }

  public updateDisplayName(displayName: string): UserProfileSettings {
    return new UserProfileSettings(
      displayName,
      this._theme,
      this._language,
      this._defaultZoom,
      this._defaultFitToPage,
      this._notificationsEnabled,
      this._emailUpdates,
      this._profileVisible,
      this._readingStatsVisible,
      this._fontSize,
      this._lineHeight,
      this._pageTransition,
      this._autoBookmark,
      this._rememberLastPage,
    );
  }

  public updateTheme(theme: 'light' | 'dark' | 'system'): UserProfileSettings {
    return new UserProfileSettings(
      this._displayName,
      theme,
      this._language,
      this._defaultZoom,
      this._defaultFitToPage,
      this._notificationsEnabled,
      this._emailUpdates,
      this._profileVisible,
      this._readingStatsVisible,
      this._fontSize,
      this._lineHeight,
      this._pageTransition,
      this._autoBookmark,
      this._rememberLastPage,
    );
  }

  public updateReadingPreferences(preferences: {
    fontSize?: 'small' | 'medium' | 'large';
    lineHeight?: number;
    pageTransition?: 'instant' | 'fade' | 'slide';
    autoBookmark?: boolean;
    rememberLastPage?: boolean;
  }): UserProfileSettings {
    return new UserProfileSettings(
      this._displayName,
      this._theme,
      this._language,
      this._defaultZoom,
      this._defaultFitToPage,
      this._notificationsEnabled,
      this._emailUpdates,
      this._profileVisible,
      this._readingStatsVisible,
      preferences.fontSize || this._fontSize,
      preferences.lineHeight || this._lineHeight,
      preferences.pageTransition || this._pageTransition,
      preferences.autoBookmark !== undefined ? preferences.autoBookmark : this._autoBookmark,
      preferences.rememberLastPage !== undefined ? preferences.rememberLastPage : this._rememberLastPage,
    );
  }

  public updatePrivacySettings(privacy: {
    profileVisible?: boolean;
    readingStatsVisible?: boolean;
  }): UserProfileSettings {
    return new UserProfileSettings(
      this._displayName,
      this._theme,
      this._language,
      this._defaultZoom,
      this._defaultFitToPage,
      this._notificationsEnabled,
      this._emailUpdates,
      privacy.profileVisible !== undefined ? privacy.profileVisible : this._profileVisible,
      privacy.readingStatsVisible !== undefined ? privacy.readingStatsVisible : this._readingStatsVisible,
      this._fontSize,
      this._lineHeight,
      this._pageTransition,
      this._autoBookmark,
      this._rememberLastPage,
    );
  }

  // Getters
  public get displayName(): string | null { return this._displayName; }
  public get theme(): 'light' | 'dark' | 'system' { return this._theme; }
  public get language(): string { return this._language; }
  public get defaultZoom(): number { return this._defaultZoom; }
  public get defaultFitToPage(): boolean { return this._defaultFitToPage; }
  public get notificationsEnabled(): boolean { return this._notificationsEnabled; }
  public get emailUpdates(): boolean { return this._emailUpdates; }
  public get profileVisible(): boolean { return this._profileVisible; }
  public get readingStatsVisible(): boolean { return this._readingStatsVisible; }
  public get fontSize(): 'small' | 'medium' | 'large' { return this._fontSize; }
  public get lineHeight(): number { return this._lineHeight; }
  public get pageTransition(): 'instant' | 'fade' | 'slide' { return this._pageTransition; }
  public get autoBookmark(): boolean { return this._autoBookmark; }
  public get rememberLastPage(): boolean { return this._rememberLastPage; }

  public toJson(): string {
    const data: UserProfileSettingsData = {
      displayName: this._displayName || undefined,
      theme: this._theme,
      language: this._language,
      defaultZoom: this._defaultZoom,
      defaultFitToPage: this._defaultFitToPage,
      notificationsEnabled: this._notificationsEnabled,
      emailUpdates: this._emailUpdates,
      privacySettings: {
        profileVisible: this._profileVisible,
        readingStatsVisible: this._readingStatsVisible,
      },
      readingPreferences: {
        fontSize: this._fontSize,
        lineHeight: this._lineHeight,
        pageTransition: this._pageTransition,
        autoBookmark: this._autoBookmark,
        rememberLastPage: this._rememberLastPage,
      },
    };
    return JSON.stringify(data);
  }

  public toData(): UserProfileSettingsData {
    return JSON.parse(this.toJson());
  }
}