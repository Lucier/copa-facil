import { UserRole } from '../../../auth/domain/roles.enum'
import { InvitationEntity } from '../entities/invitation.entity'
import { InvitationStatus } from '../enums/invitation-status.enum'

export const INVITATION_REPOSITORY = 'IInvitationRepository'

export interface CreateInvitationData {
  orgId: string
  email: string
  role: UserRole
  token: string
  invitedBy: string
  expiresAt: Date
}

export interface IInvitationRepository {
  create(data: CreateInvitationData): Promise<InvitationEntity>
  findById(id: string): Promise<InvitationEntity | null>
  findByToken(token: string): Promise<InvitationEntity | null>
  findByOrgId(orgId: string, status?: InvitationStatus): Promise<InvitationEntity[]>
  findActiveByEmail(orgId: string, email: string): Promise<InvitationEntity | null>
  updateStatus(id: string, status: InvitationStatus): Promise<void>
}
