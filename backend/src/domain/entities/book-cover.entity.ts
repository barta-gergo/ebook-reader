import { BookId } from '../value-objects';

export type CoverSource = 'google-books' | 'open-library' | 'isbndb' | 'pdf-extract' | 'manual' | 'placeholder';

export interface CoverUrls {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
}

export interface CoverMetadata {
  originalUrl?: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Domain Entity: BookCover
 * Represents cover image information for a book
 */
export class BookCover {
  private readonly _id: string;
  private readonly _bookId: BookId;
  private readonly _source: CoverSource;
  private readonly _thumbnailUrl?: string;
  private readonly _smallUrl?: string;
  private readonly _mediumUrl?: string;
  private readonly _largeUrl?: string;
  private readonly _localThumbnailPath?: string;
  private readonly _localSmallPath?: string;
  private readonly _localMediumPath?: string;
  private readonly _localLargePath?: string;
  private readonly _fetchedAt: Date;
  private readonly _isCached: boolean;
  private readonly _metadata?: CoverMetadata;

  private constructor(
    id: string,
    bookId: BookId,
    source: CoverSource,
    urls: CoverUrls,
    localPaths: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    },
    fetchedAt: Date,
    isCached: boolean,
    metadata?: CoverMetadata
  ) {
    this._id = id;
    this._bookId = bookId;
    this._source = source;
    this._thumbnailUrl = urls.thumbnail;
    this._smallUrl = urls.small;
    this._mediumUrl = urls.medium;
    this._largeUrl = urls.large;
    this._localThumbnailPath = localPaths.thumbnail;
    this._localSmallPath = localPaths.small;
    this._localMediumPath = localPaths.medium;
    this._localLargePath = localPaths.large;
    this._fetchedAt = fetchedAt;
    this._isCached = isCached;
    this._metadata = metadata;
  }

  /**
   * Factory method to create a new BookCover
   */
  static create(
    bookId: BookId,
    source: CoverSource,
    urls: CoverUrls,
    localPaths: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    } = {},
    metadata?: CoverMetadata
  ): BookCover {
    const id = this.generateId();
    const fetchedAt = new Date();
    const isCached = !!(localPaths.thumbnail || localPaths.small || localPaths.medium || localPaths.large);

    return new BookCover(
      id,
      bookId,
      source,
      urls,
      localPaths,
      fetchedAt,
      isCached,
      metadata
    );
  }

  /**
   * Reconstitute BookCover from persistence
   */
  static reconstitute(
    id: string,
    bookId: BookId,
    source: CoverSource,
    urls: CoverUrls,
    localPaths: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    },
    fetchedAt: Date,
    isCached: boolean,
    metadata?: CoverMetadata
  ): BookCover {
    return new BookCover(
      id,
      bookId,
      source,
      urls,
      localPaths,
      fetchedAt,
      isCached,
      metadata
    );
  }

  private static generateId(): string {
    return `cover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get bookId(): BookId {
    return this._bookId;
  }

  get source(): CoverSource {
    return this._source;
  }

  get thumbnailUrl(): string | undefined {
    return this._thumbnailUrl;
  }

  get smallUrl(): string | undefined {
    return this._smallUrl;
  }

  get mediumUrl(): string | undefined {
    return this._mediumUrl;
  }

  get largeUrl(): string | undefined {
    return this._largeUrl;
  }

  get localThumbnailPath(): string | undefined {
    return this._localThumbnailPath;
  }

  get localSmallPath(): string | undefined {
    return this._localSmallPath;
  }

  get localMediumPath(): string | undefined {
    return this._localMediumPath;
  }

  get localLargePath(): string | undefined {
    return this._localLargePath;
  }

  get fetchedAt(): Date {
    return this._fetchedAt;
  }

  get isCached(): boolean {
    return this._isCached;
  }

  get metadata(): CoverMetadata | undefined {
    return this._metadata;
  }

  /**
   * Get the best available URL for a given size
   */
  getBestUrlForSize(size: 'thumbnail' | 'small' | 'medium' | 'large'): string | undefined {
    // Prefer local paths over remote URLs
    switch (size) {
      case 'thumbnail':
        return this._localThumbnailPath || this._thumbnailUrl || this._smallUrl || this._mediumUrl;
      case 'small':
        return this._localSmallPath || this._smallUrl || this._thumbnailUrl || this._mediumUrl;
      case 'medium':
        return this._localMediumPath || this._mediumUrl || this._largeUrl || this._smallUrl;
      case 'large':
        return this._localLargePath || this._largeUrl || this._mediumUrl || this._smallUrl;
      default:
        return this._thumbnailUrl;
    }
  }

  /**
   * Check if cover needs refresh (older than X days)
   */
  needsRefresh(maxAgeDays: number = 90): boolean {
    const now = new Date();
    const ageInDays = (now.getTime() - this._fetchedAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays > maxAgeDays;
  }

  /**
   * Check if this is a placeholder cover
   */
  isPlaceholder(): boolean {
    return this._source === 'placeholder';
  }
}
