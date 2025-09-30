import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CoverFetchResult, CoverFetcherService } from '../../domain/services/cover-fetcher.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OpenLibraryCoverService implements CoverFetcherService {
  private readonly logger = new Logger(OpenLibraryCoverService.name);
  private readonly searchUrl = 'https://openlibrary.org/search.json';
  private readonly coverBaseUrl = 'https://covers.openlibrary.org/b';
  private readonly coverDir = './uploads/covers';

  constructor(private readonly httpService: HttpService) {}

  getServiceName(): string {
    return 'open-library';
  }

  async fetchCover(title: string, author?: string): Promise<CoverFetchResult> {
    try {
      // Build query
      let query = `title=${encodeURIComponent(title)}`;
      if (author && author !== 'Unknown Author' && author !== 'Unknown') {
        query += `&author=${encodeURIComponent(author)}`;
      }

      const url = `${this.searchUrl}?${query}&limit=1`;
      this.logger.log(`Fetching cover from Open Library: ${title} by ${author || 'N/A'}`);

      const response = await firstValueFrom(
        this.httpService.get<any>(url, { timeout: 5000 })
      );

      if (!response?.data?.docs || response.data.docs.length === 0) {
        this.logger.log(`No results found for: ${title} by ${author}`);
        return { found: false, source: 'open-library', urls: {} };
      }

      const book = response.data.docs[0];
      const coverId = book.cover_i || book.cover_edition_key;

      if (!coverId) {
        this.logger.log(`No cover ID for: ${title}`);
        return { found: false, source: 'open-library', urls: {} };
      }

      // Build cover URLs (S=small, M=medium, L=large)
      const idType = typeof coverId === 'number' ? 'id' : 'olid';
      const baseUrl = `${this.coverBaseUrl}/${idType}/${coverId}`;

      this.logger.log(`✅ Cover found via Open Library for: ${title}`);

      return {
        found: true,
        source: 'open-library',
        urls: {
          thumbnail: `${baseUrl}-S.jpg`,
          small: `${baseUrl}-M.jpg`,
          medium: `${baseUrl}-L.jpg`,
          large: `${baseUrl}-L.jpg`,
        },
        metadata: {
          originalUrl: `${baseUrl}-M.jpg`,
          format: 'jpeg',
        },
      };
    } catch (error) {
      this.logger.error(`Open Library API error: ${error.message}`);
      return { found: false, source: 'open-library', urls: {} };
    }
  }

  /**
   * Fetch cover by ISBN (alternative method)
   */
  async fetchCoverByISBN(isbn: string): Promise<CoverFetchResult> {
    try {
      const url = `${this.searchUrl}?isbn=${isbn}&limit=1`;
      this.logger.log(`Fetching cover from Open Library by ISBN: ${isbn}`);

      const response = await firstValueFrom(
        this.httpService.get<any>(url, { timeout: 5000 })
      );

      if (!response?.data?.docs || response.data.docs.length === 0) {
        this.logger.log(`No results found for ISBN: ${isbn}`);
        return { found: false, source: 'open-library', urls: {} };
      }

      const book = response.data.docs[0];
      const coverId = book.cover_i;

      if (!coverId) {
        this.logger.log(`No cover for ISBN: ${isbn}`);
        return { found: false, source: 'open-library', urls: {} };
      }

      const baseUrl = `${this.coverBaseUrl}/id/${coverId}`;

      this.logger.log(`✅ Cover found via Open Library ISBN lookup`);

      return {
        found: true,
        source: 'open-library',
        urls: {
          thumbnail: `${baseUrl}-S.jpg`,
          small: `${baseUrl}-M.jpg`,
          medium: `${baseUrl}-L.jpg`,
          large: `${baseUrl}-L.jpg`,
        },
      };
    } catch (error) {
      this.logger.error(`Open Library ISBN lookup error: ${error.message}`);
      return { found: false, source: 'open-library', urls: {} };
    }
  }

  async downloadAndSave(url: string, bookId: string, size: string): Promise<string> {
    try {
      this.logger.log(`Downloading cover from: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer',
          timeout: 10000
        })
      );

      const buffer = Buffer.from(response.data as any);
      const filename = `cover-${bookId}-${size}.jpg`;
      const filepath = path.join(this.coverDir, filename);

      // Ensure directory exists
      await fs.promises.mkdir(this.coverDir, { recursive: true });

      // Save file
      await fs.promises.writeFile(filepath, buffer);

      this.logger.log(`✅ Cover saved: ${filepath}`);
      return filepath;
    } catch (error) {
      this.logger.error(`Failed to download cover: ${error.message}`);
      throw error;
    }
  }
}
