import { Injectable, Logger } from '@nestjs/common'
import { DrizzleService } from './drizzle.service'
import { MigrationRunnerService } from './migration-runner.service'

const SCHEMA_NAME_PATTERN = /^[a-z_][a-z0-9_-]*$/

@Injectable()
export class TenantRegistryService {
  private readonly logger = new Logger(TenantRegistryService.name)
  private readonly provisionedSchemas = new Set<string>()

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly migrationRunner: MigrationRunnerService,
  ) {}

  async provisionTenant(schemaName: string): Promise<void> {
    if (this.provisionedSchemas.has(schemaName)) return

    this.logger.log(`Provisioning tenant schema: ${schemaName}`)
    await this.migrationRunner.runTenantMigrations(schemaName)

    this.provisionedSchemas.add(schemaName)
    this.logger.log(`Tenant schema ready: ${schemaName}`)
  }

  async dropTenant(schemaName: string): Promise<void> {
    if (!SCHEMA_NAME_PATTERN.test(schemaName)) {
      throw new Error(`Invalid tenant schema name: ${schemaName}`)
    }
    this.logger.warn(`Dropping tenant schema: ${schemaName}`)
    await this.drizzle.runRaw(async (sql) => {
      await sql`DROP SCHEMA IF EXISTS ${sql(schemaName)} CASCADE`
    })
    this.provisionedSchemas.delete(schemaName)
  }

  isProvisioned(schemaName: string): boolean {
    return this.provisionedSchemas.has(schemaName)
  }
}
