CREATE TABLE users (
    id UUID PRIMARY KEY,
    player_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE user_game_history (
    id TEXT PRIMARY KEY,
    game_id UUID NOT NULL,
    room_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    score INTEGER NOT NULL,
    is_winner BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_user_game_history_user_id_created_at
ON user_game_history (user_id, created_at DESC);
