import { Inject, Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { MatchEventRegisteredDomainEvent } from '../../domain/events/match-event-registered.event'
import {
  IMatchEventRepository,
  MATCH_EVENT_REPOSITORY,
} from '../../domain/repositories/i-match-event.repository'
import {
  IStatisticRepository,
  STATISTIC_REPOSITORY,
  UpsertPlayerStatisticData,
} from '../../domain/repositories/i-statistic.repository'
import { CardColor, GoalType, MatchEventType } from '../../domain/enums'

@Injectable()
export class UpdatePlayerStatsHandler {
  private readonly logger = new Logger(UpdatePlayerStatsHandler.name)

  constructor(
    @Inject(MATCH_EVENT_REPOSITORY) private readonly eventRepo: IMatchEventRepository,
    @Inject(STATISTIC_REPOSITORY) private readonly statRepo: IStatisticRepository,
  ) {}

  @OnEvent(MatchEventRegisteredDomainEvent.EVENT_NAME, { async: false })
  async handle(event: MatchEventRegisteredDomainEvent): Promise<void> {
    await TenantContext.run(event.tenantSchema, async () => {
      try {
        const { championshipId } = event.matchEvent
        const allEvents = await this.eventRepo.findByChampionshipId(championshipId)

        const playerMap = new Map<string, UpsertPlayerStatisticData>()

        const ensurePlayer = (playerId: string, teamId: string) => {
          if (!playerMap.has(playerId)) {
            playerMap.set(playerId, {
              championshipId,
              teamId,
              playerId,
              goals: 0,
              assists: 0,
              yellowCards: 0,
              redCards: 0,
            })
          }
          return playerMap.get(playerId)!
        }

        for (const ev of allEvents) {
          if (ev.eventType === MatchEventType.GOL) {
            if (ev.playerId) {
              const stat = ensurePlayer(ev.playerId, ev.teamId)
              // Own goals: credited to player but don't count as goals for their team
              if (ev.goalType !== GoalType.CONTRA) {
                stat.goals++
              }
            }
            if (ev.assistPlayerId) {
              const assistStat = ensurePlayer(ev.assistPlayerId, ev.teamId)
              assistStat.assists++
            }
          } else if (ev.eventType === MatchEventType.CARTAO && ev.playerId) {
            const stat = ensurePlayer(ev.playerId, ev.teamId)
            if (ev.cardColor === CardColor.AMARELO) stat.yellowCards++
            else if (ev.cardColor === CardColor.VERMELHO) stat.redCards++
          } else if (ev.eventType === MatchEventType.EXPULSAO && ev.playerId) {
            const stat = ensurePlayer(ev.playerId, ev.teamId)
            stat.redCards++
          }
        }

        if (playerMap.size > 0) {
          await this.statRepo.upsertMany([...playerMap.values()])
        }
      } catch (err) {
        this.logger.error('UpdatePlayerStatsHandler failed', err)
      }
    })
  }
}
