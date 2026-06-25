import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'

interface SuspensionRow {
  id: string
  championship_id: string
  player_id: string
  player_name: string | null
  team_id: string
  team_name: string | null
  team_acronym: string | null
  reason: string
  source: string
  matches_to_serve: number
  matches_served: number
  status: string
  event_id: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

export interface SuspensionWithDetailsDto {
  id: string
  championshipId: string
  playerId: string
  playerName: string | null
  teamId: string
  teamName: string | null
  teamAcronym: string | null
  reason: string
  source: string
  matchesToServe: number
  matchesServed: number
  status: string
  eventId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

@Injectable()
export class ListSuspensionsUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(
    championshipId: string,
    statusFilter?: string,
  ): Promise<SuspensionWithDetailsDto[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      if (statusFilter) {
        return tx<SuspensionRow[]>`
          SELECT
            s.*,
            p.full_name AS player_name,
            t.name      AS team_name,
            t.acronym   AS team_acronym
          FROM suspensions s
          LEFT JOIN players p ON p.id = s.player_id
          LEFT JOIN teams   t ON t.id = s.team_id
          WHERE s.championship_id = ${championshipId}
            AND s.status = ${statusFilter}
          ORDER BY s.created_at DESC
        `
      }
      return tx<SuspensionRow[]>`
        SELECT
          s.*,
          p.full_name AS player_name,
          t.name      AS team_name,
          t.acronym   AS team_acronym
        FROM suspensions s
        LEFT JOIN players p ON p.id = s.player_id
        LEFT JOIN teams   t ON t.id = s.team_id
        WHERE s.championship_id = ${championshipId}
        ORDER BY s.created_at DESC
      `
    })

    return rows.map((row) => ({
      id: row.id,
      championshipId: row.championship_id,
      playerId: row.player_id,
      playerName: row.player_name,
      teamId: row.team_id,
      teamName: row.team_name,
      teamAcronym: row.team_acronym,
      reason: row.reason,
      source: row.source,
      matchesToServe: row.matches_to_serve,
      matchesServed: row.matches_served,
      status: row.status,
      eventId: row.event_id,
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))
  }
}
