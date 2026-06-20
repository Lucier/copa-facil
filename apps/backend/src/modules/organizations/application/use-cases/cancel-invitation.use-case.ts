import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { InvitationStatus } from '../../domain/enums/invitation-status.enum'
import {
  IInvitationRepository,
  INVITATION_REPOSITORY,
} from '../../domain/repositories/i-invitation.repository'
import {
  IOrganizationMgmtRepository,
  ORG_MGMT_REPOSITORY,
} from '../../domain/repositories/i-org-mgmt.repository'

@Injectable()
export class CancelInvitationUseCase {
  constructor(
    @Inject(ORG_MGMT_REPOSITORY)
    private readonly orgRepo: IOrganizationMgmtRepository,
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepo: IInvitationRepository,
  ) {}

  async execute(invitationId: string): Promise<void> {
    const schemaName = TenantContext.getSchema()
    const org = await this.orgRepo.findBySchemaName(schemaName)
    if (!org) throw new NotFoundException('Organization not found')

    const invitation = await this.invitationRepo.findById(invitationId)
    if (!invitation) throw new NotFoundException('Invitation not found')

    if (invitation.orgId !== org.id) {
      throw new NotFoundException('Invitation not found')
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be cancelled')
    }

    await this.invitationRepo.updateStatus(invitationId, InvitationStatus.CANCELLED)
  }
}
