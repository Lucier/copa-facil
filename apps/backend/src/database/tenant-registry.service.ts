import { Injectable, Logger } from '@nestjs/common'
import { DrizzleService } from './drizzle.service'

@Injectable()
export class TenantRegistryService {
  private readonly logger = new Logger(TenantRegistryService.name)
  private readonly provisionedSchemas = new Set<string>()

  constructor(private readonly drizzle: DrizzleService) {}

  async provisionTenant(schemaName: string): Promise<void> {
    if (this.provisionedSchemas.has(schemaName)) return

    this.logger.log(`Provisioning tenant schema: ${schemaName}`)
    await this.drizzle.runRaw(async (sql) => {
      const s = schemaName

      await sql`CREATE SCHEMA IF NOT EXISTS ${sql(s)}`

      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.memberships (
          id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     UUID        NOT NULL,
          role        TEXT        NOT NULL DEFAULT 'torcedor',
          is_active   BOOLEAN     NOT NULL DEFAULT true,
          joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.audit_logs (
          id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     UUID        NOT NULL,
          action      TEXT        NOT NULL,
          resource    TEXT,
          resource_id TEXT,
          metadata    JSONB,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.teams (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          name             TEXT        NOT NULL,
          acronym          TEXT,
          city             TEXT,
          nickname         TEXT,
          logo_url         TEXT,
          primary_color    TEXT,
          secondary_color  TEXT,
          seed             INTEGER,
          invite_token     UUID        NOT NULL DEFAULT gen_random_uuid(),
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.players (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id          UUID        NOT NULL,
          full_name        TEXT        NOT NULL,
          birthdate        DATE,
          document         TEXT,
          document_type    TEXT        NOT NULL DEFAULT 'cpf',
          jersey_number    INTEGER,
          preferred_foot   TEXT        NOT NULL DEFAULT 'direito',
          main_position    TEXT        NOT NULL DEFAULT 'goleiro',
          sub_positions    JSONB       NOT NULL DEFAULT '[]',
          goals            INTEGER     NOT NULL DEFAULT 0,
          yellow_cards     INTEGER     NOT NULL DEFAULT 0,
          red_cards        INTEGER     NOT NULL DEFAULT 0,
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.player_history (
          id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id       UUID        NOT NULL,
          championship_id UUID,
          from_team_id    UUID,
          to_team_id      UUID,
          goals           INTEGER     NOT NULL DEFAULT 0,
          yellow_cards    INTEGER     NOT NULL DEFAULT 0,
          red_cards       INTEGER     NOT NULL DEFAULT 0,
          season          TEXT,
          note            TEXT,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.staff_members (
          id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id         UUID        NOT NULL,
          full_name       TEXT        NOT NULL,
          document        TEXT,
          license_number  TEXT,
          role            TEXT        NOT NULL DEFAULT 'auxiliar',
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.championships (
          id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          name        TEXT        NOT NULL,
          season      TEXT        NOT NULL,
          format      TEXT        NOT NULL DEFAULT 'pontos_corridos',
          legs        INTEGER     NOT NULL DEFAULT 1,
          status      TEXT        NOT NULL DEFAULT 'draft',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.groups (
          id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id UUID    NOT NULL,
          name            TEXT    NOT NULL,
          order_index     INTEGER NOT NULL,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.group_teams (
          id       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
          group_id UUID    NOT NULL,
          team_id  UUID    NOT NULL,
          seed     INTEGER NOT NULL DEFAULT 0
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.rounds (
          id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id UUID    NOT NULL,
          number          INTEGER NOT NULL,
          name            TEXT    NOT NULL,
          phase           TEXT    NOT NULL DEFAULT 'knockout',
          group_id        UUID,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.matches (
          id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id UUID        NOT NULL,
          round_id        UUID        NOT NULL,
          home_team_id    UUID,
          away_team_id    UUID,
          group_id        UUID,
          bracket_slot    INTEGER,
          status          TEXT        NOT NULL DEFAULT 'scheduled',
          home_score      INTEGER     NOT NULL DEFAULT 0,
          away_score      INTEGER     NOT NULL DEFAULT 0,
          scheduled_at    TIMESTAMPTZ,
          started_at      TIMESTAMPTZ,
          ended_at        TIMESTAMPTZ,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.match_events (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          match_id         UUID        NOT NULL,
          championship_id  UUID        NOT NULL,
          event_type       TEXT        NOT NULL,
          team_id          UUID        NOT NULL,
          player_id        UUID,
          assist_player_id UUID,
          player_out_id    UUID,
          player_in_id     UUID,
          minute           INTEGER     NOT NULL,
          goal_type        TEXT,
          card_color       TEXT,
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.standings (
          id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id  UUID    NOT NULL,
          group_id         UUID,
          team_id          UUID    NOT NULL,
          matches_played   INTEGER NOT NULL DEFAULT 0,
          wins             INTEGER NOT NULL DEFAULT 0,
          draws            INTEGER NOT NULL DEFAULT 0,
          losses           INTEGER NOT NULL DEFAULT 0,
          goals_for        INTEGER NOT NULL DEFAULT 0,
          goals_against    INTEGER NOT NULL DEFAULT 0,
          goal_difference  INTEGER NOT NULL DEFAULT 0,
          points           INTEGER NOT NULL DEFAULT 0,
          yellow_cards     INTEGER NOT NULL DEFAULT 0,
          red_cards        INTEGER NOT NULL DEFAULT 0,
          fair_play_points INTEGER NOT NULL DEFAULT 0,
          updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (championship_id, team_id)
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.player_statistics (
          id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id  UUID    NOT NULL,
          team_id          UUID    NOT NULL,
          player_id        UUID    NOT NULL,
          goals            INTEGER NOT NULL DEFAULT 0,
          assists          INTEGER NOT NULL DEFAULT 0,
          yellow_cards     INTEGER NOT NULL DEFAULT 0,
          red_cards        INTEGER NOT NULL DEFAULT 0,
          updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (championship_id, player_id)
        )
      `

      // CMS
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.articles (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id  UUID,
          title            TEXT        NOT NULL,
          slug             TEXT        NOT NULL UNIQUE,
          content          TEXT        NOT NULL DEFAULT '',
          status           TEXT        NOT NULL DEFAULT 'draft',
          category         TEXT,
          cover_image_url  TEXT,
          author_id        UUID        NOT NULL,
          published_at     TIMESTAMPTZ,
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.galleries (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id  UUID,
          title            TEXT        NOT NULL,
          description      TEXT,
          tags             JSONB       NOT NULL DEFAULT '[]',
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.media_assets (
          id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          gallery_id  UUID        NOT NULL,
          url         TEXT        NOT NULL,
          description TEXT,
          "order"     INTEGER     NOT NULL DEFAULT 0,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.videos (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id  UUID,
          title            TEXT        NOT NULL,
          description      TEXT,
          provider         TEXT        NOT NULL DEFAULT 'youtube',
          embed_id         TEXT        NOT NULL,
          embed_url        TEXT        NOT NULL,
          thumbnail_url    TEXT,
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `

      // Registrations
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.registration_requests (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id  UUID        NOT NULL,
          team_id          UUID        NOT NULL,
          status           TEXT        NOT NULL DEFAULT 'pendente',
          submitted_by     UUID        NOT NULL,
          reviewed_by      UUID,
          review_note      TEXT,
          submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          reviewed_at      TIMESTAMPTZ
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.registration_documents (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          registration_id  UUID        NOT NULL,
          player_id        UUID,
          document_type    TEXT        NOT NULL DEFAULT 'outros',
          file_url         TEXT        NOT NULL,
          status           TEXT        NOT NULL DEFAULT 'pendente',
          rejection_reason TEXT,
          reviewed_by      UUID,
          uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          reviewed_at      TIMESTAMPTZ
        )
      `

      // Payments
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.transactions (
          id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          championship_id        UUID,
          reference_id           TEXT,
          reference_type         TEXT,
          amount                 INTEGER     NOT NULL,
          currency               TEXT        NOT NULL DEFAULT 'BRL',
          method                 TEXT        NOT NULL,
          category               TEXT        NOT NULL,
          status                 TEXT        NOT NULL DEFAULT 'pending',
          gateway_transaction_id TEXT,
          gateway_payload        JSONB,
          payer_id               UUID,
          paid_at                TIMESTAMPTZ,
          expires_at             TIMESTAMPTZ,
          created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(s)}.ledger_entries (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          transaction_id   UUID        NOT NULL,
          championship_id  UUID,
          category         TEXT        NOT NULL,
          amount           INTEGER     NOT NULL,
          description      TEXT        NOT NULL DEFAULT '',
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
    })

    this.provisionedSchemas.add(schemaName)
    this.logger.log(`Tenant schema ready: ${schemaName}`)
  }

  async dropTenant(schemaName: string): Promise<void> {
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
