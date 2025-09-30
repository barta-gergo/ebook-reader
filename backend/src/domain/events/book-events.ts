import { DomainEvent } from './domain-event.interface';
import { BookId } from '../value-objects';

export class BookAddedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType = 'BookAdded';
  public readonly aggregateId: string;

  constructor(
    public readonly bookId: BookId,
    public readonly title: string,
    public readonly author: string,
    public readonly filePath: string,
  ) {
    this.eventId = this.generateEventId();
    this.occurredOn = new Date();
    this.aggregateId = bookId.value;
  }

  private generateEventId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export class BookDeletedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType = 'BookDeleted';
  public readonly aggregateId: string;

  constructor(
    public readonly bookId: BookId,
    public readonly title: string,
  ) {
    this.eventId = this.generateEventId();
    this.occurredOn = new Date();
    this.aggregateId = bookId.value;
  }

  private generateEventId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export class BookOpenedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType = 'BookOpened';
  public readonly aggregateId: string;

  constructor(
    public readonly bookId: BookId,
    public readonly title: string,
  ) {
    this.eventId = this.generateEventId();
    this.occurredOn = new Date();
    this.aggregateId = bookId.value;
  }

  private generateEventId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}