import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it } from 'vitest';

import { fileStorageDB } from '@/services/indexeddb/file-db';

import { saveDocument, updateSavedContent } from './save-content';

beforeEach(async () => {
  await fileStorageDB.clearAll();
});

describe('saveDocument', () => {
  it('stores an imported document under the name it arrived with', async () => {
    const file = await saveDocument('# Quarterly notes\n\nbody', 'Q3 Report.md');

    expect(file.name).toBe('Q3 Report.md');
    expect(file.path).toBe('/Q3 Report.md');
    expect(file.parentPath).toBe('/');
  });

  it('keeps the extension the importer settled on', async () => {
    const file = await saveDocument('```rs\nfn main() {}\n```', 'main.rs.md');

    expect(file.name).toBe('main.rs.md');
  });

  it('makes the document readable back from IndexedDB', async () => {
    const content = '# Hello\n\nworld';
    const file = await saveDocument(content, 'hello.md');

    const stored = await fileStorageDB.getFile(file.id);
    expect(stored?.content).toBe(content);
    expect(stored?.contentHash).toBe(file.contentHash);
  });

  it('places the document at the root so it shows in the file tree', async () => {
    const file = await saveDocument('# Visible', 'visible.md');

    const tree = await fileStorageDB.buildFileTree();
    expect(tree.map((node) => node.id)).toContain(file.id);
  });

  it('dedupes a name that is already taken instead of failing', async () => {
    const first = await saveDocument('# One', 'notes.md');
    const second = await saveDocument('# Two', 'notes.md');

    expect(first.name).toBe('notes.md');
    expect(second.name).toBe('notes-2.md');
    expect(second.id).not.toBe(first.id);
  });

  it('derives the name from the first heading when there is no filename', async () => {
    const file = await saveDocument('# My Great Doc\n\nbody');

    expect(file.name).toBe('my-great-doc.md');
  });

  it('falls back to a generated name when the content has no usable heading', async () => {
    const file = await saveDocument('just some prose, no heading');

    expect(file.name).toMatch(/^[a-z]+-[a-z]+\.md$/);
  });

  it('refuses to let a filename with separators escape the root', async () => {
    const file = await saveDocument('# Nested', '../../etc/passwd.md');

    expect(file.name).toBe('passwd.md');
    expect(file.path).toBe('/passwd.md');
  });

  // toMarkdownFilename turns a dotfile into `.env.md`, so the leading dot is
  // part of the base name and only the trailing `.md` is the extension.
  it('treats a leading dot as part of the name, not an extension', async () => {
    const file = await saveDocument('# Config', '.env.md');

    expect(file.name).toBe('.env.md');
  });
});

describe('updateSavedContent', () => {
  it('rewrites content and hash of a stored document', async () => {
    const file = await saveDocument('# Before', 'doc.md');

    await updateSavedContent(file.id, '# After');

    const stored = await fileStorageDB.getFile(file.id);
    expect(stored?.content).toBe('# After');
    expect(stored?.contentHash).not.toBe(file.contentHash);
  });
});
