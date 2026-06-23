CREATE TABLE quartet_metadata (
    quartet_id UUID PRIMARY KEY REFERENCES quartets(id) ON DELETE CASCADE,
    owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    visibility TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_quartet_metadata_owner_user_id
ON quartet_metadata (owner_user_id);

CREATE INDEX idx_quartet_metadata_source_status
ON quartet_metadata (source, status);
