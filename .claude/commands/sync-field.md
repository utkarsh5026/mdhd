---
description: Make a piece of user state sync across devices, end to end
argument-hint: <what should sync, e.g. "per-tab reading font override">
allowed-tools: Bash(cd:*), Bash(make:*), Read, Write, Edit, Grep, Glob
---

Make this follow the user across devices: $ARGUMENTS

This is the repo's most cross-cutting change — it touches migrations, the API, the sync service, and a store. Work through it in order and don't skip the offline path.

## 0. Decide whether it belongs in sync at all

MDHD works fully offline against IndexedDB; the server is optional. Device-specific state (window layout, transient UI) should **not** sync. Read [app/src/services/sync/syncable-settings.ts](app/src/services/sync/syncable-settings.ts) — if something equivalent is already registered, extend it instead of adding a parallel path.

## 1. Storage

If a new column or table is needed, follow [/migration](.claude/commands/migration.md): `cd server && make migrate-add <name>`, write a forward-safe migration, `make migrate`, update the struct in `server/src/models/`, then `make sqlx-prepare` from the root and stage `server/.sqlx/`.

Respect the existing caps in `Config` (`sync_max_files`, `sync_max_settings`) — if this materially changes payload size, adjust them there rather than hardcoding a new limit.

## 2. Server

Extend the relevant handler in `server/src/routes/` (usually `sync.rs` or `settings.rs`) and the logic in `server/src/services/sync.rs`. Keep the `AuthUser` ownership check on every path. Add coverage to `server/tests/`, including `sync_limits.rs` if you changed a bound.

## 3. Client

- Add the field to the store that owns it, keeping the persisted-load fallback (`parsed.x ?? DEFAULT.x`) so older localStorage blobs still load.
- Register it in `app/src/services/sync/` (`syncable-settings.ts`, and `settings-sync-meta.ts` if it needs conflict metadata).
- Add or extend the client call in the domain's `api.ts` using `apiFetch`.
- **Handle the unauthenticated and offline cases**: local state must still work and must not throw when the server is unreachable or the user is logged out.

## 4. Conflict behaviour

Say explicitly, in the code or a comment, what happens when local and remote disagree — last-write-wins, merge, or server-authoritative. Match what `sync-service.ts` already does for neighbouring fields rather than inventing a new rule.

## 5. Verify

```
cd server && make lint && make test
cd app && make typecheck && make lint && make test
```

`app/src/services/sync/sync-service.test.ts` is the place to add a client-side regression test.

Report what syncs, the conflict rule, and how it behaves logged out.
