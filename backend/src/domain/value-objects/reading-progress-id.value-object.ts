export class ReadingProgressId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value?: string): ReadingProgressId {
    const id = value || ReadingProgressId.generate();
    ReadingProgressId.validate(id);
    return new ReadingProgressId(id);
  }

  public static fromString(value: string): ReadingProgressId {
    ReadingProgressId.validate(value);
    return new ReadingProgressId(value);
  }

  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('ReadingProgressId cannot be empty');
    }
    
    if (value.length < 3) {
      throw new Error('ReadingProgressId must be at least 3 characters long');
    }
    
    if (value.length > 100) {
      throw new Error('ReadingProgressId cannot exceed 100 characters');
    }
  }

  private static generate(): string {
    return 'progress_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: ReadingProgressId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}