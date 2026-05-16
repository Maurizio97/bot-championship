BEGIN;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE teams DROP COLUMN IF EXISTS ' || quote_ident('selected' || '_' || 'club' || '_' || 'name');
END $$;

ALTER TABLE transfers
  ALTER COLUMN created_by_admin_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS league_state (
  id INTEGER PRIMARY KEY,
  draft_status VARCHAR(16) NOT NULL DEFAULT 'CLOSED' CHECK (draft_status IN ('CLOSED', 'ACTIVE', 'PAUSED')),
  market_status VARCHAR(16) NOT NULL DEFAULT 'CLOSED' CHECK (market_status IN ('CLOSED', 'OPEN')),
  team_selection_status VARCHAR(16) NOT NULL DEFAULT 'CLOSED' CHECK (team_selection_status IN ('CLOSED', 'ACTIVE', 'PAUSED')),
  current_draft_turn INTEGER NOT NULL DEFAULT 0 CHECK (current_draft_turn >= 0),
  current_team_selection_turn INTEGER NOT NULL DEFAULT 0 CHECK (current_team_selection_turn >= 0),
  current_round INTEGER NOT NULL DEFAULT 1 CHECK (current_round >= 1),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT league_state_singleton CHECK (id = 1)
);

INSERT INTO league_state (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS draft_orders (
  id SERIAL PRIMARY KEY,
  type VARCHAR(32) NOT NULL CHECK (type IN ('TEAM_SELECTION', 'PLAYER_DRAFT')),
  discord_user_id VARCHAR(64) NOT NULL,
  team_id INTEGER NULL REFERENCES teams(id) ON DELETE SET NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_draft_orders_type_position ON draft_orders(type, position);
CREATE INDEX IF NOT EXISTS idx_draft_orders_type ON draft_orders(type);

CREATE TABLE IF NOT EXISTS budget_logs (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('ADD', 'REMOVE', 'DRAFT_PURCHASE', 'MARKET_PURCHASE')),
  reason VARCHAR(255) NOT NULL,
  created_by_admin_id INTEGER NULL REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budget_logs_team_id ON budget_logs(team_id);

COMMIT;

