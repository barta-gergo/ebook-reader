/**
 * Value Object containing book metadata information
 * Encapsulates all the descriptive data about a book
 */
export class BookMetadata {
  constructor(
    public readonly title: string,
    public readonly author: string,
    public readonly subject?: string,
    public readonly keywords?: string,
    public readonly creator?: string,
    public readonly producer?: string,
    public readonly creationDate?: Date,
    public readonly modificationDate?: Date,
    public readonly version?: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title?.trim()) {
      throw new Error('Book title cannot be empty');
    }
    if (!this.author?.trim()) {
      throw new Error('Book author cannot be empty');
    }
  }

  public static create(data: {
    title: string;
    author: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    version?: string;
  }): BookMetadata {
    return new BookMetadata(
      data.title,
      data.author,
      data.subject,
      data.keywords,
      data.creator,
      data.producer,
      data.creationDate,
      data.modificationDate,
      data.version,
    );
  }

  public updateTitle(newTitle: string): BookMetadata {
    return new BookMetadata(
      newTitle,
      this.author,
      this.subject,
      this.keywords,
      this.creator,
      this.producer,
      this.creationDate,
      this.modificationDate,
      this.version,
    );
  }

  public updateAuthor(newAuthor: string): BookMetadata {
    return new BookMetadata(
      this.title,
      newAuthor,
      this.subject,
      this.keywords,
      this.creator,
      this.producer,
      this.creationDate,
      this.modificationDate,
      this.version,
    );
  }

  public getDisplayName(): string {
    return `${this.title} by ${this.author}`;
  }

  public hasKeyword(keyword: string): boolean {
    if (!this.keywords) return false;
    return this.keywords.toLowerCase().includes(keyword.toLowerCase());
  }

  public equals(other: BookMetadata): boolean {
    return (
      this.title === other.title &&
      this.author === other.author &&
      this.subject === other.subject &&
      this.keywords === other.keywords &&
      this.creator === other.creator &&
      this.producer === other.producer &&
      this.version === other.version &&
      this.creationDate?.getTime() === other.creationDate?.getTime() &&
      this.modificationDate?.getTime() === other.modificationDate?.getTime()
    );
  }
}