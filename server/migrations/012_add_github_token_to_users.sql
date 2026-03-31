-- Store the GitHub OAuth access token on the user row so the server
-- can call the GitHub API on their behalf (Contents, Webhooks, etc.).
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT;
