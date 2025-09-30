export interface TextIndexingService {
  createSearchableIndex(fullText: string): string;
  searchInText(searchableText: string, query: string): boolean;
  extractSearchSnippets(searchableText: string, query: string, maxSnippets?: number): string[];
  getPageText(bookId: string, pageNumber: number): Promise<string>;
}