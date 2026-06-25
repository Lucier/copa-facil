import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { MatchOfficialEntity } from '../../domain/entities/match-official.entity'
import { OfficialRole } from '../../domain/enums'
import { CreateOfficialData, IOfficialRepository } from '../../domain/repositories/i-official.repository'

interface OfficialRow {
  id: string
  match_id: string
  name: string
  role: string
  license_number: string | null
  created_at: Date
}

function toEntity(row: OfficialRow): MatchOfficialEntity {
  return new MatchOfficialEntity(
    row.id,
    row.match_id,
    row.name,
    row.role as OfficialRole,
    row.license_number,
    row.created_at,
  )
}

@Injectable()
export class DrizzleOfficialRepository implements IOfficialRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByMatchId(matchId: string): Promise<MatchOfficialEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<OfficialRow[]>`
        SELECT id, match_id, name, role, license_number, created_at
        FROM match_officials WHERE match_id = ${matchId}
        ORDER BY created_at ASC
      `
    })
    return rows.map(toEntity)
  }

  async findById(id: string): Promise<MatchOfficialEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<OfficialRow[]>`
        SELECT id, match_id, name, role, license_number, created_at
        FROM match_officials WHERE id = ${id} LIMIT 1
      `
    })
    return rows[0] ? toEntity(rows[0]) : null
  }

  async create(data: CreateOfficialData): Promise<MatchOfficialEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<OfficialRow[]>`
        INSERT INTO match_officials (match_id, name, role, license_number)
        VALUES (${data.matchId}, ${data.name}, ${data.role}, ${data.licenseNumber ?? null})
        RETURNING id, match_id, name, role, license_number, created_at
      `
    })
    return toEntity(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      return tx`DELETE FROM match_officials WHERE id = ${id}`
    })
  }
}
