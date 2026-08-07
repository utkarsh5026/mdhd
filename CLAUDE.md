# MDHD

Turns long markdown into focused, section-by-section reading sessions. Two halves in one repo:

| Path      | What it is                                     |
| --------- | ---------------------------------------------- |
| `app/`    | React 19 + TypeScript + Vite SPA (Bun, Vercel)  |
| `server/` | Rust + Axum + SQLx/Postgres API (Docker, Railway) |

The app works fully offline against IndexedDB. The server is **optional** — it only adds auth, cross-device sync, and share links. Never make a frontend feature hard-depend on the server being up.

Each half has its own `CLAUDE.md` with detail: [app/CLAUDE.md](app/CLAUDE.md), [server/CLAUDE.md](server/CLAUDE.md). Read the relevant one before editing that half.

## Commands

Everything runs through `make`, which delegates to `makefile.mjs`. Run `make help` in any of the three directories (root, `app/`, `server/`) to see that level's targets.

From the repo root — these fan out to **both** halves:

```bash
make setup       # first-time: deps, git hooks, python venv, containers, migrate, build
make dev         # client on :5173 + server on :8080 (server auto-restarts; needs cargo-watch)
make test        # vitest + cargo test
make lint        # eslint + clippy + ruff
make fmt         # prettier + cargo fmt + ruff
make pre-commit  # fmt-check + lint + test — the full CI gate
```

Frontend-only work: `cd app && make dev|test|lint|typecheck`.
Backend-only work: `cd server && make dev|test|migrate|db-shell`.

Package manager is **Bun** (version pinned in `.bun-version`). Do not use npm or yarn — the lockfile is `app/bun.lock`.

## Working agreements

- **Verify before claiming done.** For frontend changes run `cd app && make typecheck && make lint`; for backend run `cd server && make lint && make test`. Both are fast and both are enforced in CI.
- **Commits are conventional and linted** by commitlint on `commit-msg`. Allowed types: `feat fix docs style refactor perf test build ci chore revert deps`. Subject must not end in a period; header ≤ 160 chars.
- **lefthook runs on every commit** — lint-staged for the frontend, `cargo fmt --check` + `cargo clippy -D warnings` for Rust, ruff for `server/scripts/`. If a commit is rejected, fix the code rather than bypassing the hook.
- **Doc comments are part of the style here.** Rust modules open with `//!` describing the module and, for route files, a table of the endpoints they mount. Exported TS functions, stores, and non-obvious types carry TSDoc. Match that density in new code.
- Don't add dependencies without a reason that can't be met by what's already installed — the frontend bundle is manually chunked and size-budgeted.

## Cross-cutting: how a change reaches both halves

Adding a synced piece of user data usually touches all of these, in order:

1. `server/migrations/NNN_*.sql` — new table or column
2. `server/src/models/` — the row struct
3. `server/src/routes/` — handler + `router()`, then `merge`d in `routes/mod.rs`
4. `cd server && make sqlx-prepare` — regenerate the `.sqlx/` offline cache, **commit it** (CI builds with `SQLX_OFFLINE=true` and will fail without it)
5. `app/src/services/<domain>/api.ts` — client call via `apiFetch` from `@/services/auth`
6. `app/src/services/sync/` — if it should sync, register it there
7. Zustand store + UI in `app/src/components/features/<feature>/`

## Environments

- `server/.env.example` documents every variable; only `DATABASE_URL` and `JWT_SECRET` are required to boot. Copy to `.env` / `.env.development`.
- Local Postgres + MinIO come from `server/docker-compose.dev.yml` (`cd server && make up`).
- Never commit `.env*` files other than `.env.example`, and never print secrets into logs or test output.

## CI

`.github/workflows/ci.yml` runs lint, format-check, typecheck, test, and build for the app; the Rust jobs run fmt/clippy/test. Other workflows: `migrate.yml` applies Supabase migrations on pushes touching `server/migrations/`, `pr-preview.yml` spins a Railway + Vercel preview stack per PR, `storage-gc.yml` is a nightly orphan-file sweep, `codeql.yml` scans JS/TS.
