import { BaseEvent } from '../../../../events/base-event'
import { MatchEntity } from '../entities/match.entity'

export class MatchConcludedDomainEvent extends BaseEvent {
  static readonly EVENT_NAME = 'match.concluded'

  constructor(
    public readonly match: MatchEntity,
    public readonly tenantSchema: string,
  ) {
    super()
  }
}
