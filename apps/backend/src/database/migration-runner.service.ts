import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import type postgres from 'postgres'
import { DrizzleService } from './drizzle.service'
import { coreMigrations } from './migrations/core'
import { tenantMigrations } from './migrations/tenant'
import type { Migration } from './migrations/types'

const SCHEMA_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/
// Prevents concurrent app instances from racing on DDL during boot.
const MIGRATION_LOCK_KEY = 727201

@Injectable()
export class MigrationRunnerService implements OnModuleInit {
  private readonly logger = new Logger(MigrationRunnerService.name)

  constructor(private readonly drizzle: DrizzleService) {}

  async onModuleInit(): Promise<void> {
    await this.runCoreMigrations()
    await this.migrateAllTenants()
  }

  async runCoreMigrations(): Promise<void> {
    await this.drizzle.runRaw(async (sql) => {
      await sql.begin(async (tx) => {
        await tx`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`
        await tx`
          CREATE TABLE IF NOT EXISTS public.schema_migrations (
            name       TEXT        PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `
        await this.applyPending(tx, 'public', coreMigrations)
      })
    })
  }

  async runTenantMigrations(schemaName: string): Promise<void> {
    this.assertValidSchemaName(schemaName)
    await this.drizzle.runRaw(async (sql) => {
      await sql.begin(async (tx) => {
        await tx`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`
        await tx`CREATE SCHEMA IF NOT EXISTS ${tx(schemaName)}`
        await tx`SET LOCAL search_path TO ${tx(schemaName)}, public`
        await tx`
          CREATE TABLE IF NOT EXISTS ${tx(schemaName)}.schema_migrations (
            name       TEXT        PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `
        await this.applyPending(tx, schemaName, tenantMigrations)
      })
    })
  }

  async migrateAllTenants(): Promise<void> {
    const schemas = await this.drizzle.runRaw(async (sql) => {
      const orgsTable = await sql`SELECT to_regclass('public.organizations') AS reg`
      if (!orgsTable[0]?.reg) return [] as string[]
      const rows = await sql`SELECT DISTINCT schema_name FROM public.organizations`
      return rows.map((r) => r.schema_name as string)
    })
    for (const schema of schemas) {
      await this.runTenantMigrations(schema)
    }
  }

  private async applyPending(
    tx: postgres.TransactionSql,
    schemaName: string,
    migrations: Migration[],
  ): Promise<void> {
    const applied = await tx`SELECT name FROM ${tx(schemaName)}.schema_migrations`
    const appliedNames = new Set(applied.map((r) => r.name as string))

    for (const migration of migrations) {
      if (appliedNames.has(migration.name)) continue
      this.logger.log(`Applying migration ${migration.name} on schema "${schemaName}"`)
      await tx.unsafe(migration.up)
      await tx`INSERT INTO ${tx(schemaName)}.schema_migrations (name) VALUES (${migration.name})`
    }
  }

  private assertValidSchemaName(schemaName: string): void {
    if (!SCHEMA_NAME_PATTERN.test(schemaName)) {
      throw new Error(`Invalid tenant schema name: ${schemaName}`)
    }
  }
}
