import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { MatchStubEntity } from '../../domain/entities/match-stub.entity'
import { RoundEntity } from '../../domain/entities/round.entity'
import { MatchStatus, RoundPhase } from '../../domain/enums'
import {
  IRoundRepository,
  RoundInput,
  RoundWithMatches,
} from '../../domain/repositories/i-round.repository'

interface RoundRow {
  id: string
  championship_id: string
  number: number
  name: string
  phase: string
  group_id: string | null
  created_at: Date
}

interface MatchRow {
  id: string
  championship_id: string
  round_id: string
  home_team_id: string | null
  away_team_id: string | null
  group_id: string | null
  bracket_slot: number | null
  status: string
  created_at: Date
}

@Injectable()
export class DrizzleRoundRepository implements IRoundRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async saveFixtures(
    championshipId: string,
    roundInputs: RoundInput[],
    _groupMap?: Map<number, string>,
  ): Promise<RoundWithMatches[]> {
    return this.drizzle.runInTenantContext(async (tx) => {
      const result: RoundWithMatches[] = []

      for (const ri of roundInputs) {
        const resolvedGroupId = ri.groupId ?? null

        const [roundRow] = await tx<RoundRow[]>`
          INSERT INTO rounds (championship_id, number, name, phase, group_id)
          VALUES (
            ${championshipId},
            ${ri.number},
            ${ri.name},
            ${ri.phase},
            ${resolvedGroupId}
          )
          RETURNING id, championship_id, number, name, phase, group_id, created_at
        `
        const round = this.toRoundEntity(roundRow)
        const matchEntities: MatchStubEntity[] = []

        for (const mi of ri.matches) {
          const matchGroupId = (mi as { groupId?: string }).groupId ?? resolvedGroupId ?? null
          const scheduledAt = mi.scheduledAt ?? null
          const [matchRow] = await tx<MatchRow[]>`
            INSERT INTO matches (
              championship_id, round_id, home_team_id, away_team_id,
              group_id, bracket_slot, status, scheduled_at
            )
            VALUES (
              ${championshipId},
              ${round.id},
              ${mi.homeTeamId ?? null},
              ${mi.awayTeamId ?? null},
              ${matchGroupId},
              ${mi.bracketSlot ?? null},
              'scheduled',
              ${scheduledAt}
            )
            RETURNING *
          `
          matchEntities.push(this.toMatchEntity(matchRow))
        }

        result.push({ round, matches: matchEntities })
      }

      return result
    })
  }

  async findWithMatchesByChampionshipId(
    championshipId: string,
  ): Promise<RoundWithMatches[]> {
    return this.drizzle.runInTenantContext(async (tx) => {
      const roundRows = await tx<RoundRow[]>`
        SELECT * FROM rounds
        WHERE championship_id = ${championshipId}
        ORDER BY number ASC
      `
      const matchRows = await tx<MatchRow[]>`
        SELECT * FROM matches
        WHERE championship_id = ${championshipId}
        ORDER BY bracket_slot ASC NULLS LAST, created_at ASC
      `

      const matchesByRound = new Map<string, MatchStubEntity[]>()
      for (const m of matchRows) {
        const list = matchesByRound.get(m.round_id) ?? []
        list.push(this.toMatchEntity(m))
        matchesByRound.set(m.round_id, list)
      }

      return roundRows.map((r) => ({
        round: this.toRoundEntity(r),
        matches: matchesByRound.get(r.id) ?? [],
      }))
    })
  }

  private toRoundEntity(row: RoundRow): RoundEntity {
    return new RoundEntity(
      row.id,
      row.championship_id,
      row.number,
      row.name,
      row.phase as RoundPhase,
      row.group_id,
      row.created_at,
    )
  }

  private toMatchEntity(row: MatchRow): MatchStubEntity {
    return new MatchStubEntity(
      row.id,
      row.championship_id,
      row.round_id,
      row.home_team_id,
      row.away_team_id,
      row.group_id,
      row.bracket_slot,
      row.status as MatchStatus,
      row.created_at,
    )
  }
}
