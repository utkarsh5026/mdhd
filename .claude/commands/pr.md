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

Rules for the copy. **Write like a colleague pointing out a change, not like a product launch.** This modal interrupts someone's reading, so it earns its place by being short, specific, and flat in tone. Anything that sounds like marketing is worse than saying nothing.

- **Three highlights maximum.** Two is usually better; one is fine. If the branch did five things, pick the ones a user would actually notice and drop the rest. Never add a fourth — the modal slices at three anyway.
- **Plain language, user's point of view.** "Jump to the paragraph it appears in", not "adds fuzzy content indexing across the IndexedDB store". No component names, file paths, library names, or internal jargon.
- **Say what they can now do**, not what we built. Lead with the thing itself.
- **Keep it tight.** `title` under ~34 characters so it stays on one line; `description` a single plain sentence. The headline `title` is sentence case with no trailing period; the `tagline` is one short line on what the release is.
- Set `version` by bumping the previous entry's: minor for a feature, patch for a fix.

### Voice — do not do these

These are the tells that make a release note read as machine-written. Reject your own first draft if it has any of them.

- **No kicker clauses after an em dash.** "…tells you what changed — then gets out of your way." Cut everything after the dash, or split it into a sentence. One em dash per entry, at most.
- **Don't personify the app.** No "MDHD now introduces itself", "your documents come alive", "the sidebar remembers you".
- **No rhetorical questions.** "Missed one?" "Ever wanted to…?"
- **No hype adjectives or adverbs**: seamless, effortless, powerful, beautiful, blazing, delightful, simply, instantly, magically. If the feature is good, the plain description already shows it.
- **No self-congratulation about the announcement itself.** Describe the feature, not how nice it is that you're telling them.
- **No exclamation marks and no emoji.**
- Prefer concrete nouns to abstractions: "the icon at the bottom of the sidebar" beats "a convenient location".

Test each line by asking: would a maintainer write this in a commit body? If it only works as ad copy, rewrite it.

### Icons

Pick the icon for the actual surface the change touches — `Search` for search, `PanelLeft` for the sidebar, `FileText` for documents, `Palette` for theming, `Keyboard` for shortcuts, `Cloud` for sync, `ScrollText` for notes. Concrete beats decorative.

**Do not use** `Sparkles`, `Wand`, `WandSparkles`, `Rocket`, `Zap`, `Star`, or `PartyPopper`. They carry no information and they are the visual signature of generated UI.

Import the icon at the top of the file and prune imports that are no longer used, or the strict build will fail.

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
