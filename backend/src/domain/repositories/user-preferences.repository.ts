export interface UserPreferences {
  id: string;
  bookId: string;
  fitToPage: boolean;
  zoom: number;
  rotation: number;
  lastUpdated: Date;
}

export interface UserPreferencesRepository {
  findByBookId(bookId: string): Promise<UserPreferences | null>;
  save(preferences: Omit<UserPreferences, 'id' | 'lastUpdated'>): Promise<UserPreferences>;
  update(bookId: string, updates: Partial<Pick<UserPreferences, 'fitToPage' | 'zoom' | 'rotation'>>): Promise<UserPreferences>;
}