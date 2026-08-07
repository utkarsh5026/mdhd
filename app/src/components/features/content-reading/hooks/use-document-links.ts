import { useCallback } from 'react';
import { toast } from 'sonner';

import { useTabsActions } from '@/components/features/tabs/store/hooks';
import { fileStorageDB } from '@/services/indexeddb';
import { resolveDocumentLink } from '@/services/markdown/links';

import { useReadingContent } from './use-reading-selectors';

/**
 * Turns relative markdown links into tab navigation.
 *
 * Cross-document links (`[setup](./setup.md)`) are the primary way a docs
 * folder is navigated, but a single-page app has no route that can serve one.
 * This resolves the href against the open document's path, finds the matching
 * record in IndexedDB, and focuses or creates a tab for it.
 *
 * Falls back to a toast when nothing matches — a stale link in the source is
 * far more likely than a bug, and silently doing nothing reads as a freeze.
 *
 * @returns `{ basePath, openDocument }`, shaped for `DocumentLinkProvider`.
 */
export function useDocumentLinks() {
  const { sourcePath } = useReadingContent();
  const { createTab, setActiveTab, findTabByFileId, setShowEmptyState } = useTabsActions();

  const openDocument = useCallback(
    async (href: string) => {
      const resolved = resolveDocumentLink(href, sourcePath);
      if (!resolved) return;

      try {
        for (const path of resolved.candidates) {
          const file = await fileStorageDB.getFileByPath(path);
          if (!file) continue;

          const existing = findTabByFileId(file.id);
          if (existing) {
            setActiveTab(existing.id);
          } else {
            createTab(file.content, file.name, file.id, file.path);
          }
          setShowEmptyState(false);
          return;
        }

        toast.error(`No document at "${href}"`);
      } catch {
        toast.error(`Failed to open "${href}"`);
      }
    },
    [sourcePath, createTab, setActiveTab, findTabByFileId, setShowEmptyState]
  );

  return { basePath: sourcePath, openDocument };
}
