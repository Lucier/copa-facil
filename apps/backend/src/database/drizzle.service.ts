import { OnModuleDestroy } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { TenantContext } from '../infrastructure/tenant/tenant-context'
import * as coreSchema from './schemas/core.schema'

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly client: postgres.Sql
  readonly db: PostgresJsDatabase<typeof coreSchema>

  constructor(private readonly config: ConfigService) {
    this.client = postgres(this.config.getOrThrow<string>('DATABASE_URL'), {
      max: this.config.get<number>('DB_POOL_MAX') ?? 10,
      idle_timeout: 20,       // seconds before idle connections are closed
      connect_timeout: 10,    // seconds to wait for a connection
      max_lifetime: 1800,     // seconds before a connection is retired (30 min)
    })
    this.db = drizzle(this.client, { schema: coreSchema })
  }

  // Wraps fn in a transaction with the current tenant's search_path.
  // SET LOCAL ensures the path resets when the transaction ends — safe with connection pooling.
  async runInTenantContext<T>(
    fn: (tx: postgres.TransactionSql) => Promise<T>,
  ): Promise<T> {
    const schema = TenantContext.getSchema()
    let result!: T
    await this.client.begin(async (tx) => {
      await tx`SET LOCAL search_path TO ${tx(schema)}, public`
      result = await fn(tx)
    })
    return result
  }

  // Exposes raw postgres client for DDL operations (schema provisioning, migrations).
  async runRaw<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
    return fn(this.client)
  }

  async onModuleDestroy() {
    await this.client.end()
  }
}
