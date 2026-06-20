import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { JwtPayload } from '../../../auth/application/jwt-payload.interface'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { InvitationEntity } from '../../domain/entities/invitation.entity'
import {
  IInvitationRepository,
  INVITATION_REPOSITORY,
} from '../../domain/repositories/i-invitation.repository'
import {
  IOrganizationMgmtRepository,
  ORG_MGMT_REPOSITORY,
} from '../../domain/repositories/i-org-mgmt.repository'
import { InviteMemberDto } from '../dtos/invite-member.dto'

const INVITE_TTL_DAYS = 7

@Injectable()
export class InviteMemberUseCase {
  constructor(
    @Inject(ORG_MGMT_REPOSITORY)
    private readonly orgRepo: IOrganizationMgmtRepository,
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepo: IInvitationRepository,
  ) {}

  async execute(dto: InviteMemberDto, currentUser: JwtPayload): Promise<InvitationEntity> {
    const schemaName = TenantContext.getSchema()
    const org = await this.orgRepo.findBySchemaName(schemaName)
    if (!org) throw new NotFoundException('Organization not found')

    const existing = await this.invitationRepo.findActiveByEmail(org.id, dto.email)
    if (existing) {
      throw new ConflictException('An active invitation already exists for this email')
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS)

    // TODO: dispatch invitation email via NotificationsModule
    return this.invitationRepo.create({
      orgId: org.id,
      email: dto.email,
      role: dto.role,
      token,
      invitedBy: currentUser.sub,
      expiresAt,
    })
  }
}
