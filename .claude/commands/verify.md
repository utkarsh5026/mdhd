---
description: Run the right quality gate for whatever changed (frontend, backend, or both)
argument-hint: "[app|server|all] (default: infer from git diff)"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(make:*), Bash(cd:*), Read, Edit
---

Run the project's quality gate and fix what it reports.

Scope: $ARGUMENTS — if empty, infer it from `git status --short` plus `git diff --stat` against `main`. Touching `app/` means frontend, `server/` means backend, both means both.

## Frontend gate

```
cd app && make typecheck && make lint && make test
```

## Backend gate

```
cd server && make fmt-check && make lint && make test
```

Plus, if this change touched `server/migrations/` or any `sqlx::query!` / `query_as!` call site:

```
make sqlx-check   # from the repo root
```

If that fails, run `make sqlx-prepare` (needs the dev database up: `cd server && make up`) and stage the regenerated `.sqlx/` files — CI builds offline and will fail without them.

## Then

- Fix every failure rather than reporting it back unfixed. Lint import-order errors are auto-fixable with `cd app && make lint-fix`.
- Re-run the gate after fixing until it's green.
- Report the actual final state: which commands ran, which passed, and anything you deliberately left failing and why. Don't claim green without having seen it.
