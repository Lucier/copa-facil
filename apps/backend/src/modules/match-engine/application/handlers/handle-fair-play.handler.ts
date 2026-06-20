import { Inject, Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { MatchEventRegisteredDomainEvent } from '../../domain/events/match-event-registered.event'
import {
  IMatchEventRepository,
  MATCH_EVENT_REPOSITORY,
} from '../../domain/repositories/i-match-event.repository'
import {
  IStandingRepository,
  STANDING_REPOSITORY,
} from '../../domain/repositories/i-standing.repository'
import { CardColor, MatchEventType } from '../../domain/enums'

// Updates fair-play counters in standings whenever a card event is registered.
@Injectable()
export class HandleFairPlayHandler {
  private readonly logger = new Logger(HandleFairPlayHandler.name)

  constructor(
    @Inject(MATCH_EVENT_REPOSITORY) private readonly eventRepo: IMatchEventRepository,
    @Inject(STANDING_REPOSITORY) private readonly standingRepo: IStandingRepository,
  ) {}

  @OnEvent(MatchEventRegisteredDomainEvent.EVENT_NAME, { async: false })
  async handle(event: MatchEventRegisteredDomainEvent): Promise<void> {
    const { eventType } = event.matchEvent
    if (
      eventType !== MatchEventType.CARTAO &&
      eventType !== MatchEventType.EXPULSAO
    ) {
      return
    }

    await TenantContext.run(event.tenantSchema, async () => {
      try {
        const { championshipId, teamId } = event.matchEvent
        const allEvents = await this.eventRepo.findByChampionshipId(championshipId)

        // Recompute card totals for the affected team
        let yellowCards = 0
        let redCards = 0
        for (const ev of allEvents) {
          if (ev.teamId !== teamId) continue
          if (ev.eventType === MatchEventType.CARTAO && ev.cardColor === CardColor.AMARELO) {
            yellowCards++
          } else if (
            (ev.eventType === MatchEventType.CARTAO && ev.cardColor === CardColor.VERMELHO) ||
            ev.eventType === MatchEventType.EXPULSAO
          ) {
            redCards++
          }
        }

        const existing = await this.standingRepo.findByChampionshipId(championshipId)
        const teamStanding = existing.find((s) => s.teamId === teamId)
        if (!teamStanding) return

        await this.standingRepo.upsert({
          championshipId,
          groupId: teamStanding.groupId,
          teamId,
          matchesPlayed: teamStanding.matchesPlayed,
          wins: teamStanding.wins,
          draws: teamStanding.draws,
          losses: teamStanding.losses,
          goalsFor: teamStanding.goalsFor,
          goalsAgainst: teamStanding.goalsAgainst,
          goalDifference: teamStanding.goalDifference,
          points: teamStanding.points,
          yellowCards,
          redCards,
          fairPlayPoints: yellowCards * 1 + redCards * 3,
        })
      } catch (err) {
        this.logger.error('HandleFairPlayHandler failed', err)
      }
    })
  }
}
