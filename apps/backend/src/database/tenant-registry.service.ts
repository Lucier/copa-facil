import { Inject, Injectable, Logger } from '@nestjs/common'
import type Redis from 'ioredis'
import { REDIS_CLIENT } from '../infrastructure/redis/redis.constants'
import { DrizzleService } from './drizzle.service'
import { MigrationRunnerService } from './migration-runner.service'

const SCHEMA_NAME_PATTERN = /^[a-z_][a-z0-9_-]*$/
// TTL for the provisioned flag in Redis — 5 minutes is enough to absorb burst traffic
// without causing unnecessary re-provision attempts across instances
const PROVISIONED_TTL_SECONDS = 300

@Injectable()
export class TenantRegistryService {
  private readonly logger = new Logger(TenantRegistryService.name)

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly migrationRunner: MigrationRunnerService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private redisKey(schemaName: string): string {
    return `tenant:provisioned:${schemaName}`
  }

  async provisionTenant(schemaName: string): Promise<void> {
    const cached = await this.redis.get(this.redisKey(schemaName))
    if (cached) return

    this.logger.log(`Provisioning tenant schema: ${schemaName}`)
    await this.migrationRunner.runTenantMigrations(schemaName)

    await this.redis.setex(this.redisKey(schemaName), PROVISIONED_TTL_SECONDS, '1')
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
    await this.redis.del(this.redisKey(schemaName))
  }

  async isProvisioned(schemaName: string): Promise<boolean> {
    const val = await this.redis.get(this.redisKey(schemaName))
    return val === '1'
  }
}
