import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleService } from '../../../../database/drizzle.service'
import { organizations } from '../../../../database/schemas/core.schema'
import { OrganizationEntity } from '../../domain/entities/organization.entity'
import {
  IOrganizationMgmtRepository,
  UpdateOrgData,
} from '../../domain/repositories/i-org-mgmt.repository'

function toEntity(row: typeof organizations.$inferSelect): OrganizationEntity {
  return new OrganizationEntity(
    row.id,
    row.name,
    row.slug,
    row.schemaName,
    row.createdAt,
    row.updatedAt,
  )
}

@Injectable()
export class DrizzleOrgMgmtRepository implements IOrganizationMgmtRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findBySchemaName(schemaName: string): Promise<OrganizationEntity | null> {
    const rows = await this.drizzle.db
      .select()
      .from(organizations)
      .where(eq(organizations.schemaName, schemaName))
      .limit(1)
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    const rows = await this.drizzle.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1)
    return rows[0] ? toEntity(rows[0]) : null
  }

  async update(id: string, data: UpdateOrgData): Promise<OrganizationEntity> {
    const patch: Partial<typeof organizations.$inferInsert> = { updatedAt: new Date() }
    if (data.name) patch.name = data.name

    const [row] = await this.drizzle.db
      .update(organizations)
      .set(patch)
      .where(eq(organizations.id, id))
      .returning()
    return toEntity(row)
  }
}
