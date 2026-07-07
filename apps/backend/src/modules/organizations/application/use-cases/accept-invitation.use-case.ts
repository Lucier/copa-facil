import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { JwtPayload } from '../../../auth/application/jwt-payload.interface'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { InvitationStatus } from '../../domain/enums/invitation-status.enum'
import {
  IInvitationRepository} from '../../domain/repositories/i-invitation.repository'
import {
  INVITATION_REPOSITORY,
} from '../../domain/repositories/i-invitation.repository'
import {
  IMemberMgmtRepository} from '../../domain/repositories/i-member-mgmt.repository'
import {
  MEMBER_MGMT_REPOSITORY,
} from '../../domain/repositories/i-member-mgmt.repository'
import {
  IOrganizationMgmtRepository} from '../../domain/repositories/i-org-mgmt.repository'
import {
  ORG_MGMT_REPOSITORY,
} from '../../domain/repositories/i-org-mgmt.repository'

@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepo: IInvitationRepository,
    @Inject(ORG_MGMT_REPOSITORY)
    private readonly orgRepo: IOrganizationMgmtRepository,
    @Inject(MEMBER_MGMT_REPOSITORY)
    private readonly memberRepo: IMemberMgmtRepository,
  ) {}

  async execute(token: string, currentUser: JwtPayload): Promise<void> {
    const invitation = await this.invitationRepo.findByToken(token)
    if (!invitation) throw new NotFoundException('Invitation not found')

    if (!invitation.isPending()) {
      throw new BadRequestException('Invitation is no longer valid')
    }

    if (invitation.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new ForbiddenException('This invitation was not sent to your account')
    }

    const org = await this.orgRepo.findById(invitation.orgId)
    if (!org) throw new NotFoundException('Organization not found')

    await TenantContext.run(org.schemaName, async () => {
      const existing = await this.memberRepo.findByUserId(currentUser.sub)
      if (existing) {
        throw new BadRequestException('You are already a member of this organization')
      }
      await this.memberRepo.create(currentUser.sub, invitation.role)
    })

    await this.invitationRepo.updateStatus(invitation.id, InvitationStatus.ACCEPTED)
  }
}
