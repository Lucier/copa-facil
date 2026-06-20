import { UserRole } from '../../../auth/domain/roles.enum'
import { InvitationStatus } from '../enums/invitation-status.enum'

export class InvitationEntity {
  constructor(
    public readonly id: string,
    public readonly orgId: string,
    public readonly email: string,
    public readonly role: UserRole,
    public readonly token: string,
    public readonly status: InvitationStatus,
    public readonly invitedBy: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
  ) {}

  isExpired(): boolean {
    return this.expiresAt < new Date()
  }

  isPending(): boolean {
    return this.status === InvitationStatus.PENDING && !this.isExpired()
  }
}
