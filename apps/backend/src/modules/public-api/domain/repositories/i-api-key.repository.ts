export interface ApiKeyLookup {
  id: string
  organizationId: string
  organizationSlug: string
  schemaName: string
  name: string
  isActive: boolean
}

export const API_KEY_REPOSITORY = 'IApiKeyRepository'

export interface IApiKeyRepository {
  findByKeyHash(hash: string): Promise<ApiKeyLookup | null>
  updateLastUsedAt(id: string): Promise<void>
}
