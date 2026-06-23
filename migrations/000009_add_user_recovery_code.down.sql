DROP INDEX IF EXISTS idx_users_recovery_code;

ALTER TABLE users
DROP COLUMN IF EXISTS recovery_code;
