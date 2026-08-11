---
description: Open a PR and announce the change in the in-app "What's new" modal
argument-hint: "[optional: what this change is about]"
allowed-tools: Bash(git:*), Bash(gh:*), Bash(cd:*), Bash(make:*), Bash(bunx:*), Read, Edit, Write, Grep, Glob
---

Ship the current branch: write the release note users will see, then open the PR. Context: $ARGUMENTS

This is `/ship` plus the announcement step. Use it for anything a user could notice. For pure chores — CI config, dependency bumps, internal refactors, docs — use `/ship` instead and skip the release entry entirely.

## 1. Read the change

- `git status --short`, `git diff`, `git diff --cached`, and `git log --oneline main..HEAD` to see the full shape of the branch.
- Decide, honestly: **does a user notice this?** New capability, redesigned surface, a fixed bug they hit, something meaningfully faster — yes. Type-level cleanup, test coverage, build tweaks — no. If nothing is user-visible, say so, skip to step 4, and don't touch `releases.ts`.

## 2. Write the release entry

Add one new `Release` object at the **top** of the `RELEASES` array in
[app/src/components/features/whats-new/data/releases.ts](../../app/src/components/features/whats-new/data/releases.ts).
That file is the single source of truth for the modal — nothing else needs editing.

```ts
{
  id: '2026-08-11-inline-search',      // YYYY-MM-DD-slug, unique and never reused
  version: 'v1.1',                     // bump the minor for features, the patch for fixes
  date: '2026-08-11',                  // ISO, today
  title: 'Find anything, without leaving the page',
  tagline: 'Search now reaches inside every document you have open.',
  highlights: [
    {
      icon: Search,                    // any lucide-react icon; add it to the import at the top
      title: 'Search inside documents',
      description: 'Type a phrase and jump straight to the paragraph it lives in.',
    },
  ],
}
```

Rules for the copy — these are what make the modal worth showing:

- **Three highlights maximum.** Two is often better. If the branch did five things, pick the three a user would actually care about and drop the rest. Never add a fourth; the modal slices at three anyway.
- **Plain language, user's point of view.** "Jump straight to the paragraph it lives in", not "adds fuzzy content indexing across the IndexedDB store". No component names, file paths, library names, or internal jargon.
- **Say what they can now do**, not what we built. Lead the description with the benefit.
- **Make it feel good.** Warm and a little excited — not breathless. No exclamation marks, no "revolutionary", no emoji.
- **Keep it tight.** `title` under ~34 characters so it stays on one line; `description` a single sentence.
- The headline `title` is sentence case with no trailing period; the `tagline` is one line on why the release matters as a whole.
- **Pick an icon that reads at a glance** from `lucide-react` — `Search`, `Sparkles`, `Zap`, `FileText`, `Palette`, `Cloud`, `Keyboard`, `BookOpen`, `Highlighter`. Import it at the top of the file and prune imports that are no longer used, or the strict build will fail.
- Set `version` by bumping the previous entry's: minor for a feature, patch for a fix.

Everything else is already handled: the modal auto-opens once per device for the newest `id`, first-time visitors are skipped, and the sidebar sparkle reopens it later.

## 3. Check it still builds

```
cd app && make typecheck && make lint && make test
```

Add the backend gate too if `server/` changed: `cd server && make fmt-check && make lint && make test`, plus `make sqlx-check` from the root if any SQL moved.

Fix failures before committing. Don't commit red.

## 4. Commit, push, open the PR

- Branch first if you're on `main` (`feat/...`, `fix/...` matching the commit type).
- commitlint runs on `commit-msg`: `type(scope): subject`, type from `feat fix docs style refactor perf test build ci chore revert deps`, no trailing period, header ≤ 160 chars, blank line before the body. lefthook also runs lint-staged and the Rust gates — if a hook rejects the commit, fix the code rather than passing `--no-verify`.
- Push with `git push -u origin <branch>`, then open the PR against `main` with `gh pr create` (or the GitHub MCP tools where `gh` isn't available).
- The PR body should cover what changed and why, and flag anything that needs attention: migrations (they auto-apply to production Supabase on merge), new env vars, new workflow secrets. Note that `pr-preview.yml` spins up a Railway + Vercel preview stack.
- Include the release note you wrote in the PR body under a **What users will see** heading, so a reviewer can push back on the wording before it ships.

Report the branch, the commit subject, the PR URL, and the release entry you added.
