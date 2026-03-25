CREATE TABLE files (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    path          TEXT NOT NULL,
    storage_key   TEXT NOT NULL,
    size_bytes    BIGINT NOT NULL DEFAULT 0,
    content_hash  TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id, path)
);

CREATE INDEX idx_files_user_id ON files(user_id);
