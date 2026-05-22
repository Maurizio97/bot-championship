-- Remove admin-related foreign keys and drop admin table
-- Migration 004: Transition to Discord role-based admin management

-- Drop constraint on overall_history.updated_by_admin_id
ALTER TABLE IF EXISTS overall_history
  DROP CONSTRAINT IF EXISTS overall_history_updated_by_admin_id_fkey;

-- Drop constraint on budget_logs.created_by_admin_id
ALTER TABLE IF EXISTS budget_logs
  DROP CONSTRAINT IF EXISTS budget_logs_created_by_admin_id_fkey;

-- Drop admin columns (make them nullable if we want to preserve history)
ALTER TABLE IF EXISTS overall_history
  DROP COLUMN IF EXISTS updated_by_admin_id;

ALTER TABLE IF EXISTS budget_logs
  DROP COLUMN IF EXISTS created_by_admin_id;

-- Drop admin table
DROP TABLE IF EXISTS admins CASCADE;

