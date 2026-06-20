import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DrizzleService } from './drizzle.service'

@Injectable()
export class CoreSchemaService implements OnModuleInit {
  private readonly logger = new Logger(CoreSchemaService.name)

  constructor(private readonly drizzle: DrizzleService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Bootstrapping public schema tables...')
    await this.drizzle.runRaw(async (sql) => {
      await sql`
        CREATE TABLE IF NOT EXISTS public.organizations (
          id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          name        TEXT        NOT NULL,
          slug        TEXT        NOT NULL UNIQUE,
          schema_name TEXT        NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS public.users (
          id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          name          TEXT        NOT NULL,
          email         TEXT        NOT NULL UNIQUE,
          password_hash TEXT        NOT NULL,
          is_active     BOOLEAN     NOT NULL DEFAULT true,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS public.invitations (
          id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          org_id      UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
          email       TEXT        NOT NULL,
          role        TEXT        NOT NULL DEFAULT 'torcedor',
          token       TEXT        NOT NULL UNIQUE,
          status      TEXT        NOT NULL DEFAULT 'pending',
          invited_by  UUID        NOT NULL REFERENCES public.users(id),
          expires_at  TIMESTAMPTZ NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS public.api_keys (
          id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
          name            TEXT        NOT NULL,
          key_hash        TEXT        NOT NULL UNIQUE,
          is_active       BOOLEAN     NOT NULL DEFAULT true,
          last_used_at    TIMESTAMPTZ,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
    })
    this.logger.log('Public schema bootstrap complete.')
  }
}
