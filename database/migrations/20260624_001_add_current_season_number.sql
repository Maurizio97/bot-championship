ALTER TABLE IF EXISTS league_state
ADD COLUMN IF NOT EXISTS current_season_number INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
	SELECT 1
	FROM pg_constraint
	WHERE conname = 'league_state_current_season_number_chk'
  ) THEN
	ALTER TABLE league_state
	  ADD CONSTRAINT league_state_current_season_number_chk
	  CHECK (current_season_number >= 1);
  END IF;
END $$;


