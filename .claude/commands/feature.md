---
description: Scaffold a new frontend feature folder following the project's structure
argument-hint: <feature name and what it does>
allowed-tools: Bash(cd:*), Bash(make:*), Bash(ls:*), Read, Write, Edit, Grep, Glob
---

Build a new feature under `app/src/components/features/`: $ARGUMENTS

Read [app/CLAUDE.md](app/CLAUDE.md) first if it isn't in context. Use [app/src/components/features/tabs/](app/src/components/features/tabs/) as the structural reference.

## Structure

```
app/src/components/features/<kebab-name>/
  components/        # feature UI, grouped into subfolders when it grows past a handful
  hooks/             # use-*.ts specific to this feature
  store/             # zustand store + slices, if the feature owns state
  index.ts           # the ONLY public surface
```

- Files kebab-case, components PascalCase, hooks `useX` in `use-x.ts`.
- `index.ts` re-exports named symbols **explicitly** (no `export *` at the feature level). Store-level `store/index.ts` may `export *`.
- Anything outside the feature imports from `@/components/features/<name>` — never a deep path. Inside the feature, import relatively.
- Reuse `@/components/ui` primitives rather than hand-rolling buttons, dialogs, or popovers. Check what exists before adding a shadcn component.
- Reuse existing hooks from `@/hooks` (`use-async`, `use-mobile`, `use-local-storage`, `use-key-press`, `use-toggle`, ...) before writing new ones.
- The React Compiler is on — don't add `useMemo`/`useCallback`/`memo` for performance, only for correctness.
- TSDoc every exported symbol.

## State

If the feature needs persisted state, follow the store pattern described in `app/CLAUDE.md`: `STORAGE_KEY` const, field-by-field `??` fallback to defaults when loading, `typeof window` guard, `tryCatch` around `JSON.parse`, selector hooks (not the raw store) as the public API, and `patch`/`patchNested` from `@/lib/store-utils` for updates.

## Wire it up

Mount the feature where it belongs — usually `components/layout/` or a route in `src/router.tsx`. A feature nobody renders isn't done.

## Verify

```
cd app && make typecheck && make lint && make test
```

Report the files created, the public API in `index.ts`, and where the feature is mounted.
