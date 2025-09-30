import { BookAggregate } from '../aggregates/book.aggregate';

export interface BookSearchDocument {
  id: string;
  bookId: string;
  title: string;
  author: string;
  subject?: string;
  keywords?: string;
  content: string;
  pageNumber?: number;
  filePath: string;
  fileSize: number;
  totalPages: number;
  addedAt: string;
  lastOpened?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filter?: string[];
  sort?: string[];
  highlightPreTag?: string;
  highlightPostTag?: string;
  cropLength?: number;
  showMatchesPosition?: boolean;
}

export interface SearchHit extends BookSearchDocument {
  _score?: number;
  _snippets?: string[];
  _formatted?: Partial<BookSearchDocument>;
}

export interface SearchResponse {
  hits: SearchHit[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

export interface SearchService {
  isHealthy(): Promise<boolean>;
  indexBook(book: BookAggregate, fullTextContent?: string, pageContents?: Array<{pageNumber: number, textContent: string}>): Promise<void>;
  indexBooks(books: Array<{ book: BookAggregate; fullTextContent?: string }>): Promise<void>;
  searchBooks(query: string, options?: SearchOptions): Promise<SearchResponse>;
  getSuggestions(query: string, limit?: number): Promise<string[]>;
  updateBook(book: BookAggregate, fullTextContent?: string): Promise<void>;
  deleteBook(bookId: string): Promise<void>;
  clearIndex(): Promise<void>;
  getIndexStats(): Promise<any>;
}