export abstract class BaseEvent {
  public readonly occurredAt: Date

  constructor() {
    this.occurredAt = new Date()
  }
}
