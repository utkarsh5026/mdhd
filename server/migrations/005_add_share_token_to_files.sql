-- Add a nullable share_token column to files.
-- NULL means the file is not currently shared.
-- A unique partial index on non-null values prevents token collisions while
-- keeping the index small (NULL values are excluded).
ALTER TABLE files
    ADD COLUMN share_token UUID;

CREATE UNIQUE INDEX idx_files_share_token
    ON files (share_token)
    WHERE share_token IS NOT NULL;
