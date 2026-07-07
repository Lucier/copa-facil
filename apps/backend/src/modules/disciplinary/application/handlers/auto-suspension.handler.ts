import { Inject, Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { MatchEventRegisteredDomainEvent } from '../../../match-engine/domain/events/match-event-registered.event'
import {
  IMatchEventRepository} from '../../../match-engine/domain/repositories/i-match-event.repository'
import {
  MATCH_EVENT_REPOSITORY,
} from '../../../match-engine/domain/repositories/i-match-event.repository'
import { CardColor, MatchEventType } from '../../../match-engine/domain/enums'
import { SuspensionSource } from '../../domain/enums'
import {
  ISuspensionRepository} from '../../domain/repositories/i-suspension.repository'
import {
  SUSPENSION_REPOSITORY,
} from '../../domain/repositories/i-suspension.repository'

@Injectable()
export class AutoSuspensionHandler {
  private readonly logger = new Logger(AutoSuspensionHandler.name)

  constructor(
    @Inject(MATCH_EVENT_REPOSITORY) private readonly eventRepo: IMatchEventRepository,
    @Inject(SUSPENSION_REPOSITORY) private readonly suspensionRepo: ISuspensionRepository,
  ) {}

  @OnEvent(MatchEventRegisteredDomainEvent.EVENT_NAME, { async: false })
  async handle(event: MatchEventRegisteredDomainEvent): Promise<void> {
    const { eventType, cardColor } = event.matchEvent
    const isRedCard =
      (eventType === MatchEventType.CARTAO && cardColor === CardColor.VERMELHO) ||
      eventType === MatchEventType.EXPULSAO
    const isYellowCard =
      eventType === MatchEventType.CARTAO && cardColor === CardColor.AMARELO

    if (!isRedCard && !isYellowCard) return

    await TenantContext.run(event.tenantSchema, async () => {
      try {
        const { id: eventId, playerId, teamId, championshipId } = event.matchEvent
        if (!playerId) return

        // Guard against duplicate auto-suspensions for the same event
        const existing = await this.suspensionRepo.findByEventId(eventId)
        if (existing) return

        if (isRedCard) {
          const reason =
            eventType === MatchEventType.EXPULSAO
              ? 'Expulsão'
              : 'Cartão Vermelho Direto'

          await this.suspensionRepo.create({
            championshipId,
            playerId,
            teamId,
            reason,
            source: SuspensionSource.AUTO,
            matchesToServe: 1,
            eventId,
          })
          return
        }

        // Yellow card: check accumulated count for this player in championship
        const allEvents = await this.eventRepo.findByChampionshipId(championshipId)
        const yellowCount = allEvents.filter(
          (ev) =>
            ev.playerId === playerId &&
            ev.eventType === MatchEventType.CARTAO &&
            ev.cardColor === CardColor.AMARELO,
        ).length

        if (yellowCount > 0 && yellowCount % 3 === 0) {
          await this.suspensionRepo.create({
            championshipId,
            playerId,
            teamId,
            reason: `${yellowCount}º Cartão Amarelo (acúmulo)`,
            source: SuspensionSource.AUTO,
            matchesToServe: 1,
            eventId,
          })
        }
      } catch (err) {
        this.logger.error('AutoSuspensionHandler failed', err)
      }
    })
  }
}
