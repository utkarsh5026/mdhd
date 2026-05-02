-- Stores inline paste content for sharing without requiring S3.
-- The token is the public capability — anyone with it can read the content.
-- Ownership (user_id) is checked on DELETE so only the creator can revoke.
CREATE TABLE paste_shares (
    token      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL DEFAULT 'Untitled',
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paste_shares_user_id ON paste_shares (user_id);
