#!/usr/bin/env node
/**
 * Guards the offline build.
 *
 * MDHD's whole premise is that a device that has visited once can keep reading
 * with no connection, and that rests entirely on the Workbox precache in
 * `dist/sw.js`. The failure mode this script exists for is silent: Workbox
 * rejects its manifest at *runtime*, inside the service worker, where nothing
 * in the build or in CI can see it. The build succeeds, the deploy succeeds,
 * the app looks fine — and then it does not open on a plane.
 *
 * The known trigger is two entries for one URL with different revisions
 * (`add-to-cache-list-conflicting-entries`), which happens when a plugin adds a
 * `public/` file to the manifest hashed from its source bytes while Workbox
 * globs the same file out of `dist` after another plugin has rewritten it.
 *
 * Runs after `vite build`. Exits non-zero with an explanation on any problem.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const SW = resolve(DIST, 'sw.js');

/** Files without which the app cannot boot offline at all. */
const REQUIRED_ENTRIES = ['index.html'];

/** Minimum plausible entry count — a near-empty manifest means the glob broke. */
const MIN_ENTRIES = 10;

const fail = (message, detail) => {
  console.error(`\n✗ Offline precache check failed: ${message}`);
  if (detail) console.error(detail);
  console.error('\nSee app/scripts/verify-precache.mjs for what this protects.\n');
  process.exit(1);
};

let source;
try {
  source = readFileSync(SW, 'utf8');
} catch {
  fail(
    'dist/sw.js was not generated.',
    'vite-plugin-pwa did not emit a service worker, so the app will not open offline.'
  );
}

const entries = [...source.matchAll(/\{url:"([^"]+)",revision:(?:"([^"]*)"|null)\}/g)].map(
  ([, url, revision]) => ({ url, revision: revision ?? null })
);

if (entries.length < MIN_ENTRIES) {
  fail(
    `only ${entries.length} precache entries found (expected at least ${MIN_ENTRIES}).`,
    'Check `workbox.globPatterns` in vite.config.ts.'
  );
}

const revisionsByUrl = new Map();
for (const { url, revision } of entries) {
  if (!revisionsByUrl.has(url)) revisionsByUrl.set(url, new Set());
  revisionsByUrl.get(url).add(revision);
}

const conflicts = [...revisionsByUrl.entries()].filter(([, revisions]) => revisions.size > 1);
if (conflicts.length > 0) {
  fail(
    `${conflicts.length} file(s) listed twice with different revisions.`,
    [
      'Workbox throws `add-to-cache-list-conflicting-entries` for these and caches NOTHING:',
      ...conflicts.map(([url, revisions]) => `  ${url}: ${[...revisions].join(' vs ')}`),
      '',
      'Usual cause: `includeAssets` / `includeManifestIcons` re-adding a public/ file',
      'that another plugin (e.g. ViteImageOptimizer) rewrites on the way into dist.',
    ].join('\n')
  );
}

const missing = REQUIRED_ENTRIES.filter((url) => !revisionsByUrl.has(url));
if (missing.length > 0) {
  fail(`the app shell is not precached (missing: ${missing.join(', ')}).`);
}

console.log(`✓ Offline precache looks good — ${entries.length} entries, no conflicting revisions.`);
