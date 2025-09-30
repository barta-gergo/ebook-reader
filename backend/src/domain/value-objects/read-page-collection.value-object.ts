/**
 * Value Object representing a collection of read pages for a book
 * Replaces the confusing ReadPage/ReadPages entities
 */
export class ReadPageCollection {
  private readonly _readPages: Set<number>;

  constructor(readPages: number[] = []) {
    // Validate page numbers
    this.validatePages(readPages);
    this._readPages = new Set(readPages);
  }

  private validatePages(pages: number[]): void {
    for (const page of pages) {
      if (!Number.isInteger(page) || page < 1) {
        throw new Error(`Invalid page number: ${page}. Pages must be positive integers.`);
      }
    }
  }

  public addPage(pageNumber: number): ReadPageCollection {
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }
    
    const newPages = Array.from(this._readPages);
    if (!this._readPages.has(pageNumber)) {
      newPages.push(pageNumber);
    }
    
    return new ReadPageCollection(newPages);
  }

  public removePage(pageNumber: number): ReadPageCollection {
    const newPages = Array.from(this._readPages).filter(page => page !== pageNumber);
    return new ReadPageCollection(newPages);
  }

  public hasPage(pageNumber: number): boolean {
    return this._readPages.has(pageNumber);
  }

  public getReadPages(): number[] {
    return Array.from(this._readPages).sort((a, b) => a - b);
  }

  public getReadCount(): number {
    return this._readPages.size;
  }

  public isEmpty(): boolean {
    return this._readPages.size === 0;
  }

  public calculateReadingProgress(totalPages: number): number {
    if (totalPages <= 0) return 0;
    return Math.min(100, (this._readPages.size / totalPages) * 100);
  }

  public equals(other: ReadPageCollection): boolean {
    if (this._readPages.size !== other._readPages.size) {
      return false;
    }
    
    for (const page of this._readPages) {
      if (!other._readPages.has(page)) {
        return false;
      }
    }
    
    return true;
  }

  public toString(): string {
    return JSON.stringify(this.getReadPages());
  }
}