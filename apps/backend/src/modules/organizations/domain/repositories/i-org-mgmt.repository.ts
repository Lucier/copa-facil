import { OrganizationEntity } from '../entities/organization.entity'

export const ORG_MGMT_REPOSITORY = 'IOrganizationMgmtRepository'

export interface UpdateOrgData {
  name?: string
}

export interface IOrganizationMgmtRepository {
  findBySchemaName(schemaName: string): Promise<OrganizationEntity | null>
  findById(id: string): Promise<OrganizationEntity | null>
  update(id: string, data: UpdateOrgData): Promise<OrganizationEntity>
}
