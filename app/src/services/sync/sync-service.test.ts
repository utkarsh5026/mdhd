import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

vi.mock('@/services/auth', () => ({
  apiFetch: vi.fn(),
  apiFetchText: vi.fn(),
}));

vi.mock('@/utils/hash', () => ({
  sha256: vi.fn((input: string) => Promise.resolve(`hash-of-${input}`)),
}));

vi.mock('@/services/indexeddb/file-db', () => ({
  fileStorageDB: {
    getAllFilesForSync: vi.fn().mockResolvedValue([]),
    getFile: vi.fn(),
    getFileByPath: vi.fn(),
    batchUpsertFiles: vi.fn(),
    batchDeleteFiles: vi.fn(),
  },
  getParentPath: vi.fn((p: string) => p.split('/').slice(0, -1).join('/') || '/'),
}));

import { apiFetch } from '@/services/auth';

import { setSettingMeta } from './settings-sync-meta';
import { getSyncPreferencesState } from './sync-preferences-store';
import { performSettingsSync } from './sync-service';
import { type SyncableStore, syncableStores } from './syncable-settings';
import type { SettingsSyncResponse } from './types';

interface FakeSyncableStore extends SyncableStore {
  written: Record<string, unknown>[];
}

const DEFAULT_STORE_VALUE: Record<string, unknown> = { foo: 'bar' };

function makeStore(
  key: string,
  value: Record<string, unknown> | null = DEFAULT_STORE_VALUE
): FakeSyncableStore {
  const written: Record<string, unknown>[] = [];
  return {
    key,
    label: key,
    read: () => value,
    write: (v) => written.push(v),
    written,
  };
}

function useFakeStores(fakes: SyncableStore[]) {
  syncableStores.length = 0;
  syncableStores.push(...fakes);
}

function parseSentBody(): { settings: { key: string; hash: string; updated_at: string }[] } {
  const call = (apiFetch as Mock).mock.calls[0];
  return JSON.parse(call[1].body as string);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  getSyncPreferencesState().setKeyEnabled('theme', true);
});

describe('performSettingsSync', () => {
  it('pushes all local settings on first sync', async () => {
    const store = makeStore('reading-settings');
    useFakeStores([store]);

    const mockResponse: SettingsSyncResponse = {
      accepted: ['reading-settings'],
      updated: [],
      server_time: '2026-03-27T00:00:00Z',
    };
    (apiFetch as Mock).mockResolvedValueOnce(mockResponse);

    const result = await performSettingsSync();

    expect(result).toEqual({ pushed: 1, pulled: 0 });
    const body = parseSentBody();
    expect(body.settings).toHaveLength(1);
    expect(body.settings[0].key).toBe('reading-settings');
  });

  it('applies server-updated settings to the local store', async () => {
    const store = makeStore('theme');
    useFakeStores([store]);

    const serverValue = { currentTheme: 'dark-rose' };
    const mockResponse: SettingsSyncResponse = {
      accepted: [],
      updated: [
        {
          key: 'theme',
          value: serverValue,
          hash: 'server-hash',
          updated_at: '2026-03-27T01:00:00Z',
        },
      ],
      server_time: '2026-03-27T01:00:00Z',
    };
    (apiFetch as Mock).mockResolvedValueOnce(mockResponse);

    const result = await performSettingsSync();

    expect(result).toEqual({ pushed: 0, pulled: 1 });
    expect(store.written).toEqual([serverValue]);
  });

  it('excludes disabled keys from the sync payload', async () => {
    const store = makeStore('theme');
    useFakeStores([store]);

    // Disable the key via the preferences store
    getSyncPreferencesState().setKeyEnabled('theme', false);

    const result = await performSettingsSync();

    expect(result).toEqual({ pushed: 0, pulled: 0 });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('skips stores that return null from read()', async () => {
    const nullStore = makeStore('code-theme-storage', null);
    const validStore = makeStore('reading-settings');
    useFakeStores([nullStore, validStore]);

    const mockResponse: SettingsSyncResponse = {
      accepted: ['reading-settings'],
      updated: [],
      server_time: '2026-03-27T00:00:00Z',
    };
    (apiFetch as Mock).mockResolvedValueOnce(mockResponse);

    await performSettingsSync();

    const body = parseSentBody();
    expect(body.settings).toHaveLength(1);
    expect(body.settings[0].key).toBe('reading-settings');
  });

  it('reuses previous updated_at when hash is unchanged', async () => {
    const value = { dark: true };
    const store = makeStore('theme', value);
    useFakeStores([store]);

    const expectedHash = `hash-of-${JSON.stringify(value)}`;
    setSettingMeta('theme', expectedHash, '2026-03-20T00:00:00Z');

    const mockResponse: SettingsSyncResponse = {
      accepted: ['theme'],
      updated: [],
      server_time: '2026-03-27T00:00:00Z',
    };
    (apiFetch as Mock).mockResolvedValueOnce(mockResponse);

    await performSettingsSync();

    const body = parseSentBody();
    expect(body.settings[0].updated_at).toBe('2026-03-20T00:00:00Z');
  });

  it('updates meta for accepted keys with server_time', async () => {
    const store = makeStore('theme', { dark: true });
    useFakeStores([store]);

    const mockResponse: SettingsSyncResponse = {
      accepted: ['theme'],
      updated: [],
      server_time: '2026-03-27T05:00:00Z',
    };
    (apiFetch as Mock).mockResolvedValueOnce(mockResponse);

    await performSettingsSync();

    const { loadSyncMeta } = await import('./settings-sync-meta');
    const meta = loadSyncMeta();
    expect(meta['theme']?.updated_at).toBe('2026-03-27T05:00:00Z');
  });

  it('updates meta for server-pushed entries', async () => {
    const store = makeStore('theme');
    useFakeStores([store]);

    const mockResponse: SettingsSyncResponse = {
      accepted: [],
      updated: [
        {
          key: 'theme',
          value: { mode: 'light' },
          hash: 'new-server-hash',
          updated_at: '2026-03-27T06:00:00Z',
        },
      ],
      server_time: '2026-03-27T06:00:00Z',
    };
    (apiFetch as Mock).mockResolvedValueOnce(mockResponse);

    await performSettingsSync();

    const { loadSyncMeta } = await import('./settings-sync-meta');
    const meta = loadSyncMeta();
    expect(meta['theme']).toEqual({
      hash: 'new-server-hash',
      updated_at: '2026-03-27T06:00:00Z',
    });
  });

  it('returns zero counts when no stores are registered', async () => {
    useFakeStores([]);

    const result = await performSettingsSync();

    expect(result).toEqual({ pushed: 0, pulled: 0 });
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
