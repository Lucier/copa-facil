import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { MatchLineupEntity } from '../../domain/entities/match-lineup.entity'
import { CreateLineupData, ILineupRepository } from '../../domain/repositories/i-lineup.repository'

interface LineupRow {
  id: string
  match_id: string
  team_id: string
  player_id: string
  jersey_number: number | null
  position: string | null
  is_starter: boolean
  is_captain: boolean
  added_at: Date
}

function toEntity(row: LineupRow): MatchLineupEntity {
  return new MatchLineupEntity(
    row.id,
    row.match_id,
    row.team_id,
    row.player_id,
    row.jersey_number,
    row.position,
    row.is_starter,
    row.is_captain,
    row.added_at,
  )
}

@Injectable()
export class DrizzleLineupRepository implements ILineupRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByMatchId(matchId: string): Promise<MatchLineupEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<LineupRow[]>`
        SELECT id, match_id, team_id, player_id, jersey_number, position,
               is_starter, is_captain, added_at
        FROM match_lineups WHERE match_id = ${matchId}
        ORDER BY team_id, is_starter DESC, jersey_number ASC
      `
    })
    return rows.map(toEntity)
  }

  async findById(id: string): Promise<MatchLineupEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<LineupRow[]>`
        SELECT id, match_id, team_id, player_id, jersey_number, position,
               is_starter, is_captain, added_at
        FROM match_lineups WHERE id = ${id} LIMIT 1
      `
    })
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findByMatchAndPlayer(matchId: string, playerId: string): Promise<MatchLineupEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<LineupRow[]>`
        SELECT id, match_id, team_id, player_id, jersey_number, position,
               is_starter, is_captain, added_at
        FROM match_lineups WHERE match_id = ${matchId} AND player_id = ${playerId} LIMIT 1
      `
    })
    return rows[0] ? toEntity(rows[0]) : null
  }

  async create(data: CreateLineupData): Promise<MatchLineupEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<LineupRow[]>`
        INSERT INTO match_lineups (match_id, team_id, player_id, jersey_number, position, is_starter, is_captain)
        VALUES (
          ${data.matchId},
          ${data.teamId},
          ${data.playerId},
          ${data.jerseyNumber ?? null},
          ${data.position ?? null},
          ${data.isStarter ?? true},
          ${data.isCaptain ?? false}
        )
        RETURNING id, match_id, team_id, player_id, jersey_number, position,
                  is_starter, is_captain, added_at
      `
    })
    return toEntity(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      return tx`DELETE FROM match_lineups WHERE id = ${id}`
    })
  }
}
