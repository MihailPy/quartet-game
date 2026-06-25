ALTER TABLE user_game_history
DROP COLUMN IF EXISTS duration_seconds;

ALTER TABLE user_game_history
DROP COLUMN IF EXISTS winner_player_name;

ALTER TABLE user_game_history
DROP COLUMN IF EXISTS winner_score;
