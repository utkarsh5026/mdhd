---
description: Add a Postgres migration and regenerate the SQLx offline cache
argument-hint: <what the migration should do, e.g. "add archived flag to files">
allowed-tools: Bash(cd:*), Bash(make:*), Bash(ls:*), Bash(git add:*), Read, Write, Edit, Grep, Glob
---

Add a database migration for: $ARGUMENTS

Follow this order exactly — skipping step 4 breaks CI.

1. **Look before writing.** Read the latest files in [server/migrations/](server/migrations/) to match numbering and style, and read the relevant struct in [server/src/models/](server/src/models/) so the column types line up with what Rust expects.

2. **Create the file**: `cd server && make migrate-add <snake_case_name>`. Edit the generated `migrations/NNN_<name>.sql`.

   Migrations are **forward-only** and are applied to the production Supabase database automatically on merge to main (`.github/workflows/migrate.yml`). Write them to be safe against live data:
   - New columns are nullable or carry a `DEFAULT`.
   - Backfill in a separate statement, not via a blocking table rewrite.
   - Add indexes concurrently if the table is large.
   - No destructive `DROP` of a column still referenced by deployed code — split it across two releases.

3. **Apply locally**: `cd server && make up && make migrate`. Confirm with `make db-shell`.

4. **Update the model and any affected queries** in `server/src/models/` and `server/src/routes/`, then regenerate the compile-time query cache:

   ```
   make sqlx-prepare      # from the repo root
   ```

   Stage the changed `server/.sqlx/` files with the rest of the change. CI builds with `SQLX_OFFLINE=true`; a stale cache is a build failure.

5. **Verify**: `cd server && make lint && make test`, then `make sqlx-check` from the root.

Report the migration filename, the columns/tables it changes, and confirmation that `.sqlx/` was regenerated.
