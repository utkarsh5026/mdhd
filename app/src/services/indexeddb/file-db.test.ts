import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it } from 'vitest';

import { fileStorageDB, getParentPath, normalizePath } from './file-db';
import type { CreateDirectoryInput, CreateFileInput } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeFile(overrides: Partial<CreateFileInput> = {}): CreateFileInput {
  return {
    name: 'readme.md',
    path: '/readme.md',
    parentPath: '/',
    content: '# Hello',
    size: 7,
    ...overrides,
  };
}

function makeDir(overrides: Partial<CreateDirectoryInput> = {}): CreateDirectoryInput {
  return {
    name: 'docs',
    path: '/docs',
    parentPath: '/',
    ...overrides,
  };
}

describe('normalizePath', () => {
  it('adds a leading slash when absent', () => {
    expect(normalizePath('foo/bar')).toBe('/foo/bar');
  });

  it('strips a trailing slash', () => {
    expect(normalizePath('/foo/bar/')).toBe('/foo/bar');
  });

  it('converts backslashes to forward slashes', () => {
    expect(normalizePath(String.raw`foo\bar\baz`)).toBe('/foo/bar/baz');
  });

  it('preserves the bare root', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('handles a path that already starts with /', () => {
    expect(normalizePath('/already/normalized')).toBe('/already/normalized');
  });
});

// ─── getParentPath ───────────────────────────────────────────────────────────

describe('getParentPath', () => {
  it('returns the parent directory segment', () => {
    expect(getParentPath('/docs/readme.md')).toBe('/docs');
  });

  it('returns / for a top-level path', () => {
    expect(getParentPath('/readme.md')).toBe('/');
  });

  it('handles deeply nested paths', () => {
    expect(getParentPath('/a/b/c/d.md')).toBe('/a/b/c');
  });
});

// ─── FileStorageDB ───────────────────────────────────────────────────────────

describe('FileStorageDB', () => {
  beforeEach(async () => {
    await fileStorageDB.clearAll();
  });

  // ── addFile ────────────────────────────────────────────────────────────────

  describe('addFile', () => {
    it('persists a file and returns the stored record', async () => {
      const file = await fileStorageDB.addFile(makeFile());
      expect(file).not.toBeNull();
      expect(file!.name).toBe('readme.md');
      expect(file!.id).toBeDefined();
      expect(file!.createdAt).toBeGreaterThan(0);
      expect(file!.updatedAt).toBeGreaterThan(0);
    });

    it('normalizes the path before storing', async () => {
      const file = await fileStorageDB.addFile(makeFile({ path: 'readme.md', parentPath: '' }));
      expect(file!.path).toBe('/readme.md');
      expect(file!.parentPath).toBe('/');
    });

    it('returns null when a file at the same path already exists', async () => {
      await fileStorageDB.addFile(makeFile());
      const dup = await fileStorageDB.addFile(makeFile());
      expect(dup).toBeNull();
    });

    it('allows two files with different paths', async () => {
      const a = await fileStorageDB.addFile(makeFile({ name: 'a.md', path: '/a.md' }));
      const b = await fileStorageDB.addFile(makeFile({ name: 'b.md', path: '/b.md' }));
      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
    });
  });

  describe('getFile', () => {
    it('retrieves an existing file by id', async () => {
      const stored = await fileStorageDB.addFile(makeFile());
      const fetched = await fileStorageDB.getFile(stored!.id);
      expect(fetched?.name).toBe('readme.md');
    });

    it('returns undefined for an unknown id', async () => {
      const result = await fileStorageDB.getFile('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getFileByPath', () => {
    it('retrieves a file by its path', async () => {
      await fileStorageDB.addFile(makeFile({ path: '/docs/guide.md', parentPath: '/docs' }));
      const fetched = await fileStorageDB.getFileByPath('/docs/guide.md');
      expect(fetched?.name).toBe('readme.md');
    });

    it('normalizes the path before querying', async () => {
      await fileStorageDB.addFile(makeFile({ path: '/readme.md' }));
      const fetched = await fileStorageDB.getFileByPath('readme.md');
      expect(fetched).toBeDefined();
    });

    it('returns undefined for a missing path', async () => {
      const result = await fileStorageDB.getFileByPath('/does/not/exist.md');
      expect(result).toBeUndefined();
    });
  });

  describe('updateFile', () => {
    it('replaces content and recalculates size', async () => {
      const stored = await fileStorageDB.addFile(makeFile({ content: 'old', size: 3 }));
      const updated = await fileStorageDB.updateFile(stored!.id, 'new content');
      expect(updated?.content).toBe('new content');
      expect(updated?.size).toBe(new Blob(['new content']).size);
    });

    it('bumps updatedAt after update', async () => {
      const stored = await fileStorageDB.addFile(makeFile());
      const before = stored!.updatedAt;
      await new Promise((r) => setTimeout(r, 5));
      const updated = await fileStorageDB.updateFile(stored!.id, 'changed');
      expect(updated!.updatedAt).toBeGreaterThan(before);
    });

    it('returns undefined for an unknown id', async () => {
      const result = await fileStorageDB.updateFile('ghost-id', 'content');
      expect(result).toBeUndefined();
    });
  });

  describe('updateFileHash', () => {
    it('stores the content hash without touching content', async () => {
      const stored = await fileStorageDB.addFile(makeFile());
      const hash = 'abc123';
      const updated = await fileStorageDB.updateFileHash(stored!.id, hash);
      expect(updated?.contentHash).toBe(hash);
      expect(updated?.content).toBe('# Hello');
    });

    it('returns undefined for an unknown id', async () => {
      const result = await fileStorageDB.updateFileHash('ghost-id', 'hash');
      expect(result).toBeUndefined();
    });
  });

  describe('deleteFile', () => {
    it('removes the file so it can no longer be found', async () => {
      const stored = await fileStorageDB.addFile(makeFile());
      await fileStorageDB.deleteFile(stored!.id);
      const result = await fileStorageDB.getFile(stored!.id);
      expect(result).toBeUndefined();
    });

    it('does not throw when deleting a non-existent id', async () => {
      await expect(fileStorageDB.deleteFile('ghost-id')).resolves.not.toThrow();
    });
  });

  describe('addDirectory', () => {
    it('persists a directory and returns it', async () => {
      const dir = await fileStorageDB.addDirectory(makeDir());
      expect(dir).not.toBeNull();
      expect(dir!.name).toBe('docs');
      expect(dir!.id).toBeDefined();
    });

    it('returns null on duplicate path', async () => {
      await fileStorageDB.addDirectory(makeDir());
      const dup = await fileStorageDB.addDirectory(makeDir());
      expect(dup).toBeNull();
    });
  });

  describe('getAllDirectories', () => {
    it('returns all stored directories', async () => {
      await fileStorageDB.addDirectory(makeDir({ name: 'docs', path: '/docs' }));
      await fileStorageDB.addDirectory(makeDir({ name: 'notes', path: '/notes' }));
      const dirs = await fileStorageDB.getAllDirectories();
      expect(dirs).toHaveLength(2);
    });

    it('returns empty array when no directories exist', async () => {
      const dirs = await fileStorageDB.getAllDirectories();
      expect(dirs).toEqual([]);
    });
  });

  describe('deleteDirectoryRecursive', () => {
    it('removes the directory and all files inside it', async () => {
      await fileStorageDB.addDirectory(makeDir({ name: 'docs', path: '/docs' }));
      const file = await fileStorageDB.addFile(
        makeFile({ name: 'guide.md', path: '/docs/guide.md', parentPath: '/docs' })
      );

      await fileStorageDB.deleteDirectoryRecursive('/docs');

      const dirs = await fileStorageDB.getAllDirectories();
      expect(dirs).toHaveLength(0);

      const fetched = await fileStorageDB.getFile(file!.id);
      expect(fetched).toBeUndefined();
    });

    it('removes nested subdirectories and their files', async () => {
      await fileStorageDB.addDirectory(makeDir({ name: 'docs', path: '/docs' }));
      await fileStorageDB.addDirectory(
        makeDir({ name: 'api', path: '/docs/api', parentPath: '/docs' })
      );
      await fileStorageDB.addFile(
        makeFile({ name: 'index.md', path: '/docs/api/index.md', parentPath: '/docs/api' })
      );

      await fileStorageDB.deleteDirectoryRecursive('/docs');

      const dirs = await fileStorageDB.getAllDirectories();
      expect(dirs).toHaveLength(0);
    });

    it('does not remove sibling directories', async () => {
      await fileStorageDB.addDirectory(makeDir({ name: 'docs', path: '/docs' }));
      await fileStorageDB.addDirectory(makeDir({ name: 'notes', path: '/notes', parentPath: '/' }));

      await fileStorageDB.deleteDirectoryRecursive('/docs');

      const dirs = await fileStorageDB.getAllDirectories();
      expect(dirs).toHaveLength(1);
      expect(dirs[0].name).toBe('notes');
    });
  });

  describe('buildFileTree', () => {
    it('returns an empty array when nothing is stored', async () => {
      const tree = await fileStorageDB.buildFileTree();
      expect(tree).toEqual([]);
    });

    it('places top-level files at the root', async () => {
      await fileStorageDB.addFile(makeFile({ name: 'readme.md', path: '/readme.md' }));
      const tree = await fileStorageDB.buildFileTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('readme.md');
    });

    it('nests files inside their parent directory', async () => {
      await fileStorageDB.addDirectory(makeDir({ name: 'docs', path: '/docs' }));
      await fileStorageDB.addFile(
        makeFile({ name: 'guide.md', path: '/docs/guide.md', parentPath: '/docs' })
      );
      const tree = await fileStorageDB.buildFileTree();
      expect(tree[0].type).toBe('directory');
      expect(tree[0].children?.[0].name).toBe('guide.md');
    });

    it('sorts directories before files at each level', async () => {
      await fileStorageDB.addDirectory(makeDir({ name: 'zdir', path: '/zdir' }));
      await fileStorageDB.addFile(makeFile({ name: 'afile.md', path: '/afile.md' }));
      const tree = await fileStorageDB.buildFileTree();
      expect(tree[0].type).toBe('directory');
      expect(tree[1].type).toBe('file');
    });

    it('sorts siblings alphabetically within the same type', async () => {
      await fileStorageDB.addFile(makeFile({ name: 'z.md', path: '/z.md' }));
      await fileStorageDB.addFile(makeFile({ name: 'a.md', path: '/a.md' }));
      const tree = await fileStorageDB.buildFileTree();
      expect(tree[0].name).toBe('a.md');
      expect(tree[1].name).toBe('z.md');
    });

    it('excludes paste-backed files from the tree', async () => {
      await fileStorageDB.addFile(
        makeFile({ name: 'paste.md', path: '/__pastes__/paste.md', parentPath: '/__pastes__' })
      );
      const tree = await fileStorageDB.buildFileTree();
      expect(tree).toHaveLength(0);
    });
  });

  describe('getPasteFiles', () => {
    it('returns only paste-backed files', async () => {
      await fileStorageDB.addFile(makeFile({ name: 'normal.md', path: '/normal.md' }));
      await fileStorageDB.addFile(
        makeFile({ name: 'paste.md', path: '/__pastes__/paste.md', parentPath: '/__pastes__' })
      );
      const pastes = await fileStorageDB.getPasteFiles();
      expect(pastes).toHaveLength(1);
      expect(pastes[0].name).toBe('paste.md');
    });

    it('returns empty array when no paste files exist', async () => {
      const pastes = await fileStorageDB.getPasteFiles();
      expect(pastes).toEqual([]);
    });

    it('returns pastes sorted newest first', async () => {
      await fileStorageDB.addFile(
        makeFile({ name: 'first.md', path: '/__pastes__/first.md', parentPath: '/__pastes__' })
      );
      await new Promise((r) => setTimeout(r, 5));
      await fileStorageDB.addFile(
        makeFile({ name: 'second.md', path: '/__pastes__/second.md', parentPath: '/__pastes__' })
      );
      const pastes = await fileStorageDB.getPasteFiles();
      expect(pastes[0].name).toBe('second.md');
    });
  });

  describe('getAllFilesForSync', () => {
    it('returns sync metadata for all stored files', async () => {
      await fileStorageDB.addFile(makeFile({ name: 'a.md', path: '/a.md' }));
      await fileStorageDB.addFile(makeFile({ name: 'b.md', path: '/b.md' }));
      const syncFiles = await fileStorageDB.getAllFilesForSync();
      expect(syncFiles).toHaveLength(2);
      expect(syncFiles[0]).toHaveProperty('id');
      expect(syncFiles[0]).toHaveProperty('path');
      expect(syncFiles[0]).toHaveProperty('updatedAt');
      expect(syncFiles[0]).not.toHaveProperty('content');
    });

    it('returns empty array when no files exist', async () => {
      const result = await fileStorageDB.getAllFilesForSync();
      expect(result).toEqual([]);
    });
  });

  describe('clearAll', () => {
    it('removes all files and directories', async () => {
      await fileStorageDB.addFile(makeFile());
      await fileStorageDB.addDirectory(makeDir());
      await fileStorageDB.clearAll();

      const tree = await fileStorageDB.buildFileTree();
      const dirs = await fileStorageDB.getAllDirectories();
      expect(tree).toHaveLength(0);
      expect(dirs).toHaveLength(0);
    });
  });
});
