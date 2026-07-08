import { Migration } from '../types'

export const migration: Migration = {
  name: '0001_performance_indexes',
  up: `
    CREATE INDEX IF NOT EXISTS idx_players_team_id             ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_staff_members_team_id       ON staff_members(team_id);
    CREATE INDEX IF NOT EXISTS idx_player_history_player_id    ON player_history(player_id);

    CREATE INDEX IF NOT EXISTS idx_matches_championship_id     ON matches(championship_id);
    CREATE INDEX IF NOT EXISTS idx_matches_round_id            ON matches(round_id);
    CREATE INDEX IF NOT EXISTS idx_matches_status              ON matches(status);

    CREATE INDEX IF NOT EXISTS idx_match_events_match_id       ON match_events(match_id);
    CREATE INDEX IF NOT EXISTS idx_match_events_championship_id ON match_events(championship_id);

    CREATE INDEX IF NOT EXISTS idx_standings_championship_id   ON standings(championship_id);
    CREATE INDEX IF NOT EXISTS idx_player_statistics_champ     ON player_statistics(championship_id, player_id);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id          ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at       ON audit_logs(created_at);

    CREATE INDEX IF NOT EXISTS idx_transactions_status         ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_championship_id ON transactions(championship_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_entries_championship  ON ledger_entries(championship_id);

    CREATE INDEX IF NOT EXISTS idx_suspensions_player_champ    ON suspensions(player_id, championship_id);
    CREATE INDEX IF NOT EXISTS idx_suspensions_status          ON suspensions(status);

    CREATE INDEX IF NOT EXISTS idx_articles_slug               ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_championship_id    ON articles(championship_id);
    CREATE INDEX IF NOT EXISTS idx_articles_status             ON articles(status);

    CREATE INDEX IF NOT EXISTS idx_registration_requests_champ ON registration_requests(championship_id);
    CREATE INDEX IF NOT EXISTS idx_registration_requests_team  ON registration_requests(team_id);
    CREATE INDEX IF NOT EXISTS idx_registration_docs_reg_id    ON registration_documents(registration_id);

    CREATE INDEX IF NOT EXISTS idx_sumulas_championship_id     ON sumulas(championship_id);
    CREATE INDEX IF NOT EXISTS idx_match_lineups_match_id      ON match_lineups(match_id);
    CREATE INDEX IF NOT EXISTS idx_match_officials_match_id    ON match_officials(match_id);
  `,
}
