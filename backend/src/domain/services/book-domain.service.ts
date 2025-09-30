import { BookMetadata } from '../value-objects/book-metadata.value-object';
import { ReadPageCollection } from '../value-objects/read-page-collection.value-object';
import { TableOfContents, TocEntry } from '../value-objects/table-of-contents.value-object';
import { BookAggregate } from '../aggregates/book.aggregate';

/**
 * Proper Domain Service containing pure business logic
 * No infrastructure dependencies, only domain knowledge
 */
export class BookDomainService {
  /**
   * Business rule: Validate book creation data
   */
  static validateBookCreationData(
    title: string,
    author: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
    totalPages: number
  ): void {
    if (!title?.trim()) {
      throw new Error('Book title cannot be empty');
    }
    
    if (!author?.trim()) {
      throw new Error('Book author cannot be empty');
    }
    
    if (!filePath?.trim()) {
      throw new Error('File path cannot be empty');
    }
    
    if (fileSize <= 0) {
      throw new Error('File size must be greater than 0');
    }
    
    if (!mimeType?.trim()) {
      throw new Error('MIME type cannot be empty');
    }
    
    if (totalPages < 0) {
      throw new Error('Total pages cannot be negative');
    }
  }


  /**
   * Business rule: Convert external TOC data to domain objects
   */
  static createTableOfContentsFromExternal(
    externalTocData: Array<{ title: string; page: number; level: number; children?: any[] }>
  ): TableOfContents {
    const convertEntry = (data: any): TocEntry => {
      const children = data.children?.map(convertEntry) || [];
      return new TocEntry(data.title, data.page, data.level, children);
    };

    const entries = externalTocData.map(convertEntry);
    return TableOfContents.create(entries);
  }
}