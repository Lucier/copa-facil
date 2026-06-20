export const ORGANIZATION_REPOSITORY = 'IOrganizationRepository'

export interface CreateOrganizationData {
  name: string
  slug: string
  schemaName: string
}

export interface OrganizationRecord {
  id: string
  name: string
  slug: string
  schemaName: string
}

export interface IOrganizationRepository {
  create(data: CreateOrganizationData): Promise<OrganizationRecord>
  existsBySlug(slug: string): Promise<boolean>
}
