-- Schema relazionale per PostgreSQL (compatibile anche con MySQL con piccole variazioni sintattiche)

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  owner_discord_id VARCHAR(64) NOT NULL,
  budget BIGINT NOT NULL DEFAULT 700,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(120) NOT NULL,
  overall SMALLINT NOT NULL CHECK (overall BETWEEN 1 AND 99),
  role VARCHAR(40) NOT NULL,
  price BIGINT NOT NULL CHECK (price >= 0),
  team_id INTEGER NULL REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  discord_id VARCHAR(64) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  from_team_id INTEGER NULL REFERENCES teams(id) ON DELETE SET NULL,
  to_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  price BIGINT NOT NULL CHECK (price >= 0),
  created_by_admin_id INTEGER NULL REFERENCES admins(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS overall_history (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  old_overall SMALLINT NOT NULL CHECK (old_overall BETWEEN 1 AND 99),
  new_overall SMALLINT NOT NULL CHECK (new_overall BETWEEN 1 AND 99),
  reason VARCHAR(255) NOT NULL,
  updated_by_admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS league_state (
  id SERIAL PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS budget_logs (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('ADD', 'REMOVE', 'DRAFT_PURCHASE', 'MARKET_PURCHASE')),
  reason VARCHAR(255) NOT NULL,
  created_by_admin_id INTEGER NULL REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_transfers_player_id ON transfers(player_id);
CREATE INDEX IF NOT EXISTS idx_overall_history_player_id ON overall_history(player_id);
CREATE INDEX IF NOT EXISTS idx_draft_orders_type ON draft_orders(type);
CREATE INDEX IF NOT EXISTS idx_budget_logs_team_id ON budget_logs(team_id);

