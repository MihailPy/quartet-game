CREATE TABLE game_events (
    id UUID PRIMARY KEY,
    game_id UUID NOT NULL,
    room_id UUID NOT NULL,
    type TEXT NOT NULL,
    actor_id UUID,
    target_id UUID,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_game_events_game_id_created_at
ON game_events (game_id, created_at);
