import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { SuspensionEntity } from '../../domain/entities/suspension.entity'
import { SuspensionSource, SuspensionStatus } from '../../domain/enums'
import {
  CreateSuspensionData,
  ISuspensionRepository,
  UpdateSuspensionData,
} from '../../domain/repositories/i-suspension.repository'

interface SuspensionRow {
  id: string
  championship_id: string
  player_id: string
  team_id: string
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

function toEntity(row: SuspensionRow): SuspensionEntity {
  return new SuspensionEntity(
    row.id,
    row.championship_id,
    row.player_id,
    row.team_id,
    row.reason,
    row.source as SuspensionSource,
    row.matches_to_serve,
    row.matches_served,
    row.status as SuspensionStatus,
    row.event_id,
    row.notes,
    row.created_at,
    row.updated_at,
  )
}

@Injectable()
export class DrizzleSuspensionRepository implements ISuspensionRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByChampionshipId(championshipId: string): Promise<SuspensionEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<SuspensionRow[]>`
        SELECT * FROM suspensions
        WHERE championship_id = ${championshipId}
        ORDER BY created_at DESC
      `,
    )
    return rows.map(toEntity)
  }

  async findByPlayer(playerId: string, championshipId: string): Promise<SuspensionEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<SuspensionRow[]>`
        SELECT * FROM suspensions
        WHERE player_id = ${playerId} AND championship_id = ${championshipId}
        ORDER BY created_at DESC
      `,
    )
    return rows.map(toEntity)
  }

  async findActiveByPlayer(playerId: string, championshipId: string): Promise<SuspensionEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<SuspensionRow[]>`
        SELECT * FROM suspensions
        WHERE player_id = ${playerId}
          AND championship_id = ${championshipId}
          AND status = 'ativa'
        ORDER BY created_at DESC
      `,
    )
    return rows.map(toEntity)
  }

  async findByEventId(eventId: string): Promise<SuspensionEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<SuspensionRow[]>`
        SELECT * FROM suspensions WHERE event_id = ${eventId} LIMIT 1
      `,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findById(id: string): Promise<SuspensionEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<SuspensionRow[]>`SELECT * FROM suspensions WHERE id = ${id} LIMIT 1`,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async create(data: CreateSuspensionData): Promise<SuspensionEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<SuspensionRow[]>`
        INSERT INTO suspensions (
          championship_id, player_id, team_id, reason, source,
          matches_to_serve, event_id, notes
        ) VALUES (
          ${data.championshipId}, ${data.playerId}, ${data.teamId},
          ${data.reason}, ${data.source}, ${data.matchesToServe},
          ${data.eventId ?? null}, ${data.notes ?? null}
        )
        RETURNING *
      `,
    )
    return toEntity(rows[0])
  }

  async update(id: string, data: UpdateSuspensionData): Promise<SuspensionEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<SuspensionRow[]>`
        UPDATE suspensions SET
          matches_served = CASE WHEN ${data.matchesServed ?? null} IS NOT NULL
                               THEN ${data.matchesServed ?? null}::integer
                               ELSE matches_served END,
          status         = CASE WHEN ${data.status ?? null} IS NOT NULL
                               THEN ${data.status ?? null}
                               ELSE status END,
          notes          = CASE WHEN ${data.notes !== undefined ? true : false}
                               THEN ${data.notes ?? null}
                               ELSE notes END,
          updated_at     = NOW()
        WHERE id = ${id}
        RETURNING *
      `,
    )
    return toEntity(rows[0])
  }
}
