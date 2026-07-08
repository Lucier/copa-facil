import postgres from 'postgres'
import { coreMigrations } from './database/migrations/core'
import { tenantMigrations } from './database/migrations/tenant'
import type { Migration } from './database/migrations/types'

const MIGRATION_LOCK_KEY = 727201
const SCHEMA_NAME_PATTERN = /^[a-z_][a-z0-9_-]*$/

async function applyPending(
  tx: postgres.TransactionSql,
  schemaName: string,
  migrations: Migration[],
): Promise<void> {
  const applied = await tx`SELECT name FROM ${tx(schemaName)}.schema_migrations`
  const appliedNames = new Set(applied.map((r) => r.name as string))

  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) continue
    console.log(`  → ${migration.name} (${schemaName})`)
    await tx.unsafe(migration.up)
    await tx`INSERT INTO ${tx(schemaName)}.schema_migrations (name) VALUES (${migration.name})`
  }
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is required')

  const sql = postgres(url, { max: 1, connect_timeout: 10 })

  try {
    console.log('Running core migrations...')
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`
      await tx`
        CREATE TABLE IF NOT EXISTS public.schema_migrations (
          name       TEXT        PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await applyPending(tx, 'public', coreMigrations)
    })

    console.log('Running tenant migrations...')
    const orgsTable = await sql`SELECT to_regclass('public.organizations') AS reg`
    if (orgsTable[0]?.reg) {
      const rows = await sql`SELECT DISTINCT schema_name FROM public.organizations`
      for (const row of rows) {
        const schemaName = row.schema_name as string
        if (!SCHEMA_NAME_PATTERN.test(schemaName)) {
          throw new Error(`Invalid tenant schema name: ${schemaName}`)
        }
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
          await applyPending(tx, schemaName, tenantMigrations)
        })
      }
    }

    console.log('All migrations applied successfully.')
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
