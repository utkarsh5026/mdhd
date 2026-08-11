# MDHD — frontend

React 19 + TypeScript + Vite, styled with Tailwind v4 and shadcn/ui (new-york, neutral base). State is Zustand. Persistence is IndexedDB for file content and `localStorage` for settings. Package manager is Bun.

The React Compiler (`babel-plugin-react-compiler`) is enabled — **do not hand-add `useMemo` / `useCallback` / `memo` for performance**. Add them only when you need referential stability for correctness (dependency of an effect, an external subscription, a key into a cache).

## Commands

```bash
make dev         # vite on :5173, proxies /api and /auth to VITE_API_URL or localhost:8080
make typecheck   # tsc -b — run this after every change
make lint        # eslint (also enforces import sorting)
make lint-fix    # eslint --fix; fixes import order for you
make format      # prettier
make test        # vitest
make knip        # dead code / unused dependency report
make validate    # full pre-push gate
```

## Layout

```
src/
  components/
    features/<feature>/    # self-contained feature: components/ hooks/ store/ index.ts
    layout/                # header, sidebar, home, status bar, welcome screen
    shared/                # cross-feature pieces (theme picker, offline indicator)
    ui/                    # shadcn primitives — generated, edit sparingly
    utils/                 # error boundaries, loading bars
  services/<domain>/       # non-React logic: auth, files, indexeddb, markdown, section, sync, tabs, ...
  hooks/                   # generic hooks (use-async, use-mobile, use-local-storage, ...)
  lib/                     # utils, constants, fonts, store-utils
  utils/                   # small pure helpers (string, time, hash, array)
  theme/themes.ts          # color theme definitions
```

`@/` maps to `src/`. Always import through the alias, never with `../../..`.

### Feature folders

A feature under `components/features/` owns its components, hooks, and store, and exposes **exactly one** public surface: `index.ts`. Cross-feature imports must go through that barrel (`@/components/features/tabs`), never deep into a feature's internals. Inside a feature, import relatively.

Barrels re-export named symbols explicitly — see `components/features/tabs/index.ts`. Don't `export *` from a feature barrel; store-level barrels do that, feature barrels don't.

## Conventions

- **Files are kebab-case** (`tab-context-menu.tsx`, `use-tab-close.ts`). Components are PascalCase, hooks are `useX` in `use-x.ts`.
- **Prettier**: single quotes, semicolons, 100 col, 2-space, ES5 trailing commas. Don't hand-format; run `make format`.
- **Imports are sorted by `simple-import-sort` and this is an error, not a warning.** `make lint-fix` handles it.
- **TSDoc on anything exported.** Stores, public hooks, service functions, and non-obvious types get a doc comment explaining intent and units/ranges (`/** Maximum width (in px)... Clamped to 500–900. */`). Follow the density already in `services/auth/api-client.ts` and `lib/store-utils.ts`.
- **`tsconfig` is strict** with `noUnusedLocals` and `noUnusedParameters`. Unused imports break the build, not just the lint.

## Zustand stores

Pattern used throughout (`components/features/settings/store/reading-settings-store.ts` is the reference):

- A store lives in its feature's `store/` folder; large stores split into slices (`typography-slice.ts`, `tts-slice.ts`) combined in the root store file.
- Persist to `localStorage` under a `STORAGE_KEY` const, with a `loadInitialSettings()` that falls back field-by-field to `DEFAULT_SETTINGS` (`parsed.x ?? DEFAULT.x`). Never trust the parsed blob's shape — versions drift.
- Guard `typeof window === 'undefined'` before touching `localStorage`.
- Use `tryCatch` from `@/utils/error` around `JSON.parse`.
- Export **selector hooks**, not the raw store, to consumers: `useTabs()`, `useActiveTab()`, `useTabsActions()`. Multi-field selectors use `useShallow`.
- Immutable updates go through `patch` / `patchNested` from `@/lib/store-utils` instead of nested spreads.

## Release announcements

User-visible changes are announced in-app by the `whats-new` feature. The only file you edit is
`components/features/whats-new/data/releases.ts` — prepend a `Release` to `RELEASES` (newest first)
with **at most three** highlights, each a lucide icon plus one plain-language sentence. The modal
auto-opens once per device for the newest `id`, skips first-time visitors, and can be reopened from
the release-notes icon in the sidebar rail. The `/pr` command does this as part of opening a pull
request; see [.claude/commands/pr.md](../.claude/commands/pr.md) for the copy rules — the voice is
deliberately flat, and the design leans on hairline rules and type weight rather than cards, tinted
icon tiles, or gradients.

## Data and networking

- File content lives in IndexedDB (`mdhd-files`, object stores `files` + `directories`, tree assembled from parent-path indexes). Go through `services/indexeddb/`, never open the DB directly.
- API calls use `apiFetch` (for `/api/*`) or `authFetch` (for `/auth/*`) from `@/services/auth` — they attach the bearer token, set JSON content-type, and turn non-2xx into thrown errors. Don't call `fetch` directly for our own endpoints.
- Sync lives in `services/sync/`. Anything that should follow a user across devices must be registered there; check `syncable-settings.ts` before inventing a new path.

## Tests

Vitest with jsdom and `globals: true`. Tests sit next to the code as `*.test.ts` (`services/section/parsing.test.ts`). `fake-indexeddb` is available for IndexedDB-backed code. Testing Library is installed for component tests. Run a single file with `bunx vitest run src/path/to/file.test.ts`.

## Bundle

Vite does manual chunking (`codemirror`, `ui-vendor`, `state-vendor`, `vendor`) and there is a size-limit budget. Anything large — CodeMirror language modes, export/PDF paths — should be lazily imported. Check `make knip` before adding a dependency; something equivalent may already be in the tree.
