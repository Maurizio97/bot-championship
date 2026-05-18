BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_teams_owner_discord_id
  ON teams(owner_discord_id);

COMMIT;

