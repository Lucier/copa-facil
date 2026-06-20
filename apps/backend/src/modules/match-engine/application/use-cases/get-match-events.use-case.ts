import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { MatchEventEntity } from '../../domain/entities/match-event.entity'
import {
  IMatchEventRepository,
  MATCH_EVENT_REPOSITORY,
} from '../../domain/repositories/i-match-event.repository'
import { IMatchRepository, MATCH_REPOSITORY } from '../../domain/repositories/i-match.repository'

@Injectable()
export class GetMatchEventsUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepo: IMatchRepository,
    @Inject(MATCH_EVENT_REPOSITORY) private readonly eventRepo: IMatchEventRepository,
  ) {}

  async execute(matchId: string): Promise<MatchEventEntity[]> {
    const match = await this.matchRepo.findById(matchId)
    if (!match) throw new NotFoundError('Match', matchId)
    return this.eventRepo.findByMatchId(matchId)
  }
}
