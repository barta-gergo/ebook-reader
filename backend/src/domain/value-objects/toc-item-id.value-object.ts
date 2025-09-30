export class TocItemId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value?: string): TocItemId {
    const id = value || TocItemId.generate();
    TocItemId.validate(id);
    return new TocItemId(id);
  }

  public static fromString(value: string): TocItemId {
    TocItemId.validate(value);
    return new TocItemId(value);
  }

  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('TocItemId cannot be empty');
    }
    
    if (value.length < 3) {
      throw new Error('TocItemId must be at least 3 characters long');
    }
    
    if (value.length > 100) {
      throw new Error('TocItemId cannot exceed 100 characters');
    }
  }

  private static generate(): string {
    return 'toc_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: TocItemId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}