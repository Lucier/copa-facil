import { Inject, Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { MatchConcludedDomainEvent } from '../../domain/events/match-concluded.event'
import { IMatchEventRepository, MATCH_EVENT_REPOSITORY } from '../../domain/repositories/i-match-event.repository'
import { IMatchRepository, MATCH_REPOSITORY } from '../../domain/repositories/i-match.repository'
import {
  IStandingRepository,
  STANDING_REPOSITORY,
  UpsertStandingData,
} from '../../domain/repositories/i-standing.repository'
import { CardColor, MatchEventType } from '../../domain/enums'

@Injectable()
export class UpdateStandingsHandler {
  private readonly logger = new Logger(UpdateStandingsHandler.name)

  constructor(
    @Inject(MATCH_REPOSITORY) private readonly matchRepo: IMatchRepository,
    @Inject(MATCH_EVENT_REPOSITORY) private readonly eventRepo: IMatchEventRepository,
    @Inject(STANDING_REPOSITORY) private readonly standingRepo: IStandingRepository,
  ) {}

  @OnEvent(MatchConcludedDomainEvent.EVENT_NAME, { async: false })
  async handle(event: MatchConcludedDomainEvent): Promise<void> {
    await TenantContext.run(event.tenantSchema, async () => {
      try {
        const { championshipId } = event.match

        const [allFinished, allEvents] = await Promise.all([
          this.matchRepo.findFinishedByChampionshipId(championshipId),
          this.eventRepo.findByChampionshipId(championshipId),
        ])

        // Aggregate stats per team from finished matches
        const teamMap = new Map<string, UpsertStandingData>()

        const ensureTeam = (teamId: string, groupId: string | null) => {
          if (!teamMap.has(teamId)) {
            teamMap.set(teamId, {
              championshipId,
              groupId,
              teamId,
              matchesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
              yellowCards: 0,
              redCards: 0,
              fairPlayPoints: 0,
            })
          }
          return teamMap.get(teamId)!
        }

        for (const m of allFinished) {
          if (!m.homeTeamId || !m.awayTeamId) continue

          const home = ensureTeam(m.homeTeamId, m.groupId)
          const away = ensureTeam(m.awayTeamId, m.groupId)

          home.matchesPlayed++
          away.matchesPlayed++
          home.goalsFor += m.homeScore
          home.goalsAgainst += m.awayScore
          away.goalsFor += m.awayScore
          away.goalsAgainst += m.homeScore

          if (m.homeScore > m.awayScore) {
            home.wins++
            home.points += 3
            away.losses++
          } else if (m.awayScore > m.homeScore) {
            away.wins++
            away.points += 3
            home.losses++
          } else {
            home.draws++
            home.points++
            away.draws++
            away.points++
          }

          home.goalDifference = home.goalsFor - home.goalsAgainst
          away.goalDifference = away.goalsFor - away.goalsAgainst
        }

        // Aggregate cards per team from match events
        for (const ev of allEvents) {
          if (ev.eventType !== MatchEventType.CARTAO && ev.eventType !== MatchEventType.EXPULSAO) {
            continue
          }
          const standing = teamMap.get(ev.teamId)
          if (!standing) continue

          if (ev.eventType === MatchEventType.CARTAO && ev.cardColor === CardColor.AMARELO) {
            standing.yellowCards++
            standing.fairPlayPoints++
          } else if (
            ev.eventType === MatchEventType.CARTAO && ev.cardColor === CardColor.VERMELHO ||
            ev.eventType === MatchEventType.EXPULSAO
          ) {
            standing.redCards++
            standing.fairPlayPoints += 3
          }
        }

        await this.standingRepo.upsertMany([...teamMap.values()])
      } catch (err) {
        this.logger.error('UpdateStandingsHandler failed', err)
      }
    })
  }
}
