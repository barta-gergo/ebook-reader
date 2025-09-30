import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SearchBooksByContentQuery, SearchResult } from './search-books-by-content.query';
import { SearchService, SearchResponse } from '../../../domain/services/search.interface';
import { SEARCH_SERVICE } from '../../../domain/repositories/tokens';
import { BookResponseDto } from '../../dtos/book.dto';

describe('SearchBooksByContentQuery', () => {
  let query: SearchBooksByContentQuery;
  let searchService: jest.Mocked<SearchService>;

  const mockSearchResponse: SearchResponse = {
    hits: [
      {
        id: 'book-1-page-1',
        bookId: 'book-1',
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        subject: 'Programming',
        keywords: 'javascript, programming',
        content: 'JavaScript is a programming language used for web development...',
        pageNumber: 1,
        filePath: '/path/to/book1.pdf',
        fileSize: 1024000,
        totalPages: 200,
        addedAt: '2023-01-01T00:00:00.000Z',
        lastOpened: '2023-01-02T00:00:00.000Z',
        _score: 0.95,
        _snippets: ['JavaScript is a <mark>programming</mark> language...']
      },
      {
        id: 'book-2-page-5',
        bookId: 'book-2',
        title: 'Learning TypeScript',
        author: 'Josh Goldberg',
        subject: 'Programming',
        keywords: 'typescript, javascript',
        content: 'TypeScript extends JavaScript by adding static type definitions...',
        pageNumber: 5,
        filePath: '/path/to/book2.pdf',
        fileSize: 2048000,
        totalPages: 350,
        addedAt: '2023-01-03T00:00:00.000Z',
        lastOpened: undefined,
        _score: 0.87,
        _snippets: ['TypeScript extends <mark>JavaScript</mark>...']
      }
    ],
    query: 'javascript',
    processingTimeMs: 23,
    limit: 20,
    offset: 0,
    estimatedTotalHits: 2
  };

  beforeEach(async () => {
    const mockSearchService = {
      isHealthy: jest.fn(),
      searchBooks: jest.fn(),
      getSuggestions: jest.fn(),
      indexBook: jest.fn(),
      indexBooks: jest.fn(),
      updateBook: jest.fn(),
      deleteBook: jest.fn(),
      clearIndex: jest.fn(),
      getIndexStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchBooksByContentQuery,
        {
          provide: SEARCH_SERVICE,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    query = module.get<SearchBooksByContentQuery>(SearchBooksByContentQuery);
    searchService = module.get<SearchService>(SEARCH_SERVICE) as jest.Mocked<SearchService>;

    // Mock the logger to avoid noise in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  describe('execute', () => {
    it('should return search results when Meilisearch is healthy and has results', async () => {
      // Arrange
      searchService.isHealthy.mockResolvedValue(true);
      searchService.searchBooks.mockResolvedValue(mockSearchResponse);

      // Act
      const results = await query.execute('javascript');

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        book: expect.objectContaining({
          id: 'book-1',
          title: 'JavaScript: The Good Parts',
          author: 'Douglas Crockford',
          subject: 'Programming',
          keywords: 'javascript, programming',
          mimeType: 'application/pdf',
          addedAt: new Date('2023-01-01T00:00:00.000Z'),
          lastOpened: new Date('2023-01-02T00:00:00.000Z'),
        }),
        snippets: ['JavaScript is a <mark>programming</mark> language...'],
        relevanceScore: 0.95,
        pageNumber: 1,
      });

      expect(searchService.isHealthy).toHaveBeenCalled();
      expect(searchService.searchBooks).toHaveBeenCalledWith('javascript', {
        limit: 20,
        offset: 0,
        filter: undefined,
        sort: undefined,
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        cropLength: 150,
        showMatchesPosition: false
      });
    });

    it('should return empty results when Meilisearch is not healthy', async () => {
      // Arrange
      searchService.isHealthy.mockResolvedValue(false);

      // Act
      const results = await query.execute('javascript');

      // Assert
      expect(results).toEqual([]);
      expect(searchService.isHealthy).toHaveBeenCalled();
      expect(searchService.searchBooks).not.toHaveBeenCalled();
    });

    it('should handle search errors gracefully', async () => {
      // Arrange
      searchService.isHealthy.mockResolvedValue(true);
      searchService.searchBooks.mockRejectedValue(new Error('Search service error'));

      // Act
      const results = await query.execute('javascript');

      // Assert
      expect(results).toEqual([]);
      expect(searchService.isHealthy).toHaveBeenCalled();
      expect(searchService.searchBooks).toHaveBeenCalled();
    });

    it('should throw error for queries shorter than 2 characters', async () => {
      // Act & Assert
      await expect(query.execute('a')).rejects.toThrow('Search query must be at least 2 characters long');
      await expect(query.execute('')).rejects.toThrow('Search query must be at least 2 characters long');
    });

    it('should pass search options correctly', async () => {
      // Arrange
      searchService.isHealthy.mockResolvedValue(true);
      searchService.searchBooks.mockResolvedValue({ ...mockSearchResponse, hits: [] });

      const options = {
        offset: 10,
        filters: ['author=Crockford'],
        sort: ['addedAt:desc']
      };

      // Act
      await query.execute('javascript', 30, options);

      // Assert
      expect(searchService.searchBooks).toHaveBeenCalledWith('javascript', {
        limit: 30,
        offset: 10,
        filter: ['author=Crockford'],
        sort: ['addedAt:desc'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        cropLength: 150,
        showMatchesPosition: false
      });
    });

    it('should handle results with missing optional fields', async () => {
      // Arrange
      const sparseSearchResponse: SearchResponse = {
        ...mockSearchResponse,
        hits: [{
          id: 'book-3-page-1',
          bookId: 'book-3',
          title: 'Minimal Book',
          author: 'Unknown Author',
          content: 'This is a minimal book with basic content.',
          pageNumber: 1,
          filePath: '/minimal.pdf',
          fileSize: 512000,
          totalPages: 100,
          addedAt: '2023-01-01T00:00:00.000Z',
          // Missing optional fields: subject, keywords, lastOpened, _score, _snippets
        }]
      };

      searchService.isHealthy.mockResolvedValue(true);
      searchService.searchBooks.mockResolvedValue(sparseSearchResponse);

      // Act
      const results = await query.execute('minimal');

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        book: expect.objectContaining({
          id: 'book-3',
          title: 'Minimal Book',
          author: 'Unknown Author',
          subject: undefined,
          keywords: undefined,
          lastOpened: undefined,
        }),
        snippets: [],
        relevanceScore: 0,
        pageNumber: 1,
      });
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions when Meilisearch is healthy', async () => {
      // Arrange
      const mockSuggestions = ['JavaScript', 'TypeScript', 'React'];
      searchService.isHealthy.mockResolvedValue(true);
      searchService.getSuggestions.mockResolvedValue(mockSuggestions);

      // Act
      const suggestions = await query.getSuggestions('java');

      // Assert
      expect(suggestions).toEqual(mockSuggestions);
      expect(searchService.isHealthy).toHaveBeenCalled();
      expect(searchService.getSuggestions).toHaveBeenCalledWith('java', 5);
    });

    it('should return empty array when Meilisearch is not healthy', async () => {
      // Arrange
      searchService.isHealthy.mockResolvedValue(false);

      // Act
      const suggestions = await query.getSuggestions('java');

      // Assert
      expect(suggestions).toEqual([]);
      expect(searchService.isHealthy).toHaveBeenCalled();
      expect(searchService.getSuggestions).not.toHaveBeenCalled();
    });

    it('should handle suggestions errors gracefully', async () => {
      // Arrange
      searchService.isHealthy.mockResolvedValue(true);
      searchService.getSuggestions.mockRejectedValue(new Error('Suggestions service error'));

      // Act
      const suggestions = await query.getSuggestions('java');

      // Assert
      expect(suggestions).toEqual([]);
    });

    it('should return empty array for empty query', async () => {
      // Act
      const suggestions = await query.getSuggestions('');

      // Assert
      expect(suggestions).toEqual([]);
      expect(searchService.isHealthy).not.toHaveBeenCalled();
    });

    it('should pass custom limit correctly', async () => {
      // Arrange
      searchService.isHealthy.mockResolvedValue(true);
      searchService.getSuggestions.mockResolvedValue(['JavaScript']);

      // Act
      await query.getSuggestions('java', 10);

      // Assert
      expect(searchService.getSuggestions).toHaveBeenCalledWith('java', 10);
    });
  });

  describe('query validation', () => {
    it('should trim whitespace from queries', async () => {
      // Arrange
      searchService.isHealthy.mockResolvedValue(true);
      searchService.searchBooks.mockResolvedValue({ ...mockSearchResponse, hits: [] });

      // Act
      await query.execute('  javascript  ');

      // Assert
      expect(searchService.searchBooks).toHaveBeenCalledWith('javascript', expect.any(Object));
    });

    it('should trim whitespace from suggestion queries', async () => {
      // Arrange
      searchService.isHealthy.mockResolvedValue(true);
      searchService.getSuggestions.mockResolvedValue([]);

      // Act
      await query.getSuggestions('  java  ');

      // Assert
      expect(searchService.getSuggestions).toHaveBeenCalledWith('java', 5);
    });
  });

  describe('logging', () => {
    it('should log successful search results', async () => {
      // Arrange
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      searchService.isHealthy.mockResolvedValue(true);
      searchService.searchBooks.mockResolvedValue(mockSearchResponse);

      // Act
      await query.execute('javascript');

      // Assert
      expect(logSpy).toHaveBeenCalledWith('Search "javascript" returned 2 results in 23ms');
    });

    it('should log warning when Meilisearch is not healthy', async () => {
      // Arrange
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      searchService.isHealthy.mockResolvedValue(false);

      // Act
      await query.execute('javascript');

      // Assert
      expect(warnSpy).toHaveBeenCalledWith('Search service is not available, returning empty results');
    });

    it('should log errors when search fails', async () => {
      // Arrange
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const searchError = new Error('Search service error');
      searchService.isHealthy.mockResolvedValue(true);
      searchService.searchBooks.mockRejectedValue(searchError);

      // Act
      await query.execute('javascript');

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('Search failed for query: "javascript"', searchError);
    });
  });
});