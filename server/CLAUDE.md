# MDHD — server

Rust 2024 edition, Axum 0.8, SQLx 0.8 against Postgres, S3-compatible object storage (MinIO locally, Supabase Storage in prod). Deployed to Railway.

## Commands

```bash
make up            # start Postgres + MinIO via docker-compose.dev.yml
make migrate       # apply pending migrations
make dev           # run on :8080 (reads .env.development, then .env)
make watch         # auto-restart on change (needs cargo-watch)
make test          # cargo test
make lint          # clippy, warnings denied — this is the CI bar
make fmt           # cargo fmt
make db-shell      # psql into the dev database
make db-reset      # drop, recreate, re-migrate
make pre-commit    # fmt-check + lint + test
```

First time: `make setup` (containers + migrate + build). Copy `.env.example` to `.env`; only `DATABASE_URL` and `JWT_SECRET` are required.

## Layout

```
src/
  main.rs / lib.rs     # bootstrap; create_app() assembles router + layers
  config.rs            # Config::from_env() — every tunable lives here
  state.rs             # AppState { config, db, s3, http } — cloned into handlers
  errors.rs            # AppError + OptionExt; all handlers return Result<T, AppError>
  routes/              # one module per resource, each exposing router()
  models/              # row structs mapped by sqlx
  middleware/          # auth (AuthUser extractor), rate_limit
  services/            # cross-route logic (sync)
  jobs/                # background/scheduled work (storage_gc)
  auth/                # jwt.rs, oauth.rs
migrations/            # NNN_description.sql, applied in order
tests/                 # integration tests, each its own crate; helpers in tests/common/
scripts/               # Python TUIs and ops helpers (ruff-formatted)
```

## SQLx is compile-time checked

Queries use the `sqlx::query!` / `sqlx::query_as!` macros, so they are verified against a real schema at build time. Two consequences:

- After changing a query **or** a migration, run `make sqlx-prepare` (from the repo root, against `DATABASE_URL` in `.env.development`) and **commit the updated `.sqlx/` directory**. CI builds with `SQLX_OFFLINE=true` and fails otherwise.
- `make sqlx-check` (root) verifies the cache matches the code without needing a database — cheap, run it before pushing.

New migration: `make migrate-add <name>`, then edit the generated file in `migrations/`, then `make migrate`. Migrations are forward-only and applied to production by `.github/workflows/migrate.yml` on merge to main — write them so they're safe against live data (add columns nullable or with defaults, don't rewrite big tables in place).

## Route conventions

Look at `routes/bookmarks.rs` as the template. Every route module:

1. Opens with a `//!` doc comment that includes a table of the endpoints it mounts (method, path, handler).
2. Defines request/response structs separately from the model — response types are **projections** that deliberately drop internal fields like `user_id` so ownership isn't leaked. Implement `From<Model> for XResponse`.
3. Exposes `pub fn router() -> Router<AppState>`, which is `merge`d in `routes/mod.rs`. Everything under `/api` is nested there; auth routes sit at the root.
4. Takes `AuthUser` as a handler parameter for protected endpoints — no manual token parsing, no middleware layer. Absent/invalid token yields 401 before the handler runs.
5. Marks handlers `#[instrument]` for tracing.

**Always verify ownership**, not just authentication: a valid JWT proves who the caller is, not that they own the row. Confirm the target file/bookmark/tab belongs to `auth.user_id` before reading or mutating it. `tests/cross_user_authz.rs` exists to catch regressions here — extend it when you add a resource.

## Errors

Return `Result<T, AppError>`. Variants map to status codes; `Database` and `Internal` log the real cause server-side and return a generic message to the client. Never surface a raw `sqlx::Error` or an internal path/query to a response body. Use `AppError::bad_request(..)` / `AppError::internal(..)` helpers and `OptionExt` for `None` → 404.

## Tests

Integration tests in `tests/` compile as separate crates and so can only see the public API — shared helpers live in `tests/common/mod.rs` (`test_config`, `test_state`, `dummy_s3`, `create_test_user`). Most tests build the router with `create_app` and drive it via `tower::ServiceExt::oneshot`, so they need no running server. `wiremock` is available for outbound HTTP (OAuth token endpoints).

The existing suite is largely security-shaped — `auth_guard`, `cors`, `cross_user_authz`, `ssrf`, `rate_limit`, `paste_size_cap`, `security_headers`, `share_tokens`, `sync_limits`. New endpoints should get coverage in the same spirit, not just a happy-path test.

## Security posture

- Rate limiting via `tower_governor`; size and timeout caps come from `Config` (`import_max_size`, `import_timeout_secs`, `paste_max_size`, `sync_max_files`, `sync_max_settings`) — add new limits there rather than hardcoding.
- CORS is driven by `CORS_ORIGIN` / `CORS_ORIGIN_REGEX`; PR preview environments rely on the regex form, so don't replace it with a fixed list.
- Anything that fetches a user-supplied URL must keep the SSRF guards in place — see `tests/ssrf.rs`.
- Never log tokens, secrets, or full `DATABASE_URL`s.
