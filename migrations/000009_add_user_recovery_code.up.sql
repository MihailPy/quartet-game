ALTER TABLE users
ADD COLUMN recovery_code TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX idx_users_recovery_code
ON users (recovery_code);
