import { BookId } from '../value-objects';

export class ReadPages {
  constructor(
    public readonly id: string,
    public readonly bookId: BookId,
    public readonly readPages: number[],
    public readonly lastUpdated: Date,
  ) {}

  public addPage(pageNumber: number): ReadPages {
    if (this.readPages.includes(pageNumber)) {
      return this;
    }
    
    const updatedReadPages = [...this.readPages, pageNumber].sort((a, b) => a - b);
    return new ReadPages(
      this.id,
      this.bookId,
      updatedReadPages,
      new Date(),
    );
  }

  public removePage(pageNumber: number): ReadPages {
    const updatedReadPages = this.readPages.filter(page => page !== pageNumber);
    return new ReadPages(
      this.id,
      this.bookId,
      updatedReadPages,
      new Date(),
    );
  }

  public hasPage(pageNumber: number): boolean {
    return this.readPages.includes(pageNumber);
  }

  public getReadCount(): number {
    return this.readPages.length;
  }
}