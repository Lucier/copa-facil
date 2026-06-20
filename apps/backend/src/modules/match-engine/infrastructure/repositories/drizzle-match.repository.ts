import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { MatchStatus } from '../../../championships/domain/enums'
import { MatchEntity } from '../../domain/entities/match.entity'
import { IMatchRepository } from '../../domain/repositories/i-match.repository'

interface MatchRow {
  id: string
  championship_id: string
  round_id: string
  home_team_id: string | null
  away_team_id: string | null
  group_id: string | null
  bracket_slot: number | null
  status: string
  home_score: number
  away_score: number
  scheduled_at: Date | null
  started_at: Date | null
  ended_at: Date | null
  created_at: Date
}

function toEntity(row: MatchRow): MatchEntity {
  return new MatchEntity(
    row.id,
    row.championship_id,
    row.round_id,
    row.home_team_id,
    row.away_team_id,
    row.group_id,
    row.bracket_slot,
    row.status as MatchStatus,
    row.home_score,
    row.away_score,
    row.scheduled_at,
    row.started_at,
    row.ended_at,
    row.created_at,
  )
}

const SELECT = `
  id, championship_id, round_id, home_team_id, away_team_id, group_id,
  bracket_slot, status, home_score, away_score,
  scheduled_at, started_at, ended_at, created_at
`

@Injectable()
export class DrizzleMatchRepository implements IMatchRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<MatchEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MatchRow[]>`
        SELECT ${tx(SELECT.split(',').map((c) => c.trim()).filter(Boolean))}
        FROM matches WHERE id = ${id} LIMIT 1
      `
    })
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findByChampionshipId(championshipId: string): Promise<MatchEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MatchRow[]>`
        SELECT id, championship_id, round_id, home_team_id, away_team_id, group_id,
               bracket_slot, status, home_score, away_score,
               scheduled_at, started_at, ended_at, created_at
        FROM matches WHERE championship_id = ${championshipId}
        ORDER BY created_at ASC
      `
    })
    return rows.map(toEntity)
  }

  async findFinishedByChampionshipId(championshipId: string): Promise<MatchEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MatchRow[]>`
        SELECT id, championship_id, round_id, home_team_id, away_team_id, group_id,
               bracket_slot, status, home_score, away_score,
               scheduled_at, started_at, ended_at, created_at
        FROM matches
        WHERE championship_id = ${championshipId} AND status = 'finished'
        ORDER BY ended_at ASC
      `
    })
    return rows.map(toEntity)
  }

  async updateStatus(
    id: string,
    status: MatchStatus,
    timestamps?: { startedAt?: Date; endedAt?: Date },
  ): Promise<MatchEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MatchRow[]>`
        UPDATE matches SET
          status     = ${status},
          started_at = CASE WHEN ${timestamps?.startedAt?.toISOString() ?? null} IS NOT NULL THEN ${timestamps?.startedAt?.toISOString() ?? null} ELSE started_at END,
          ended_at   = CASE WHEN ${timestamps?.endedAt?.toISOString() ?? null} IS NOT NULL THEN ${timestamps?.endedAt?.toISOString() ?? null} ELSE ended_at END
        WHERE id = ${id}
        RETURNING id, championship_id, round_id, home_team_id, away_team_id, group_id,
                  bracket_slot, status, home_score, away_score,
                  scheduled_at, started_at, ended_at, created_at
      `
    })
    return toEntity(rows[0])
  }

  async updateScore(id: string, homeScore: number, awayScore: number): Promise<MatchEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MatchRow[]>`
        UPDATE matches SET home_score = ${homeScore}, away_score = ${awayScore}
        WHERE id = ${id}
        RETURNING id, championship_id, round_id, home_team_id, away_team_id, group_id,
                  bracket_slot, status, home_score, away_score,
                  scheduled_at, started_at, ended_at, created_at
      `
    })
    return toEntity(rows[0])
  }
}
