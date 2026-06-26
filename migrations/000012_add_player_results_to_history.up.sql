ALTER TABLE user_game_history
ADD COLUMN player_results JSONB NOT NULL DEFAULT '[]';
