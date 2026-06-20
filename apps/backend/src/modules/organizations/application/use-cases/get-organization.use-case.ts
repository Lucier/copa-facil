import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { OrganizationEntity } from '../../domain/entities/organization.entity'
import {
  IOrganizationMgmtRepository,
  ORG_MGMT_REPOSITORY,
} from '../../domain/repositories/i-org-mgmt.repository'

@Injectable()
export class GetOrganizationUseCase {
  constructor(
    @Inject(ORG_MGMT_REPOSITORY)
    private readonly orgRepo: IOrganizationMgmtRepository,
  ) {}

  async execute(): Promise<OrganizationEntity> {
    const schemaName = TenantContext.getSchema()
    const org = await this.orgRepo.findBySchemaName(schemaName)
    if (!org) throw new NotFoundException('Organization not found')
    return org
  }
}
