import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileStorageDB } from '@/services/indexeddb/file-db';

import { useTabsStore } from './tabs-store';

/** Empties both the tab store and IndexedDB so each test starts from a clean app. */
async function reset() {
  await fileStorageDB.clearAll();
  useTabsStore.setState({
    tabs: [],
    activeTabId: null,
    showEmptyState: true,
    untitledCounter: 0,
  });
  localStorage.clear();
}

const actions = () => useTabsStore.getState();

/**
 * Simulates a reload: what localStorage keeps is only what the persist adapter
 * writes, and `content` is deliberately stripped from it. A tab can therefore
 * only get its content back through `sourceFileId`.
 */
async function simulateReload() {
  const persisted = useTabsStore.getState().tabs.map((tab) => ({ ...tab, content: '' }));
  useTabsStore.setState({ tabs: persisted });

  const restored = await Promise.all(
    persisted.map(async (tab) => {
      const file = tab.sourceFileId ? await fileStorageDB.getFile(tab.sourceFileId) : null;
      return { ...tab, content: file?.content ?? '' };
    })
  );
  useTabsStore.setState({ tabs: restored });
}

beforeEach(reset);

describe('openDocument', () => {
  it('stores the document so it appears in the file explorer tree', async () => {
    await actions().openDocument('# Dropped\n\nbody', { filename: 'dropped.md' });

    const tree = await fileStorageDB.buildFileTree();
    expect(tree.map((node) => node.name)).toEqual(['dropped.md']);
  });

  it('opens a file-backed tab pointing at the stored file', async () => {
    const tabId = await actions().openDocument('# Dropped\n\nbody', { filename: 'dropped.md' });

    const tab = actions().getTabById(tabId!);
    expect(tab?.sourceFileId).toBeDefined();
    expect(tab?.sourcePath).toBe('/dropped.md');
    expect(tab?.content).toBe('# Dropped\n\nbody');
    expect(actions().activeTabId).toBe(tabId);
    expect(actions().showEmptyState).toBe(false);
  });

  it('keeps the content across a reload', async () => {
    const tabId = await actions().openDocument('# Dropped\n\nbody', { filename: 'dropped.md' });

    await simulateReload();

    expect(actions().getTabById(tabId!)?.content).toBe('# Dropped\n\nbody');
  });

  it('parses sections so the document is readable immediately', async () => {
    const tabId = await actions().openDocument('# One\n\na\n\n## Two\n\nb', { filename: 'a.md' });

    const { readingState } = actions().getTabById(tabId!)!;
    expect(readingState.sections.length).toBeGreaterThan(0);
    expect(readingState.isInitialized).toBe(true);
  });

  it('titles the tab from the first heading', async () => {
    const tabId = await actions().openDocument('# Real Title\n\nbody', { filename: 'a-file.md' });

    expect(actions().getTabById(tabId!)?.title).toBe('Real Title');
  });

  it('ignores blank content', async () => {
    expect(await actions().openDocument('   \n  ')).toBeNull();
    expect(actions().tabs).toHaveLength(0);
    expect(await fileStorageDB.buildFileTree()).toHaveLength(0);
  });

  describe('when opened from an empty tab', () => {
    it('fills that tab instead of leaving a blank one behind', async () => {
      const emptyTabId = actions().createUntitledTab();

      const tabId = await actions().openDocument('# Filled\n\nbody', {
        filename: 'filled.md',
        reuseTabId: emptyTabId,
      });

      expect(tabId).toBe(emptyTabId);
      expect(actions().tabs).toHaveLength(1);
    });

    it('binds the reused tab to the stored file, so a reload keeps its content', async () => {
      const emptyTabId = actions().createUntitledTab();

      await actions().openDocument('# Filled\n\nbody', {
        filename: 'filled.md',
        reuseTabId: emptyTabId,
      });
      await simulateReload();

      const tab = actions().getTabById(emptyTabId);
      expect(tab?.sourceFileId).toBeDefined();
      expect(tab?.content).toBe('# Filled\n\nbody');
      expect(tab?.title).toBe('Filled');
    });

    it('still stores the document in the file explorer tree', async () => {
      const emptyTabId = actions().createUntitledTab();

      await actions().openDocument('# Filled', {
        filename: 'filled.md',
        reuseTabId: emptyTabId,
      });

      const tree = await fileStorageDB.buildFileTree();
      expect(tree.map((node) => node.name)).toEqual(['filled.md']);
    });

    it('leaves a tab that already holds a document untouched', async () => {
      const busyTabId = await actions().openDocument('# First', { filename: 'first.md' });

      const tabId = await actions().openDocument('# Second', {
        filename: 'second.md',
        reuseTabId: busyTabId!,
      });

      expect(tabId).not.toBe(busyTabId);
      expect(actions().getTabById(busyTabId!)?.content).toBe('# First');
      expect(actions().tabs).toHaveLength(2);
    });
  });
});

describe('createFromPaste', () => {
  it('stores pasted text as a file named after its heading', async () => {
    const tabId = await actions().createFromPaste('# Pasted Notes\n\nbody');

    const tab = actions().getTabById(tabId!);
    expect(tab?.sourcePath).toBe('/pasted-notes.md');
    expect(tab?.sourceFileId).toBeDefined();
  });

  it('keeps pasted content across a reload', async () => {
    const tabId = await actions().createFromPaste('# Pasted\n\nbody');

    await simulateReload();

    expect(actions().getTabById(tabId!)?.content).toBe('# Pasted\n\nbody');
  });
});

describe('updateTabContent', () => {
  // This is the trap openDocument exists to avoid: filling an unsaved tab in
  // memory looks fine until the page reloads, at which point the tab keeps its
  // heading (titles are persisted) but has nothing left to show. Any new entry
  // point for outside documents must persist first — see openDocument.
  it('does not make an unsaved tab survive a reload', async () => {
    const tabId = actions().createUntitledTab();

    actions().updateTabContent(tabId, '# Only in memory');
    await simulateReload();

    const tab = actions().getTabById(tabId);
    expect(tab?.sourceFileId).toBeUndefined();
    expect(tab?.content).toBe('');
  });

  it('writes through to IndexedDB for a file-backed tab', async () => {
    const tabId = await actions().openDocument('# Before', { filename: 'doc.md' });
    const { sourceFileId } = actions().getTabById(tabId!)!;

    actions().updateTabContent(tabId!, '# After');
    await vi.waitFor(async () => {
      expect((await fileStorageDB.getFile(sourceFileId!))?.content).toBe('# After');
    });
  });
});
