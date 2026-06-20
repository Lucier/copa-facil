import { Injectable } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DrizzleService } from '../../../../database/drizzle.service'
import { invitations } from '../../../../database/schemas/core.schema'
import { InvitationEntity } from '../../domain/entities/invitation.entity'
import { InvitationStatus } from '../../domain/enums/invitation-status.enum'
import {
  CreateInvitationData,
  IInvitationRepository,
} from '../../domain/repositories/i-invitation.repository'
import { UserRole } from '../../../auth/domain/roles.enum'

function toEntity(row: typeof invitations.$inferSelect): InvitationEntity {
  return new InvitationEntity(
    row.id,
    row.orgId,
    row.email,
    row.role as UserRole,
    row.token,
    row.status as InvitationStatus,
    row.invitedBy,
    row.expiresAt,
    row.createdAt,
  )
}

@Injectable()
export class DrizzleInvitationRepository implements IInvitationRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: CreateInvitationData): Promise<InvitationEntity> {
    const [row] = await this.drizzle.db
      .insert(invitations)
      .values({
        orgId: data.orgId,
        email: data.email,
        role: data.role,
        token: data.token,
        invitedBy: data.invitedBy,
        expiresAt: data.expiresAt,
      })
      .returning()
    return toEntity(row)
  }

  async findById(id: string): Promise<InvitationEntity | null> {
    const rows = await this.drizzle.db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1)
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findByToken(token: string): Promise<InvitationEntity | null> {
    const rows = await this.drizzle.db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1)
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findByOrgId(orgId: string, status?: InvitationStatus): Promise<InvitationEntity[]> {
    const condition = status
      ? and(eq(invitations.orgId, orgId), eq(invitations.status, status))
      : eq(invitations.orgId, orgId)

    const rows = await this.drizzle.db
      .select()
      .from(invitations)
      .where(condition)
    return rows.map(toEntity)
  }

  async findActiveByEmail(orgId: string, email: string): Promise<InvitationEntity | null> {
    const rows = await this.drizzle.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.orgId, orgId),
          eq(invitations.email, email),
          eq(invitations.status, InvitationStatus.PENDING),
        ),
      )
      .limit(1)
    if (!rows[0]) return null
    const entity = toEntity(rows[0])
    return entity.isExpired() ? null : entity
  }

  async updateStatus(id: string, status: InvitationStatus): Promise<void> {
    await this.drizzle.db
      .update(invitations)
      .set({ status })
      .where(eq(invitations.id, id))
  }
}
