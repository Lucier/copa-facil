import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleService } from '../../../../database/drizzle.service'
import { organizations } from '../../../../database/schemas/core.schema'
import {
  CreateOrganizationData,
  IOrganizationRepository,
  OrganizationRecord,
} from '../../domain/repositories/i-organization.repository'

@Injectable()
export class DrizzleOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: CreateOrganizationData): Promise<OrganizationRecord> {
    const [row] = await this.drizzle.db
      .insert(organizations)
      .values({
        name: data.name,
        slug: data.slug,
        schemaName: data.schemaName,
      })
      .returning()
    return { id: row.id, name: row.name, slug: row.slug, schemaName: row.schemaName }
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1)
    return rows.length > 0
  }
}
