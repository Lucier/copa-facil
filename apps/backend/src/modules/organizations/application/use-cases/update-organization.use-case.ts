import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { OrganizationEntity } from '../../domain/entities/organization.entity'
import {
  IOrganizationMgmtRepository,
  ORG_MGMT_REPOSITORY,
} from '../../domain/repositories/i-org-mgmt.repository'
import { UpdateOrganizationDto } from '../dtos/update-organization.dto'

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(ORG_MGMT_REPOSITORY)
    private readonly orgRepo: IOrganizationMgmtRepository,
  ) {}

  async execute(dto: UpdateOrganizationDto): Promise<OrganizationEntity> {
    const schemaName = TenantContext.getSchema()
    const org = await this.orgRepo.findBySchemaName(schemaName)
    if (!org) throw new NotFoundException('Organization not found')
    return this.orgRepo.update(org.id, { name: dto.name })
  }
}
