---
description: Add an API endpoint end-to-end — Axum route, tests, and the frontend client call
argument-hint: <endpoint description, e.g. "PATCH /api/files/:id/archive to toggle archive">
allowed-tools: Bash(cd:*), Bash(make:*), Read, Write, Edit, Grep, Glob
---

Add this endpoint across both halves of the stack: $ARGUMENTS

Read [server/CLAUDE.md](server/CLAUDE.md) and [app/CLAUDE.md](app/CLAUDE.md) first if they aren't already in context.

## 1. Server

Use [server/src/routes/bookmarks.rs](server/src/routes/bookmarks.rs) as the shape to copy.

- Put the handler in the existing `routes/<resource>.rs` if one fits; only create a new module (and `merge` it in [routes/mod.rs](server/src/routes/mod.rs)) for a genuinely new resource.
- Module-level `//!` doc comment, and update the endpoint table in it.
- Request struct `#[derive(Debug, Deserialize)]`, response struct `#[derive(Debug, Serialize)]` as a projection of the model that omits `user_id` and other internals, with `impl From<Model> for XResponse`.
- Take `AuthUser` as a parameter for anything user-scoped. Then **check ownership** — verify the target row's `user_id` matches `auth.user_id` before reading or mutating. Authentication is not authorization.
- Return `Result<T, AppError>`; use `OptionExt` for `None` → 404 and `AppError::bad_request` for validation. Never leak a raw `sqlx::Error` into a response.
- `#[instrument]` on the handler.
- If the request body can be large or unbounded, cap it via a `Config` field rather than a hardcoded constant.

If the query is new or changed: `make sqlx-prepare` from the root and stage `server/.sqlx/`.

## 2. Server tests

Add coverage in [server/tests/](server/tests/) using the helpers in `tests/common/mod.rs` and `oneshot`. Beyond the happy path, cover what the existing suite cares about: unauthenticated access is 401, another user's row is 404/403 (extend `cross_user_authz.rs`), and oversized or malformed input is rejected.

## 3. Frontend client

- Add the call to `app/src/services/<domain>/api.ts`, using `apiFetch` from `@/services/auth` (or `authFetch` for `/auth/*` paths). Don't call `fetch` directly.
- Type the response to match the server's response struct exactly.
- Export it from the domain's `index.ts`.
- If this data should follow the user across devices, wire it into `app/src/services/sync/`.
- Remember the app must still work with the server unreachable — handle the failure path rather than assuming success.

## 4. Verify

```
cd server && make lint && make test
cd app && make typecheck && make lint
```

Report the final route signature, the auth/ownership checks you added, and the tests that cover it.
