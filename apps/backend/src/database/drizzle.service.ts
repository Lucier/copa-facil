import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { TenantContext } from '../infrastructure/tenant/tenant-context'
import * as coreSchema from './schemas/core.schema'

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly client: postgres.Sql
  readonly db: PostgresJsDatabase<typeof coreSchema>

  constructor(private readonly config: ConfigService) {
    this.client = postgres(this.config.getOrThrow<string>('DATABASE_URL'))
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
