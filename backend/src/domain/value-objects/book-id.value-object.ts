export class BookId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value?: string): BookId {
    const id = value || BookId.generate();
    BookId.validate(id);
    return new BookId(id);
  }

  public static fromString(value: string): BookId {
    BookId.validate(value);
    return new BookId(value);
  }

  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('BookId cannot be empty');
    }
    
    if (value.length < 3) {
      throw new Error('BookId must be at least 3 characters long');
    }
    
    if (value.length > 50) {
      throw new Error('BookId cannot exceed 50 characters');
    }
  }

  private static generate(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: BookId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}