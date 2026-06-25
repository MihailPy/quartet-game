ALTER TABLE user_game_history
ADD COLUMN winner_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_game_history
ADD COLUMN winner_player_name TEXT NOT NULL DEFAULT '';

ALTER TABLE user_game_history
ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 0;
