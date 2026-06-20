import { BaseEvent } from '../../../../events/base-event'
import { MatchEventEntity } from '../entities/match-event.entity'

export class MatchEventRegisteredDomainEvent extends BaseEvent {
  static readonly EVENT_NAME = 'match.event.registered'

  constructor(
    public readonly matchEvent: MatchEventEntity,
    public readonly tenantSchema: string,
  ) {
    super()
  }
}
