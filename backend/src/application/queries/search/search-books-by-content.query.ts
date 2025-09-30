import { Injectable, Logger, Inject } from '@nestjs/common';
import { BookResponseDto } from '../../dtos/book.dto';
import { SearchService, SearchResponse } from '../../../domain/services/search.interface';
import { SEARCH_SERVICE } from '../../../domain/repositories/tokens';

export interface SearchResult {
  book: BookResponseDto;
  snippets: string[];
  relevanceScore: number;
  pageNumber?: number;
}

@Injectable()
export class SearchBooksByContentQuery {
  private readonly logger = new Logger(SearchBooksByContentQuery.name);

  constructor(
    @Inject(SEARCH_SERVICE)
    private readonly searchService: SearchService,
  ) {}

  async execute(
    query: string, 
    limit = 20, 
    options: {
      offset?: number;
      filters?: string[];
      sort?: string[];
    } = {}
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    try {
      // Check if search service is available
      const isHealthy = await this.searchService.isHealthy();
      if (!isHealthy) {
        this.logger.warn('Search service is not available, returning empty results');
        return [];
      }

      // Perform search using search service
      const searchResponse: SearchResponse = await this.searchService.searchBooks(
        query.trim(),
        {
          limit,
          offset: options.offset || 0,
          filter: options.filters,
          sort: options.sort,
          highlightPreTag: '<mark>',
          highlightPostTag: '</mark>',
          cropLength: 150,
          showMatchesPosition: false
        }
      );

      // Transform search results to our format
      const results: SearchResult[] = searchResponse.hits.map(hit => {
        const bookDto: BookResponseDto = {
          id: hit.bookId || hit.id, // Use bookId if available, fallback to id
          title: hit.title,
          author: hit.author,
          filePath: hit.filePath,
          fileSize: hit.fileSize,
          mimeType: 'application/pdf', // Default, could be stored in index
          totalPages: hit.totalPages,
          subject: hit.subject,
          keywords: hit.keywords,
          creator: undefined, // Could be added to search index if needed
          producer: undefined,
          creationDate: undefined,
          modificationDate: undefined,
          version: undefined,
          textLength: undefined,
          addedAt: new Date(hit.addedAt),
          lastOpened: hit.lastOpened ? new Date(hit.lastOpened) : undefined,
        };

        return {
          book: bookDto,
          snippets: hit._snippets || [],
          relevanceScore: hit._score || 0,
          pageNumber: hit.pageNumber,
        };
      });

      this.logger.log(`Search "${query}" returned ${results.length} results in ${searchResponse.processingTimeMs}ms`);
      return results;

    } catch (error) {
      this.logger.error(`Search failed for query: "${query}"`, error);
      
      // Fallback: return empty results rather than crashing
      // In production, you might want to fall back to a simpler search method
      return [];
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(query: string, limit = 5): Promise<string[]> {
    if (!query || query.trim().length < 1) {
      return [];
    }

    try {
      const isHealthy = await this.searchService.isHealthy();
      if (!isHealthy) {
        return [];
      }

      return await this.searchService.getSuggestions(query.trim(), limit);
    } catch (error) {
      this.logger.error(`Failed to get suggestions for: "${query}"`, error);
      return [];
    }
  }


}