/**
 * Result from cover fetching attempt
 */
export interface CoverFetchResult {
  found: boolean;
  source: string;
  urls: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  metadata?: {
    originalUrl?: string;
    width?: number;
    height?: number;
    format?: string;
  };
}

/**
 * Interface for cover fetching services
 */
export interface CoverFetcherService {
  /**
   * Fetch cover for a book by title and author
   */
  fetchCover(title: string, author?: string): Promise<CoverFetchResult>;

  /**
   * Download and save cover image locally
   */
  downloadAndSave(url: string, bookId: string, size: string): Promise<string>;

  /**
   * Get service name
   */
  getServiceName(): string;
}
