-- Per-user open tabs, synced across devices so the working set follows the user.
-- Only file-backed tabs are tracked (paste tabs have no persistent identity).
CREATE TABLE user_tabs (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id     UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT FALSE,
    pinned      BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, file_id),
    CHECK (position >= 0)
);

CREATE INDEX idx_user_tabs_user_position ON user_tabs(user_id, position ASC);

-- At most one active tab per user.
CREATE UNIQUE INDEX idx_user_tabs_one_active
    ON user_tabs(user_id) WHERE is_active = TRUE;
