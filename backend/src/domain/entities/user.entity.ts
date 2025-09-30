import { UserId, EmailAddress } from '../value-objects';

export class User {
  constructor(
    public readonly id: UserId,
    public readonly googleId: string,
    public readonly email: EmailAddress,
    public readonly name: string,
    public readonly pictureUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastLogin: Date | null,
    public readonly isActive: boolean,
  ) {}

  static create(
    googleId: string,
    email: string,
    name: string,
    pictureUrl?: string,
  ): User {
    const userId = UserId.create();
    const emailAddress = EmailAddress.create(email);
    const now = new Date();

    return new User(
      userId,
      googleId,
      emailAddress,
      name,
      pictureUrl || null,
      now,
      now,
      null,
      true,
    );
  }

  updateLastLogin(): User {
    return new User(
      this.id,
      this.googleId,
      this.email,
      this.name,
      this.pictureUrl,
      this.createdAt,
      new Date(),
      new Date(),
      this.isActive,
    );
  }

  updateProfile(name: string, pictureUrl?: string): User {
    return new User(
      this.id,
      this.googleId,
      this.email,
      name,
      pictureUrl || this.pictureUrl,
      this.createdAt,
      new Date(),
      this.lastLogin,
      this.isActive,
    );
  }

  deactivate(): User {
    return new User(
      this.id,
      this.googleId,
      this.email,
      this.name,
      this.pictureUrl,
      this.createdAt,
      new Date(),
      this.lastLogin,
      false,
    );
  }

  activate(): User {
    return new User(
      this.id,
      this.googleId,
      this.email,
      this.name,
      this.pictureUrl,
      this.createdAt,
      new Date(),
      this.lastLogin,
      true,
    );
  }
}