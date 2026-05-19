BEGIN;

ALTER TABLE transfers
  DROP COLUMN IF EXISTS created_by_admin_id;

COMMIT;

