import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { ConfigService } from '@nestjs/config'
import { TenantContext } from '../../infrastructure/tenant/tenant-context'
import { DrizzleService } from '../drizzle.service'
import { MigrationRunnerService } from '../migration-runner.service'
import { TenantRegistryService } from '../tenant-registry.service'

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://copafacil:copafacil@localhost:5434/copafacil'

const TENANT_A = 'test_iso_tenant_a'
const TENANT_B = 'test_iso_tenant_b'

async function isDatabaseUp(): Promise<boolean> {
  const probe = postgres(DATABASE_URL, { max: 1, connect_timeout: 3 })
  try {
    await probe`SELECT 1`
    return true
  } catch {
    return false
  } finally {
    await probe.end()
  }
}

const dbUp = await isDatabaseUp()

describe.runIf(dbUp)('Tenant isolation (integration)', () => {
  let drizzle: DrizzleService
  let runner: MigrationRunnerService
  let registry: TenantRegistryService

  beforeAll(async () => {
    const config = {
      getOrThrow: () => DATABASE_URL,
      get: () => undefined,
    } as unknown as ConfigService
    drizzle = new DrizzleService(config)
    runner = new MigrationRunnerService(drizzle)
    registry = new TenantRegistryService(drizzle, runner)

    await runner.runCoreMigrations()
    await registry.dropTenant(TENANT_A)
    await registry.dropTenant(TENANT_B)
    await registry.provisionTenant(TENANT_A)
    await registry.provisionTenant(TENANT_B)
  })

  afterAll(async () => {
    if (registry) {
      await registry.dropTenant(TENANT_A)
      await registry.dropTenant(TENANT_B)
    }
    await drizzle?.onModuleDestroy()
  })

  it('records applied migrations in each tenant schema_migrations table', async () => {
    const rows = await drizzle.runRaw(
      (sql) => sql`
        SELECT '${sql.unsafe(TENANT_A)}' AS schema, name FROM ${sql(TENANT_A)}.schema_migrations
        UNION ALL
        SELECT '${sql.unsafe(TENANT_B)}', name FROM ${sql(TENANT_B)}.schema_migrations
      `,
    )
    const bySchema = new Map<string, string[]>()
    for (const r of rows) {
      bySchema.set(r.schema, [...(bySchema.get(r.schema) ?? []), r.name])
    }
    expect(bySchema.get(TENANT_A)).toContain('0000_initial')
    expect(bySchema.get(TENANT_B)).toContain('0000_initial')
  })

  it('records core migrations in public.schema_migrations', async () => {
    const rows = await drizzle.runRaw(
      (sql) => sql`SELECT name FROM public.schema_migrations`,
    )
    expect(rows.map((r) => r.name)).toContain('0000_initial')
  })

  it('is idempotent — re-running migrations does not fail or duplicate', async () => {
    await runner.runCoreMigrations()
    await runner.runTenantMigrations(TENANT_A)
    const rows = await drizzle.runRaw(
      (sql) =>
        sql`SELECT count(*)::int AS c FROM ${sql(TENANT_A)}.schema_migrations WHERE name = '0000_initial'`,
    )
    expect(rows[0].c).toBe(1)
  })

  it('rejects invalid tenant schema names', async () => {
    await expect(runner.runTenantMigrations('bad; DROP SCHEMA public')).rejects.toThrow(
      /Invalid tenant schema name/,
    )
  })

  it('accepts kebab-case tenant schema names (quoted identifiers)', async () => {
    const schema = 'tenant_e2e-kebab-case'
    await runner.runTenantMigrations(schema)
    const rows = await drizzle.runRaw(
      (sql) => sql`SELECT count(*)::int AS c FROM ${sql(schema)}.schema_migrations`,
    )
    expect(rows[0].c).toBeGreaterThan(0)
    await drizzle.runRaw((sql) => sql`DROP SCHEMA ${sql(schema)} CASCADE`)
  })

  it('writes in tenant A are not visible in tenant B', async () => {
    await TenantContext.run(TENANT_A, () =>
      drizzle.runInTenantContext(async (tx) => {
        await tx`INSERT INTO teams (name, acronym) VALUES ('Time Alpha', 'ALP')`
      }),
    )

    const teamsInB = await TenantContext.run(TENANT_B, () =>
      drizzle.runInTenantContext((tx) => tx`SELECT * FROM teams`),
    )
    expect(teamsInB).toHaveLength(0)

    const teamsInA = await TenantContext.run(TENANT_A, () =>
      drizzle.runInTenantContext((tx) => tx`SELECT name FROM teams`),
    )
    expect(teamsInA).toHaveLength(1)
    expect(teamsInA[0].name).toBe('Time Alpha')
  })

  it('tenants with identical table shapes keep independent data', async () => {
    await TenantContext.run(TENANT_B, () =>
      drizzle.runInTenantContext(async (tx) => {
        await tx`INSERT INTO teams (name) VALUES ('Time Beta 1')`
        await tx`INSERT INTO teams (name) VALUES ('Time Beta 2')`
      }),
    )

    const [countA, countB] = await Promise.all([
      TenantContext.run(TENANT_A, () =>
        drizzle.runInTenantContext((tx) => tx`SELECT count(*)::int AS c FROM teams`),
      ),
      TenantContext.run(TENANT_B, () =>
        drizzle.runInTenantContext((tx) => tx`SELECT count(*)::int AS c FROM teams`),
      ),
    ])
    expect(countA[0].c).toBe(1)
    expect(countB[0].c).toBe(2)
  })

  it('without tenant context, search_path falls back to public and tenant tables are unreachable', async () => {
    expect(TenantContext.hasContext()).toBe(false)
    await expect(
      drizzle.runInTenantContext((tx) => tx`SELECT * FROM teams`),
    ).rejects.toThrow(/relation "teams" does not exist/)
  })

  it('search_path does not leak across pooled connections after a tenant transaction', async () => {
    await TenantContext.run(TENANT_A, () =>
      drizzle.runInTenantContext((tx) => tx`SELECT 1`),
    )
    const rows = await drizzle.runRaw((sql) => sql`SHOW search_path`)
    expect(rows[0].search_path).not.toContain(TENANT_A)
  })

  it('dropTenant removes the schema entirely', async () => {
    const tempSchema = 'test_iso_tenant_temp'
    await registry.provisionTenant(tempSchema)
    await registry.dropTenant(tempSchema)
    const rows = await drizzle.runRaw(
      (sql) =>
        sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name = ${tempSchema}`,
    )
    expect(rows).toHaveLength(0)
    expect(registry.isProvisioned(tempSchema)).toBe(false)
  })
})

describe.runIf(!dbUp)('Tenant isolation (integration)', () => {
  it.skip('skipped — database not reachable at ' + DATABASE_URL, () => {})
})
