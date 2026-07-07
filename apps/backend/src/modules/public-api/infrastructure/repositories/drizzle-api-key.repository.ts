import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { ApiKeyLookup, IApiKeyRepository } from '../../domain/repositories/i-api-key.repository'
import { API_KEY_REPOSITORY } from '../../domain/repositories/i-api-key.repository'

interface ApiKeyRow {
  id: string
  name: string
  is_active: boolean
  organization_id: string
  organization_slug: string
  schema_name: string
}

@Injectable()
export class DrizzleApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByKeyHash(hash: string): Promise<ApiKeyLookup | null> {
    const rows = await this.drizzle.runRaw((sql) =>
      sql<ApiKeyRow[]>`
        SELECT ak.id, ak.name, ak.is_active, ak.organization_id,
               o.slug AS organization_slug, o.schema_name
        FROM   public.api_keys ak
        JOIN   public.organizations o ON o.id = ak.organization_id
        WHERE  ak.key_hash = ${hash}
        LIMIT  1
      `,
    )
    if (!rows[0]) return null
    const r = rows[0]
    return {
      id: r.id,
      name: r.name,
      isActive: r.is_active,
      organizationId: r.organization_id,
      organizationSlug: r.organization_slug,
      schemaName: r.schema_name,
    }
  }

  async updateLastUsedAt(id: string): Promise<void> {
    await this.drizzle.runRaw((sql) =>
      sql`UPDATE public.api_keys SET last_used_at = NOW() WHERE id = ${id}`,
    )
  }
}

export { API_KEY_REPOSITORY }
