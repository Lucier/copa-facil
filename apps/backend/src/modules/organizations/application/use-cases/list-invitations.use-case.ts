import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { InvitationEntity } from '../../domain/entities/invitation.entity'
import { InvitationStatus } from '../../domain/enums/invitation-status.enum'
import {
  IInvitationRepository} from '../../domain/repositories/i-invitation.repository'
import {
  INVITATION_REPOSITORY,
} from '../../domain/repositories/i-invitation.repository'
import {
  IOrganizationMgmtRepository} from '../../domain/repositories/i-org-mgmt.repository'
import {
  ORG_MGMT_REPOSITORY,
} from '../../domain/repositories/i-org-mgmt.repository'

@Injectable()
export class ListInvitationsUseCase {
  constructor(
    @Inject(ORG_MGMT_REPOSITORY)
    private readonly orgRepo: IOrganizationMgmtRepository,
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepo: IInvitationRepository,
  ) {}

  async execute(): Promise<InvitationEntity[]> {
    const schemaName = TenantContext.getSchema()
    const org = await this.orgRepo.findBySchemaName(schemaName)
    if (!org) throw new NotFoundException('Organization not found')
    return this.invitationRepo.findByOrgId(org.id, InvitationStatus.PENDING)
  }
}
