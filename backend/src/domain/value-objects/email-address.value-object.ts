export class EmailAddress {
  private readonly _value: string;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(value: string) {
    this._value = value.toLowerCase().trim();
  }

  public static create(value: string): EmailAddress {
    EmailAddress.validate(value);
    return new EmailAddress(value);
  }

  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Email address cannot be empty');
    }

    const trimmedValue = value.trim();
    
    if (trimmedValue.length > 254) {
      throw new Error('Email address cannot exceed 254 characters');
    }

    if (!EmailAddress.EMAIL_REGEX.test(trimmedValue)) {
      throw new Error('Invalid email address format');
    }
  }

  public get value(): string {
    return this._value;
  }

  public getDomain(): string {
    return this._value.split('@')[1];
  }

  public getLocalPart(): string {
    return this._value.split('@')[0];
  }

  public equals(other: EmailAddress): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}