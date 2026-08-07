---
description: Validate, commit with a conventional message, and open a PR
argument-hint: "[optional: what this change is about]"
allowed-tools: Bash(git:*), Bash(gh:*), Bash(cd:*), Bash(make:*), Read, Edit
---

Get the current work committed and proposed. Context: $ARGUMENTS

1. **See what's actually changed** — `git status --short` and `git diff` (plus `git diff --cached`). Don't commit files you didn't touch, and don't `git add -A` blindly; stage deliberately. Never stage `.env*` files other than `.env.example`.

2. **Run the gate for the changed halves** — the same checks as `/verify`:
   - frontend: `cd app && make typecheck && make lint && make test`
   - backend: `cd server && make fmt-check && make lint && make test`
   - migrations or SQL changed: `make sqlx-check` from the root, and stage `server/.sqlx/` if it was regenerated.

   Fix failures before committing. If something can't be fixed here, stop and say so rather than committing red.

3. **Branch** — if on `main`, create a branch first (`feat/...`, `fix/...` matching the commit type).

4. **Commit.** commitlint runs on `commit-msg` and will reject a bad message. Requirements:
   - `type(scope): subject` with type from `feat fix docs style refactor perf test build ci chore revert deps`
   - lower-case type, no trailing period, header ≤ 160 chars
   - blank line before body and before footer; body lines ≤ 200 chars
   - scope should name the area (`tabs`, `file-explorer`, `sync`, `auth`, `server`)

   lefthook also runs lint-staged, `cargo fmt --check`, and `cargo clippy -D warnings` on commit. If the hook rejects the commit, fix the code — don't bypass with `--no-verify`.

5. **Push and open the PR** with `gh pr create`, base `main`. The body should say what changed and why, and call out anything that needs attention: migrations (they auto-apply to production Supabase on merge), new env vars, or new secrets the workflows expect. Note that `pr-preview.yml` will spin up a Railway + Vercel preview stack.

Report the branch, the commit subject, and the PR URL.
