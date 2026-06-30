import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { MatchAdminDto } from '../dtos/match-admin.dto'

interface MatchAdminRow {
  id: string
  status: string
  home_team_id: string | null
  away_team_id: string | null
  home_team_name: string | null
  home_team_acronym: string | null
  away_team_name: string | null
  away_team_acronym: string | null
  home_score: number
  away_score: number
  scheduled_at: Date | string | null
  started_at: Date | string | null
  ended_at: Date | string | null
  round_id: string
  round_number: number
  round_name: string
  round_phase: string
  group_id: string | null
  bracket_slot: number | null
  is_bye: boolean
}

function toIso(v: Date | string | null | undefined): string | null {
  if (v == null) return null
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString()
}

@Injectable()
export class ListMatchesForAdminUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(championshipId: string): Promise<MatchAdminDto[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MatchAdminRow[]>`
        SELECT
          m.id,
          m.status,
          m.home_team_id,
          m.away_team_id,
          m.home_score,
          m.away_score,
          m.scheduled_at,
          m.started_at,
          m.ended_at,
          m.group_id,
          m.bracket_slot,
          (m.home_team_id IS NULL OR m.away_team_id IS NULL) AS is_bye,
          r.id   AS round_id,
          r.number AS round_number,
          r.name AS round_name,
          r.phase AS round_phase,
          ht.name    AS home_team_name,
          ht.acronym AS home_team_acronym,
          at.name    AS away_team_name,
          at.acronym AS away_team_acronym
        FROM matches m
        JOIN rounds r ON r.id = m.round_id
        LEFT JOIN teams ht ON ht.id = m.home_team_id
        LEFT JOIN teams at ON at.id = m.away_team_id
        WHERE r.championship_id = ${championshipId}
        ORDER BY r.number ASC, m.bracket_slot ASC NULLS LAST, m.id ASC
      `
    })

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      homeTeamName: row.home_team_name,
      homeTeamAcronym: row.home_team_acronym,
      awayTeamName: row.away_team_name,
      awayTeamAcronym: row.away_team_acronym,
      homeScore: row.home_score,
      awayScore: row.away_score,
      scheduledAt: toIso(row.scheduled_at),
      startedAt: toIso(row.started_at),
      endedAt: toIso(row.ended_at),
      roundId: row.round_id,
      roundNumber: row.round_number,
      roundName: row.round_name,
      roundPhase: row.round_phase,
      groupId: row.group_id,
      bracketSlot: row.bracket_slot,
      isBye: row.is_bye,
    }))
  }
}
