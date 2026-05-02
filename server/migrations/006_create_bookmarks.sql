CREATE TABLE bookmarks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id       UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    section_index INTEGER NOT NULL,
    name          TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id, file_id, section_index)
);

CREATE INDEX idx_bookmarks_user_file ON bookmarks(user_id, file_id);
