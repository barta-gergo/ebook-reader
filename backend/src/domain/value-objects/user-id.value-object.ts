export class UserId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value?: string): UserId {
    const id = value || UserId.generate();
    UserId.validate(id);
    return new UserId(id);
  }

  public static fromString(value: string): UserId {
    UserId.validate(value);
    return new UserId(value);
  }

  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    
    if (value.length < 3) {
      throw new Error('UserId must be at least 3 characters long');
    }
    
    if (value.length > 50) {
      throw new Error('UserId cannot exceed 50 characters');
    }
  }

  private static generate(): string {
    return 'user_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: UserId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}