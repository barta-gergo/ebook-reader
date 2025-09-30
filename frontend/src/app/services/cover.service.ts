import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, map, of } from 'rxjs';
import { EnvironmentService } from './environment.service';
import { AuthService } from './auth.service';

export interface CoverUrlResponse {
  found: boolean;
  url: string;
  cached?: boolean;
}

export interface BulkFetchResult {
  message: string;
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

@Injectable({
  providedIn: 'root'
})
export class CoverService {
  private readonly apiUrl: string;
  private coverCache = new Map<string, string>();

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService,
    private authService: AuthService
  ) {
    this.apiUrl = this.envService.getApiBaseUrl();
  }

  /**
   * Get cover URL for a book with optional size
   * Returns placeholder if cover not found
   */
  getCoverUrl(bookId: string, size: 'thumbnail' | 'small' | 'medium' | 'large' = 'thumbnail'): Observable<string> {
    const cacheKey = `${bookId}-${size}`;

    // Check cache first
    if (this.coverCache.has(cacheKey)) {
      return of(this.coverCache.get(cacheKey)!);
    }

    const token = this.authService.getAuthToken();
    if (!token) {
      return of('/assets/placeholder-cover.svg');
    }

    // Use the direct image endpoint with auth token
    const imageUrl = `${this.apiUrl}/books/${bookId}/cover?size=${size}&token=${token}`;

    // Cache the URL
    this.coverCache.set(cacheKey, imageUrl);

    return of(imageUrl);
  }

  /**
   * Check if book has a cover
   */
  hasCover(bookId: string): Observable<boolean> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/covers/${bookId}/exists`)
      .pipe(
        map(response => response.exists),
        catchError(() => of(false))
      );
  }

  /**
   * Fetch missing covers for all books
   * This is a one-time bulk operation
   */
  fetchMissingCovers(): Observable<BulkFetchResult> {
    return this.http.post<BulkFetchResult>(`${this.apiUrl}/covers/fetch-missing`, {})
      .pipe(
        catchError(error => {
          console.error('Failed to fetch missing covers:', error);
          return of({
            message: 'Failed to fetch covers',
            total: 0,
            successful: 0,
            failed: 0,
            skipped: 0
          });
        })
      );
  }

  /**
   * Get cover statistics
   */
  getStatistics(): Observable<{
    totalCovers: number;
    cachedCovers: number;
    placeholders: number;
  }> {
    return this.http.get<{
      totalCovers: number;
      cachedCovers: number;
      placeholders: number;
    }>(`${this.apiUrl}/covers/stats`)
      .pipe(
        catchError(() => of({
          totalCovers: 0,
          cachedCovers: 0,
          placeholders: 0
        }))
      );
  }

  /**
   * Clear cover cache
   */
  clearCache(): void {
    this.coverCache.clear();
  }

  /**
   * Get placeholder URL
   */
  getPlaceholderUrl(): string {
    return '/assets/placeholder-cover.svg';
  }
}
