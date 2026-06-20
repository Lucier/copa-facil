import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { RegistrationRequestEntity } from '../../domain/entities/registration-request.entity'
import { RegistrationStatus } from '../../domain/enums'
import {
  CreateRegistrationData,
  IRegistrationRepository,
} from '../../domain/repositories/i-registration.repository'

interface RegRow {
  id: string
  championship_id: string
  team_id: string
  status: string
  submitted_by: string
  reviewed_by: string | null
  review_note: string | null
  submitted_at: Date
  reviewed_at: Date | null
}

function toEntity(r: RegRow): RegistrationRequestEntity {
  return new RegistrationRequestEntity(
    r.id, r.championship_id, r.team_id, r.status as RegistrationStatus,
    r.submitted_by, r.reviewed_by, r.review_note, r.submitted_at, r.reviewed_at,
  )
}

const COLS = `id, championship_id, team_id, status, submitted_by, reviewed_by, review_note, submitted_at, reviewed_at`

@Injectable()
export class DrizzleRegistrationRepository implements IRegistrationRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<RegistrationRequestEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<RegRow[]>`SELECT ${tx(COLS.split(',').map((c) => c.trim()))} FROM registration_requests WHERE id = ${id} LIMIT 1`,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findByChampionshipId(championshipId: string): Promise<RegistrationRequestEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<RegRow[]>`SELECT id, championship_id, team_id, status, submitted_by, reviewed_by, review_note, submitted_at, reviewed_at FROM registration_requests WHERE championship_id = ${championshipId} ORDER BY submitted_at DESC`,
    )
    return rows.map(toEntity)
  }

  async findByTeamAndChampionship(teamId: string, championshipId: string): Promise<RegistrationRequestEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<RegRow[]>`SELECT id, championship_id, team_id, status, submitted_by, reviewed_by, review_note, submitted_at, reviewed_at FROM registration_requests WHERE team_id = ${teamId} AND championship_id = ${championshipId} ORDER BY submitted_at DESC LIMIT 1`,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async create(data: CreateRegistrationData): Promise<RegistrationRequestEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<RegRow[]>`
        INSERT INTO registration_requests (championship_id, team_id, submitted_by)
        VALUES (${data.championshipId}, ${data.teamId}, ${data.submittedBy})
        RETURNING id, championship_id, team_id, status, submitted_by, reviewed_by, review_note, submitted_at, reviewed_at
      `,
    )
    return toEntity(rows[0])
  }

  async updateStatus(
    id: string,
    status: RegistrationStatus,
    reviewedBy: string,
    reviewNote?: string | null,
  ): Promise<RegistrationRequestEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<RegRow[]>`
        UPDATE registration_requests SET
          status      = ${status},
          reviewed_by = ${reviewedBy},
          review_note = ${reviewNote ?? null},
          reviewed_at = NOW()
        WHERE id = ${id}
        RETURNING id, championship_id, team_id, status, submitted_by, reviewed_by, review_note, submitted_at, reviewed_at
      `,
    )
    return toEntity(rows[0])
  }
}
