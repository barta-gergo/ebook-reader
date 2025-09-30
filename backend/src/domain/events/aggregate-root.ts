import { DomainEvent } from './domain-event.interface';

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}