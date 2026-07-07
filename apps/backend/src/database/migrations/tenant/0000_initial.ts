import { Migration } from '../types'

// Runs with search_path set to the tenant schema — table names are unqualified.
// IF NOT EXISTS is kept intentionally: tenants provisioned before the
// versioned-migrations system already contain these tables.
export const migration: Migration = {
  name: '0000_initial',
  up: `
    CREATE TABLE IF NOT EXISTS memberships (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID        NOT NULL,
      role        TEXT        NOT NULL DEFAULT 'torcedor',
      is_active   BOOLEAN     NOT NULL DEFAULT true,
      joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID        NOT NULL,
      action      TEXT        NOT NULL,
      resource    TEXT,
      resource_id TEXT,
      metadata    JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS teams (
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
    );

    CREATE TABLE IF NOT EXISTS players (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id          UUID        NOT NULL,
      full_name        TEXT        NOT NULL,
      photo_url        TEXT,
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
    );

    CREATE TABLE IF NOT EXISTS player_history (
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
    );

    CREATE TABLE IF NOT EXISTS staff_members (
      id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id         UUID        NOT NULL,
      full_name       TEXT        NOT NULL,
      document        TEXT,
      license_number  TEXT,
      role            TEXT        NOT NULL DEFAULT 'auxiliar',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS championships (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT        NOT NULL,
      season      TEXT        NOT NULL,
      format      TEXT        NOT NULL DEFAULT 'pontos_corridos',
      legs        INTEGER     NOT NULL DEFAULT 1,
      status      TEXT        NOT NULL DEFAULT 'draft',
      logo_url    TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE championships ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;

    CREATE TABLE IF NOT EXISTS groups (
      id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      championship_id UUID    NOT NULL,
      name            TEXT    NOT NULL,
      order_index     INTEGER NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS group_teams (
      id       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID    NOT NULL,
      team_id  UUID    NOT NULL,
      seed     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS phases (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      championship_id  UUID        NOT NULL,
      name             TEXT        NOT NULL,
      order_index      INTEGER     NOT NULL DEFAULT 0,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rounds (
      id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      championship_id UUID    NOT NULL,
      number          INTEGER NOT NULL,
      name            TEXT    NOT NULL,
      phase           TEXT    NOT NULL DEFAULT 'knockout',
      group_id        UUID,
      phase_id        UUID,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE rounds ADD COLUMN IF NOT EXISTS phase_id UUID;

    CREATE TABLE IF NOT EXISTS matches (
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
    );

    CREATE TABLE IF NOT EXISTS match_events (
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
    );

    CREATE TABLE IF NOT EXISTS standings (
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
      extra_points     INTEGER NOT NULL DEFAULT 0,
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (championship_id, team_id)
    );
    ALTER TABLE standings ADD COLUMN IF NOT EXISTS extra_points INTEGER NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS player_statistics (
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
    );

    CREATE TABLE IF NOT EXISTS articles (
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
    );

    CREATE TABLE IF NOT EXISTS galleries (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      championship_id  UUID,
      title            TEXT        NOT NULL,
      description      TEXT,
      tags             JSONB       NOT NULL DEFAULT '[]',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      gallery_id  UUID        NOT NULL,
      url         TEXT        NOT NULL,
      description TEXT,
      "order"     INTEGER     NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS videos (
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
    );

    CREATE TABLE IF NOT EXISTS registration_requests (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      championship_id  UUID        NOT NULL,
      team_id          UUID        NOT NULL,
      status           TEXT        NOT NULL DEFAULT 'pendente',
      submitted_by     UUID        NOT NULL,
      reviewed_by      UUID,
      review_note      TEXT,
      submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at      TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS registration_documents (
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
    );

    CREATE TABLE IF NOT EXISTS judges (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name        TEXT        NOT NULL,
      document         TEXT,
      license_number   TEXT,
      license_category TEXT,
      role             TEXT        NOT NULL DEFAULT 'arbitro_principal',
      phone            TEXT,
      email            TEXT,
      photo_url        TEXT,
      is_active        BOOLEAN     NOT NULL DEFAULT true,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sumulas (
      id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id        UUID        NOT NULL UNIQUE,
      championship_id UUID        NOT NULL,
      venue           TEXT,
      observations    TEXT,
      status          TEXT        NOT NULL DEFAULT 'aberta',
      closed_at       TIMESTAMPTZ,
      closed_by       UUID,
      integrity_hash  TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS match_lineups (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id      UUID        NOT NULL,
      team_id       UUID        NOT NULL,
      player_id     UUID        NOT NULL,
      jersey_number INTEGER,
      position      TEXT,
      is_starter    BOOLEAN     NOT NULL DEFAULT true,
      is_captain    BOOLEAN     NOT NULL DEFAULT false,
      added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (match_id, player_id)
    );

    CREATE TABLE IF NOT EXISTS match_officials (
      id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id       UUID        NOT NULL,
      name           TEXT        NOT NULL,
      role           TEXT        NOT NULL,
      license_number TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
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
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id   UUID        NOT NULL,
      championship_id  UUID,
      category         TEXT        NOT NULL,
      amount           INTEGER     NOT NULL,
      description      TEXT        NOT NULL DEFAULT '',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS suspensions (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      championship_id  UUID        NOT NULL,
      player_id        UUID        NOT NULL,
      team_id          UUID        NOT NULL,
      reason           TEXT        NOT NULL,
      source           TEXT        NOT NULL DEFAULT 'manual',
      matches_to_serve INTEGER     NOT NULL DEFAULT 1,
      matches_served   INTEGER     NOT NULL DEFAULT 0,
      status           TEXT        NOT NULL DEFAULT 'ativa',
      event_id         UUID,
      notes            TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS polls (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      championship_id  UUID        NOT NULL,
      question         TEXT        NOT NULL,
      status           TEXT        NOT NULL DEFAULT 'draft',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      closed_at        TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS poll_options (
      id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id     UUID    NOT NULL,
      text        TEXT    NOT NULL,
      votes_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS poll_votes (
      id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id   UUID        NOT NULL,
      option_id UUID        NOT NULL,
      user_id   UUID        NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (poll_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS custom_rankings (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      championship_id  UUID        NOT NULL,
      name             TEXT        NOT NULL,
      weights          JSONB       NOT NULL DEFAULT '{}',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expense_entries (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      championship_id  UUID,
      category         TEXT        NOT NULL,
      amount           INTEGER     NOT NULL,
      description      TEXT        NOT NULL,
      notes            TEXT,
      expense_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
}
