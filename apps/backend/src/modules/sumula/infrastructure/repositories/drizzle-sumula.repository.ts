import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { SumulaEntity } from '../../domain/entities/sumula.entity'
import { SumulaStatus } from '../../domain/enums'
import {
  CreateSumulaData,
  ISumulaRepository,
  UpdateSumulaData,
} from '../../domain/repositories/i-sumula.repository'

interface SumulaRow {
  id: string
  match_id: string
  championship_id: string
  venue: string | null
  observations: string | null
  status: string
  closed_at: Date | null
  closed_by: string | null
  integrity_hash: string | null
  created_at: Date
  updated_at: Date
}

function toEntity(row: SumulaRow): SumulaEntity {
  return new SumulaEntity(
    row.id,
    row.match_id,
    row.championship_id,
    row.venue,
    row.observations,
    row.status as SumulaStatus,
    row.closed_at,
    row.closed_by,
    row.integrity_hash,
    row.created_at,
    row.updated_at,
  )
}

const RETURNING = `id, match_id, championship_id, venue, observations, status,
                   closed_at, closed_by, integrity_hash, created_at, updated_at`

@Injectable()
export class DrizzleSumulaRepository implements ISumulaRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByMatchId(matchId: string): Promise<SumulaEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<SumulaRow[]>`
        SELECT ${tx(RETURNING.split(',').map((c) => c.trim()).filter(Boolean))}
        FROM sumulas WHERE match_id = ${matchId} LIMIT 1
      `
    })
    return rows[0] ? toEntity(rows[0]) : null
  }

  async create(data: CreateSumulaData): Promise<SumulaEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<SumulaRow[]>`
        INSERT INTO sumulas (match_id, championship_id, venue)
        VALUES (${data.matchId}, ${data.championshipId}, ${data.venue ?? null})
        RETURNING id, match_id, championship_id, venue, observations, status,
                  closed_at, closed_by, integrity_hash, created_at, updated_at
      `
    })
    return toEntity(rows[0])
  }

  async update(id: string, data: UpdateSumulaData): Promise<SumulaEntity> {
    const obs = data.observations ?? null
    const closedAt = data.closedAt?.toISOString() ?? null
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<SumulaRow[]>`
        UPDATE sumulas SET
          venue          = CASE WHEN ${data.venue ?? null} IS NOT NULL THEN ${data.venue ?? null} ELSE venue END,
          observations   = CASE WHEN ${obs} IS NOT NULL THEN ${obs} ELSE observations END,
          status         = CASE WHEN ${data.status ?? null} IS NOT NULL THEN ${data.status ?? null} ELSE status END,
          closed_at      = CASE WHEN ${closedAt} IS NOT NULL THEN ${closedAt} ELSE closed_at END,
          closed_by      = CASE WHEN ${data.closedBy ?? null} IS NOT NULL THEN ${data.closedBy ?? null} ELSE closed_by END,
          integrity_hash = CASE WHEN ${data.integrityHash ?? null} IS NOT NULL THEN ${data.integrityHash ?? null} ELSE integrity_hash END,
          updated_at     = NOW()
        WHERE id = ${id}
        RETURNING id, match_id, championship_id, venue, observations, status,
                  closed_at, closed_by, integrity_hash, created_at, updated_at
      `
    })
    return toEntity(rows[0])
  }
}
