import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LATEST_RELEASE } from '../data/releases';

const STORAGE_KEY = 'mdhd-whats-new';

/**
 * The store reads localStorage at module scope, so each case has to set the
 * world up *before* importing it.
 */
async function freshStore() {
  vi.resetModules();
  return import('./whats-new-store');
}

/** Current state of a freshly-imported store module. */
function stateOf(store: Awaited<ReturnType<typeof freshStore>>) {
  return store.useWhatsNewStore.getState();
}

describe('whats-new store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stays silent for a first-time visitor and records the release as seen', async () => {
    const store = await freshStore();

    stateOf(store).announceLatest();

    expect(stateOf(store).isOpen).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      lastSeenReleaseId: LATEST_RELEASE.id,
    });
  });

  it('announces to a returning reader who has never seen a release', async () => {
    localStorage.setItem('mdhd-tabs-storage', '{"state":{}}');
    const store = await freshStore();

    stateOf(store).announceLatest();

    expect(stateOf(store).isOpen).toBe(true);
  });

  it('does not re-announce a release that was already dismissed', async () => {
    localStorage.setItem('mdhd-tabs-storage', '{"state":{}}');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastSeenReleaseId: LATEST_RELEASE.id }));
    const store = await freshStore();

    stateOf(store).announceLatest();

    expect(stateOf(store).isOpen).toBe(false);
  });

  it('announces again once a newer release ships', async () => {
    localStorage.setItem('mdhd-tabs-storage', '{"state":{}}');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastSeenReleaseId: 'some-older-release' }));
    const store = await freshStore();

    stateOf(store).announceLatest();

    expect(stateOf(store).isOpen).toBe(true);
  });

  it('persists the latest release id on dismiss', async () => {
    localStorage.setItem('mdhd-tabs-storage', '{"state":{}}');
    const store = await freshStore();

    stateOf(store).announceLatest();
    stateOf(store).dismiss();

    expect(stateOf(store).isOpen).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      lastSeenReleaseId: LATEST_RELEASE.id,
    });
  });

  it('reopens on demand without changing what counts as seen', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastSeenReleaseId: LATEST_RELEASE.id }));
    const store = await freshStore();

    stateOf(store).open();

    expect(stateOf(store).isOpen).toBe(true);
    expect(stateOf(store).lastSeenReleaseId).toBe(LATEST_RELEASE.id);
  });

  it('falls back to defaults when the stored blob is malformed', async () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    const store = await freshStore();

    expect(stateOf(store).lastSeenReleaseId).toBeNull();
  });
});
