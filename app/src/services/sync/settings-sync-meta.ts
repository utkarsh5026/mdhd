const META_KEY = 'mdhd-settings-sync-meta';

interface SettingMeta {
  hash: string;
  updated_at: string;
}

type SettingsSyncMeta = Record<string, SettingMeta>;

/** Load the settings sync metadata from localStorage. */
export function loadSyncMeta(): SettingsSyncMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as SettingsSyncMeta) : {};
  } catch {
    return {};
  }
}

/** Persist the settings sync metadata to localStorage. */
export function saveSyncMeta(meta: SettingsSyncMeta): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/** Get the metadata for a specific store key. */
export function getSettingMeta(key: string): SettingMeta | undefined {
  return loadSyncMeta()[key];
}

/** Update the metadata for a specific store key. */
export function setSettingMeta(key: string, hash: string, updatedAt: string): void {
  const meta = loadSyncMeta();
  meta[key] = { hash, updated_at: updatedAt };
  saveSyncMeta(meta);
}
