import { Injectable, Logger } from '@nestjs/common';
import { CoverFetchResult } from '../../domain/services/cover-fetcher.interface';
import { GoogleBooksCoverService } from './google-books-cover.service';
import { OpenLibraryCoverService } from './open-library-cover.service';

/**
 * Orchestrates cover fetching from multiple sources
 * Tries each source in priority order until a cover is found
 */
@Injectable()
export class CoverFetcherOrchestratorService {
  private readonly logger = new Logger(CoverFetcherOrchestratorService.name);

  constructor(
    private readonly googleBooksService: GoogleBooksCoverService,
    private readonly openLibraryService: OpenLibraryCoverService,
    // PDF extractor would go here when implemented
  ) {}

  /**
   * Fetch cover from all available sources in priority order
   */
  async fetchCover(
    title: string,
    author?: string,
    isbn?: string,
    pdfPath?: string
  ): Promise<CoverFetchResult> {
    this.logger.log(`🔍 Fetching cover for: "${title}" by ${author || 'Unknown'}`);

    // Priority 1: Try Google Books API
    this.logger.log('📚 Trying Google Books API...');
    const googleResult = await this.googleBooksService.fetchCover(title, author);
    if (googleResult.found) {
      this.logger.log('✅ Cover found via Google Books');
      return googleResult;
    }

    // Priority 2: Try Open Library API
    this.logger.log('📖 Trying Open Library API...');
    const openLibResult = await this.openLibraryService.fetchCover(title, author);
    if (openLibResult.found) {
      this.logger.log('✅ Cover found via Open Library');
      return openLibResult;
    }

    // Priority 3: Try ISBN lookup if available
    if (isbn) {
      this.logger.log(`🔢 Trying ISBN lookup: ${isbn}...`);
      const isbnResult = await this.openLibraryService.fetchCoverByISBN(isbn);
      if (isbnResult.found) {
        this.logger.log('✅ Cover found via ISBN lookup');
        return isbnResult;
      }
    }

    // Priority 4: PDF first page extraction (not implemented yet)
    // if (pdfPath) {
    //   this.logger.log('📄 Trying PDF first page extraction...');
    //   const pdfResult = await this.pdfExtractorService.extractCover(pdfPath);
    //   if (pdfResult.found) {
    //     this.logger.log('✅ Cover extracted from PDF');
    //     return pdfResult;
    //   }
    // }

    // Priority 5: Return placeholder
    this.logger.warn(`⚠️ No cover found for: "${title}" - using placeholder`);
    return {
      found: false,
      source: 'placeholder',
      urls: {
        thumbnail: '/assets/placeholder-cover.jpg',
      },
    };
  }

  /**
   * Download and cache cover from URL
   */
  async downloadAndCache(
    result: CoverFetchResult,
    bookId: string
  ): Promise<{
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  }> {
    if (!result.found || !result.urls) {
      return {};
    }

    const localPaths: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    } = {};

    try {
      // Determine which service to use for downloading
      const service =
        result.source === 'google-books'
          ? this.googleBooksService
          : result.source === 'open-library'
          ? this.openLibraryService
          : null;

      if (!service) {
        this.logger.warn(`No download service for source: ${result.source}`);
        return localPaths;
      }

      // Download each size if available
      if (result.urls.thumbnail) {
        try {
          localPaths.thumbnail = await service.downloadAndSave(
            result.urls.thumbnail,
            bookId,
            'thumbnail'
          );
        } catch (error) {
          this.logger.error(`Failed to download thumbnail: ${error.message}`);
        }
      }

      if (result.urls.small) {
        try {
          localPaths.small = await service.downloadAndSave(
            result.urls.small,
            bookId,
            'small'
          );
        } catch (error) {
          this.logger.error(`Failed to download small: ${error.message}`);
        }
      }

      if (result.urls.medium) {
        try {
          localPaths.medium = await service.downloadAndSave(
            result.urls.medium,
            bookId,
            'medium'
          );
        } catch (error) {
          this.logger.error(`Failed to download medium: ${error.message}`);
        }
      }

      if (result.urls.large) {
        try {
          localPaths.large = await service.downloadAndSave(
            result.urls.large,
            bookId,
            'large'
          );
        } catch (error) {
          this.logger.error(`Failed to download large: ${error.message}`);
        }
      }

      this.logger.log(`📥 Downloaded ${Object.keys(localPaths).length} cover sizes for book: ${bookId}`);
    } catch (error) {
      this.logger.error(`Error downloading covers: ${error.message}`);
    }

    return localPaths;
  }
}
