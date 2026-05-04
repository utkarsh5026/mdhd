import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import { fileStorageDB } from '@/services/indexeddb/file-db';
import { deriveNameFromMarkdown, generateRandomName } from '@/utils/name-generator';

/**
 * One-shot migration: pasted content used to live under `/__pastes__/` as a
 * separate concept. This rewrites every paste record into a regular root-level
 * file (named after its first H1/H2, falling back to a random pair) and
 * patches the corresponding tabs in `tabs-store` to be file-backed.
 *
 * Idempotent — gated by a `localStorage` flag so it runs at most once per user.
 */

const MIGRATION_FLAG = 'mdhd-pastes-migrated-v1';
const PASTES_PREFIX = '/__pastes__';
const ROOT = '/';

/** Extract tab id from a legacy paste path: `/__pastes__/${tabId}.md` → `tabId`. */
function tabIdFromPastePath(path: string): string | null {
  if (!path.startsWith(PASTES_PREFIX + '/')) return null;
  const filename = path.split('/').pop();
  if (!filename) return null;
  return filename.replace(/\.md$/, '');
}

/**
 * Pick a unique root-level filename starting from `base`. Tries `${base}.md`,
 * then `${base}-2.md`, …; if collisions exhaust that, re-rolls fresh random
 * names until one is free.
 */
async function uniqueRootPath(base: string): Promise<{ name: string; path: string }> {
  const tryName = async (candidate: string) => {
    const name = `${candidate}.md`;
    const path = `${ROOT}${name}`;
    const existing = await fileStorageDB.getFileByPath(path);
    return existing ? null : { name, path };
  };

  const first = await tryName(base);
  if (first) return first;

  for (let i = 2; i <= 9; i++) {
    const found = await tryName(`${base}-${i}`);
    if (found) return found;
  }

  for (let i = 0; i < 50; i++) {
    const found = await tryName(generateRandomName());
    if (found) return found;
  }

  throw new Error('migrate-pastes: could not allocate a unique filename');
}

/** Resolve once the tabs-store has finished hydrating from localStorage. */
function waitForTabsHydration(): Promise<void> {
  if (useTabsStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = useTabsStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

/**
 * Migrates legacy paste files (stored as `/__pastes__/${tabId}.md`) into regular root-level markdown files.
 *
 * For each paste file:
 *   - Extracts the tabId from its legacy path.
 *   - Attempts to generate a filename from the first heading in the content,
 *     falling back to a human-readable random name (e.g. "brave-otter") if none found.
 *   - Ensures the generated filename does not collide by appending numeric suffixes or rerolling random names.
 *   - Renames the paste file to the unique new filename at the root (`/`).
 *   - Collects updates so that any open tab referencing this paste gets its
 *     sourceFileId and sourcePath updated in the Zustand tabs store.
 *
 * The migration only runs once; its result is flagged in localStorage.
 * If migration fails or is incomplete, the process will re-attempt on next load.
 * Tabs hydration is awaited to guarantee in-memory state is fully loaded before updates are performed.
 *
 * @returns {Promise<void>} Resolves when migration completes or is unnecessary.
 */
export async function migratePastesToFiles(): Promise<void> {
  if (localStorage.getItem(MIGRATION_FLAG) === '1') return;

  try {
    await waitForTabsHydration();

    const pastes = await fileStorageDB.getPasteFiles();
    if (pastes.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, '1');
      return;
    }

    /** Maps tab ID to the new fileId and path after migration for tab update. */
    const tabUpdates = new Map<string, { fileId: string; newPath: string }>();

    for (const paste of pastes) {
      const tabId = tabIdFromPastePath(paste.path);
      const stored = await fileStorageDB.getFile(paste.id);
      const baseName =
        (stored?.content && deriveNameFromMarkdown(stored.content)) ?? generateRandomName();
      const { name, path } = await uniqueRootPath(baseName);
      await fileStorageDB.renameFile(paste.id, name, path, ROOT);
      if (tabId) tabUpdates.set(tabId, { fileId: paste.id, newPath: path });
    }

    // Update the tabs store so tabs that referenced legacy pastes now point to the migrated file
    if (tabUpdates.size > 0) {
      useTabsStore.setState((state) => ({
        tabs: state.tabs.map((t) => {
          const update = tabUpdates.get(t.id);
          if (!update) return t;
          return {
            ...t,
            sourceFileId: update.fileId,
            sourcePath: update.newPath,
          };
        }),
      }));
    }

    localStorage.setItem(MIGRATION_FLAG, '1');
  } catch (err) {
    console.error('[migrate-pastes] Migration failed; will retry on next load:', err);
  }
}
