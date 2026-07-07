import { Migration } from '../types'

// IF NOT EXISTS is kept intentionally: databases bootstrapped before the
// versioned-migrations system already contain these tables.
export const migration: Migration = {
  name: '0000_initial',
  up: `
    CREATE TABLE IF NOT EXISTS public.organizations (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT        NOT NULL,
      slug        TEXT        NOT NULL UNIQUE,
      schema_name TEXT        NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.users (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name          TEXT        NOT NULL,
      email         TEXT        NOT NULL UNIQUE,
      password_hash TEXT        NOT NULL,
      is_active     BOOLEAN     NOT NULL DEFAULT true,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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
    );

    CREATE TABLE IF NOT EXISTS public.api_keys (
      id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      name            TEXT        NOT NULL,
      key_hash        TEXT        NOT NULL UNIQUE,
      is_active       BOOLEAN     NOT NULL DEFAULT true,
      last_used_at    TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
}
