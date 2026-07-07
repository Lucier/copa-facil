import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { StaffMemberEntity } from '../../domain/entities/staff-member.entity'
import {
  CreateStaffData,
  IStaffRepository,
  UpdateStaffData,
} from '../../domain/repositories/i-staff.repository'
import { StaffRow } from '../../application/mappers/staff.mapper'
import { StaffMapper } from '../../application/mappers/staff.mapper'

@Injectable()
export class DrizzleStaffRepository implements IStaffRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<StaffMemberEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<StaffRow[]>`
        SELECT id, team_id, full_name, document, license_number, role, created_at, updated_at
        FROM staff_members
        WHERE id = ${id}
        LIMIT 1
      `
    })
    return rows[0] ? StaffMapper.toEntity(rows[0]) : null
  }

  async findByTeamId(teamId: string): Promise<StaffMemberEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<StaffRow[]>`
        SELECT id, team_id, full_name, document, license_number, role, created_at, updated_at
        FROM staff_members
        WHERE team_id = ${teamId}
        ORDER BY full_name ASC
      `
    })
    return rows.map(StaffMapper.toEntity)
  }

  async create(data: CreateStaffData): Promise<StaffMemberEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<StaffRow[]>`
        INSERT INTO staff_members (team_id, full_name, document, license_number, role)
        VALUES (
          ${data.teamId},
          ${data.fullName},
          ${data.document ?? null},
          ${data.licenseNumber ?? null},
          ${data.role ?? 'auxiliar'}
        )
        RETURNING id, team_id, full_name, document, license_number, role, created_at, updated_at
      `
    })
    return StaffMapper.toEntity(rows[0])
  }

  async update(id: string, data: UpdateStaffData): Promise<StaffMemberEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<StaffRow[]>`
        UPDATE staff_members SET
          full_name      = COALESCE(${data.fullName ?? null}, full_name),
          document       = CASE WHEN ${data.document !== undefined} THEN ${data.document ?? null} ELSE document END,
          license_number = CASE WHEN ${data.licenseNumber !== undefined} THEN ${data.licenseNumber ?? null} ELSE license_number END,
          role           = COALESCE(${data.role ?? null}, role),
          updated_at     = NOW()
        WHERE id = ${id}
        RETURNING id, team_id, full_name, document, license_number, role, created_at, updated_at
      `
    })
    return StaffMapper.toEntity(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`DELETE FROM staff_members WHERE id = ${id}`
    })
  }
}
