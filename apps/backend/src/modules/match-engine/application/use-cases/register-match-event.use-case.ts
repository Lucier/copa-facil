import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { NotFoundError } from '../../../../shared/errors'
import { AppError } from '../../../../shared/errors/app-error'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { MatchStatus } from '../../../championships/domain/enums'
import { MatchEventEntity } from '../../domain/entities/match-event.entity'
import { MatchEventRegisteredDomainEvent } from '../../domain/events/match-event-registered.event'
import { GoalType, MatchEventType } from '../../domain/enums'
import {
  IMatchEventRepository} from '../../domain/repositories/i-match-event.repository'
import {
  MATCH_EVENT_REPOSITORY,
} from '../../domain/repositories/i-match-event.repository'
import { IMatchRepository} from '../../domain/repositories/i-match.repository'
import { MATCH_REPOSITORY } from '../../domain/repositories/i-match.repository'
import { RegisterMatchEventDto } from '../dtos/register-match-event.dto'

@Injectable()
export class RegisterMatchEventUseCase {
  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepo: IMatchRepository,
    @Inject(MATCH_EVENT_REPOSITORY) private readonly eventRepo: IMatchEventRepository,
    private readonly emitter: EventEmitter2,
  ) {}

  async execute(matchId: string, dto: RegisterMatchEventDto): Promise<MatchEventEntity> {
    const match = await this.matchRepo.findById(matchId)
    if (!match) throw new NotFoundError('Match', matchId)
    if (match.status !== MatchStatus.LIVE) {
      throw new AppError('Match is not live', 'INVALID_STATE', 422)
    }

    const matchEvent = await this.eventRepo.create({
      matchId,
      championshipId: match.championshipId,
      eventType: dto.eventType,
      teamId: dto.teamId,
      playerId: dto.playerId,
      assistPlayerId: dto.assistPlayerId,
      playerInId: dto.playerInId,
      playerOutId: dto.eventType === MatchEventType.SUBSTITUICAO ? dto.playerId : undefined,
      minute: dto.minute,
      goalType: dto.goalType,
      cardColor: dto.cardColor,
    })

    // Increment live score for goals
    if (dto.eventType === MatchEventType.GOL && dto.goalType !== GoalType.CONTRA) {
      const isHome = dto.teamId === match.homeTeamId
      const newHome = isHome ? match.homeScore + 1 : match.homeScore
      const newAway = isHome ? match.awayScore : match.awayScore + 1
      await this.matchRepo.updateScore(matchId, newHome, newAway)
    } else if (dto.eventType === MatchEventType.GOL && dto.goalType === GoalType.CONTRA) {
      // Own goal: credited to opposing team
      const isHome = dto.teamId === match.homeTeamId
      const newHome = isHome ? match.homeScore : match.homeScore + 1
      const newAway = isHome ? match.awayScore + 1 : match.awayScore
      await this.matchRepo.updateScore(matchId, newHome, newAway)
    }

    const tenantSchema = TenantContext.getSchema()
    this.emitter.emit(
      MatchEventRegisteredDomainEvent.EVENT_NAME,
      new MatchEventRegisteredDomainEvent(matchEvent, tenantSchema),
    )

    return matchEvent
  }
}
