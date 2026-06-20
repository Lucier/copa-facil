import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import {
  AuditLogData,
  IAuditRepository,
} from '../../domain/repositories/i-audit.repository'

@Injectable()
export class DrizzleAuditRepository implements IAuditRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async log(data: AuditLogData): Promise<void> {
    if (!TenantContext.hasContext() || TenantContext.getSchema() === 'public') return

    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata)
        VALUES (
          ${data.userId},
          ${data.action},
          ${data.resource ?? null},
          ${data.resourceId ?? null},
          ${data.metadata ? JSON.stringify(data.metadata) : null}
        )
      `
    })
  }
}
