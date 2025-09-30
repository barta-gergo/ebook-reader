import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CoverFetchResult, CoverFetcherService } from '../../domain/services/cover-fetcher.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleBooksCoverService implements CoverFetcherService {
  private readonly logger = new Logger(GoogleBooksCoverService.name);
  private readonly baseUrl = 'https://www.googleapis.com/books/v1/volumes';
  private readonly coverDir = './uploads/covers';

  constructor(private readonly httpService: HttpService) {}

  getServiceName(): string {
    return 'google-books';
  }

  async fetchCover(title: string, author?: string): Promise<CoverFetchResult> {
    try {
      // Build query
      let query = `intitle:${encodeURIComponent(title)}`;
      if (author && author !== 'Unknown Author' && author !== 'Unknown') {
        query += `+inauthor:${encodeURIComponent(author)}`;
      }

      const url = `${this.baseUrl}?q=${query}&maxResults=1`;
      this.logger.log(`Fetching cover from Google Books: ${title} by ${author || 'N/A'}`);

      const response = await firstValueFrom(
        this.httpService.get<any>(url, { timeout: 5000 })
      );

      if (!response?.data?.items || response.data.items.length === 0) {
        this.logger.log(`No results found for: ${title} by ${author}`);
        return { found: false, source: 'google-books', urls: {} };
      }

      const book = response.data.items[0];
      const imageLinks = book.volumeInfo?.imageLinks;

      if (!imageLinks) {
        this.logger.log(`No cover images for: ${title}`);
        return { found: false, source: 'google-books', urls: {} };
      }

      // Google Books returns http, upgrade to https
      const upgradeUrl = (url: string | undefined) =>
        url ? url.replace('http://', 'https://') : undefined;

      this.logger.log(`✅ Cover found via Google Books for: ${title}`);

      return {
        found: true,
        source: 'google-books',
        urls: {
          thumbnail: upgradeUrl(imageLinks.thumbnail || imageLinks.smallThumbnail),
          small: upgradeUrl(imageLinks.small || imageLinks.thumbnail),
          medium: upgradeUrl(imageLinks.medium || imageLinks.small),
          large: upgradeUrl(imageLinks.large || imageLinks.medium),
        },
        metadata: {
          originalUrl: upgradeUrl(imageLinks.thumbnail),
          format: 'jpeg',
        },
      };
    } catch (error) {
      this.logger.error(`Google Books API error: ${error.message}`);
      return { found: false, source: 'google-books', urls: {} };
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
