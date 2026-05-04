-- Per-file last-known reading position and cumulative time spent.
CREATE TABLE reading_progress (
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id        UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    section_index  INTEGER NOT NULL DEFAULT 0,
    scroll_pct     REAL NOT NULL DEFAULT 0,
    seconds_spent  INTEGER NOT NULL DEFAULT 0,
    completed_at   TIMESTAMPTZ NULL,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, file_id),
    CHECK (section_index >= 0),
    CHECK (scroll_pct >= 0 AND scroll_pct <= 1),
    CHECK (seconds_spent >= 0)
);

CREATE INDEX idx_reading_progress_user_updated
    ON reading_progress(user_id, updated_at DESC);

-- Daily rollup of reading time per user, used for streaks and the stats dashboard.
CREATE TABLE reading_sessions (
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day            DATE NOT NULL,
    seconds_spent  INTEGER NOT NULL DEFAULT 0,
    files_touched  INTEGER NOT NULL DEFAULT 0,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, day),
    CHECK (seconds_spent >= 0),
    CHECK (files_touched >= 0)
);

CREATE INDEX idx_reading_sessions_user_day_desc
    ON reading_sessions(user_id, day DESC);
