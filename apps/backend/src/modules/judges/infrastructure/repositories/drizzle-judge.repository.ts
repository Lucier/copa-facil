import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { JudgeEntity } from '../../domain/entities/judge.entity'
import { JudgeRole, LicenseCategory } from '../../domain/enums'
import {
  CreateJudgeData,
  IJudgeRepository,
  UpdateJudgeData,
} from '../../domain/repositories/i-judge.repository'

interface JudgeRow {
  id: string
  full_name: string
  document: string | null
  license_number: string | null
  license_category: string | null
  role: string
  phone: string | null
  email: string | null
  photo_url: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

function toEntity(row: JudgeRow): JudgeEntity {
  return new JudgeEntity(
    row.id,
    row.full_name,
    row.document,
    row.license_number,
    row.license_category as LicenseCategory | null,
    row.role as JudgeRole,
    row.phone,
    row.email,
    row.photo_url,
    row.is_active,
    row.created_at,
    row.updated_at,
  )
}

@Injectable()
export class DrizzleJudgeRepository implements IJudgeRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(): Promise<JudgeEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<JudgeRow[]>`
        SELECT id, full_name, document, license_number, license_category, role,
               phone, email, photo_url, is_active, created_at, updated_at
        FROM judges
        ORDER BY full_name ASC
      `
    })
    return rows.map(toEntity)
  }

  async findById(id: string): Promise<JudgeEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<JudgeRow[]>`
        SELECT id, full_name, document, license_number, license_category, role,
               phone, email, photo_url, is_active, created_at, updated_at
        FROM judges WHERE id = ${id} LIMIT 1
      `
    })
    return rows[0] ? toEntity(rows[0]) : null
  }

  async create(data: CreateJudgeData): Promise<JudgeEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<JudgeRow[]>`
        INSERT INTO judges (full_name, document, license_number, license_category, role, phone, email, photo_url)
        VALUES (
          ${data.fullName},
          ${data.document ?? null},
          ${data.licenseNumber ?? null},
          ${data.licenseCategory ?? null},
          ${data.role},
          ${data.phone ?? null},
          ${data.email ?? null},
          ${data.photoUrl ?? null}
        )
        RETURNING id, full_name, document, license_number, license_category, role,
                  phone, email, photo_url, is_active, created_at, updated_at
      `
    })
    return toEntity(rows[0])
  }

  async update(id: string, data: UpdateJudgeData): Promise<JudgeEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<JudgeRow[]>`
        UPDATE judges SET
          full_name        = COALESCE(${data.fullName ?? null}, full_name),
          document         = CASE WHEN ${data.document !== undefined} THEN ${data.document ?? null} ELSE document END,
          license_number   = CASE WHEN ${data.licenseNumber !== undefined} THEN ${data.licenseNumber ?? null} ELSE license_number END,
          license_category = CASE WHEN ${data.licenseCategory !== undefined} THEN ${data.licenseCategory ?? null} ELSE license_category END,
          role             = COALESCE(${data.role ?? null}, role),
          phone            = CASE WHEN ${data.phone !== undefined} THEN ${data.phone ?? null} ELSE phone END,
          email            = CASE WHEN ${data.email !== undefined} THEN ${data.email ?? null} ELSE email END,
          photo_url        = CASE WHEN ${data.photoUrl !== undefined} THEN ${data.photoUrl ?? null} ELSE photo_url END,
          is_active        = COALESCE(${data.isActive ?? null}, is_active),
          updated_at       = NOW()
        WHERE id = ${id}
        RETURNING id, full_name, document, license_number, license_category, role,
                  phone, email, photo_url, is_active, created_at, updated_at
      `
    })
    return toEntity(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`DELETE FROM judges WHERE id = ${id}`
    })
  }
}
