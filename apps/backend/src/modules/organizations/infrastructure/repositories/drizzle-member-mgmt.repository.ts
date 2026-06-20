import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { UserRole } from '../../../auth/domain/roles.enum'
import {
  IMemberMgmtRepository,
  MemberWithUser,
} from '../../domain/repositories/i-member-mgmt.repository'

interface MemberRow {
  id: string
  user_id: string
  role: string
  is_active: boolean
  joined_at: Date
  user_name: string
  user_email: string
}

function toMemberWithUser(row: MemberRow): MemberWithUser {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role as UserRole,
    isActive: row.is_active,
    joinedAt: row.joined_at,
    user: {
      name: row.user_name,
      email: row.user_email,
    },
  }
}

@Injectable()
export class DrizzleMemberMgmtRepository implements IMemberMgmtRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async listActive(): Promise<MemberWithUser[]> {
    return this.drizzle.runInTenantContext(async (tx) => {
      const rows = await tx<MemberRow[]>`
        SELECT m.id, m.user_id, m.role, m.is_active, m.joined_at,
               u.name AS user_name, u.email AS user_email
        FROM memberships m
        JOIN public.users u ON u.id = m.user_id
        WHERE m.is_active = true
        ORDER BY m.joined_at ASC
      `
      return rows.map(toMemberWithUser)
    })
  }

  async findById(memberId: string): Promise<MemberWithUser | null> {
    return this.drizzle.runInTenantContext(async (tx) => {
      const rows = await tx<MemberRow[]>`
        SELECT m.id, m.user_id, m.role, m.is_active, m.joined_at,
               u.name AS user_name, u.email AS user_email
        FROM memberships m
        JOIN public.users u ON u.id = m.user_id
        WHERE m.id = ${memberId}
        LIMIT 1
      `
      return rows[0] ? toMemberWithUser(rows[0]) : null
    })
  }

  async findByUserId(userId: string): Promise<{ id: string; role: UserRole } | null> {
    return this.drizzle.runInTenantContext(async (tx) => {
      const rows = await tx<{ id: string; role: string }[]>`
        SELECT id, role FROM memberships
        WHERE user_id = ${userId} AND is_active = true
        LIMIT 1
      `
      if (!rows[0]) return null
      return { id: rows[0].id, role: rows[0].role as UserRole }
    })
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.drizzle.runInTenantContext(async (tx) => {
      const rows = await tx<{ count: string }[]>`
        SELECT COUNT(*)::text AS count FROM memberships
        WHERE role = ${role} AND is_active = true
      `
      return parseInt(rows[0]?.count ?? '0', 10)
    })
  }

  async updateRole(memberId: string, role: UserRole): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`
        UPDATE memberships SET role = ${role}
        WHERE id = ${memberId}
      `
    })
  }

  async deactivate(memberId: string): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`
        UPDATE memberships SET is_active = false
        WHERE id = ${memberId}
      `
    })
  }

  async create(userId: string, role: UserRole): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`
        INSERT INTO memberships (user_id, role, is_active)
        VALUES (${userId}, ${role}, true)
      `
    })
  }
}
