import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { MemberEntity } from '../../domain/entities/member.entity'
import {
  CreateMemberData,
  IMembershipRepository,
} from '../../domain/repositories/i-membership.repository'
import { TenantMemberMapper } from '../../application/mappers/tenant-member.mapper'

interface MemberRow {
  id: string
  user_id: string
  role: string
  is_active: boolean
  joined_at: Date
}

@Injectable()
export class DrizzleMembershipRepository implements IMembershipRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByUserId(userId: string): Promise<MemberEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MemberRow[]>`
        SELECT id, user_id, role, is_active, joined_at
        FROM memberships
        WHERE user_id = ${userId} AND is_active = true
        LIMIT 1
      `
    })
    return rows[0] ? TenantMemberMapper.toDomain(rows[0]) : null
  }

  async create(data: CreateMemberData): Promise<MemberEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MemberRow[]>`
        INSERT INTO memberships (user_id, role, is_active)
        VALUES (${data.userId}, ${data.role}, true)
        RETURNING id, user_id, role, is_active, joined_at
      `
    })
    return TenantMemberMapper.toDomain(rows[0])
  }
}
