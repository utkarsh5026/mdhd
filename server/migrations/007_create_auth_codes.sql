-- One-time auth codes issued after OAuth, exchanged by the frontend for a JWT.
-- Codes expire after 60 seconds and are deleted on use (DELETE … RETURNING).
CREATE TABLE auth_codes (
    code       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '60 seconds'
);
