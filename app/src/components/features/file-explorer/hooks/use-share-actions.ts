import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { fileStorageDB, type FileTreeNode } from '@/services/indexeddb';
import { revokeShare, shareFile } from '@/services/share';

/**
 * Provides share and revoke actions for file tree nodes.
 *
 * Maintains an in-memory map of node IDs to their active share tokens so that a previously
 * shared file can be revoked within the same session. On a successful share, the generated
 * URL is written to the clipboard and a toast is shown. On revocation, the token is removed
 * from the local map and a confirmation toast is shown.
 *
 * Note: `shareTokens` is session-only — tokens are not persisted across page reloads.
 *
 * @returns An object containing:
 * - `shareTokens` — map of node ID → active share token for files shared in this session
 * - `handleShare` — fetches file content, creates a share link, and copies it to the clipboard
 * - `handleRevoke` — revokes the active share link for a node using its stored token
 *
 * @example
 * ```tsx
 * const { shareTokens, handleShare, handleRevoke } = useShareActions();
 *
 * // Share a file and copy the link to clipboard
 * await handleShare(node);
 *
 * // Revoke the share if a token exists for this node
 * if (shareTokens[node.id]) await handleRevoke(node);
 * ```
 */
export function useShareActions() {
  const [shareTokens, setShareTokens] = useState<Record<string, string>>({});

  /**
   * Creates a share link for the given file node and copies it to the clipboard.
   *
   * Reads the file content from IndexedDB, calls the share API, stores the returned token
   * in `shareTokens`, and writes the share URL to `navigator.clipboard`. Shows an error
   * toast if the file is not found in IndexedDB or if the share API call fails.
   *
   * @param node - The file tree node to share. Must be a file node with a valid `id`.
   */
  const handleShare = useCallback(async (node: FileTreeNode) => {
    const file = await fileStorageDB.getFile(node.id);
    if (!file) {
      toast.error('File not found');
      return;
    }
    try {
      const { token, url } = await shareFile(file.name, file.path, file.content);
      setShareTokens((prev) => ({ ...prev, [node.id]: token }));
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create share link');
    }
  }, []);

  /**
   * Revokes the active share link for the given file node.
   *
   * Looks up the share token for `node.id` in `shareTokens` and no-ops if none is found.
   * On success, removes the token from the local map. Shows an error toast if the revoke
   * API call fails.
   *
   * @param node - The file tree node whose share link should be revoked.
   */
  const handleRevoke = useCallback(
    async (node: FileTreeNode) => {
      const token = shareTokens[node.id];
      if (!token) return;
      try {
        await revokeShare(token);
        setShareTokens((prev) => {
          const next = { ...prev };
          delete next[node.id];
          return next;
        });
        toast.success('Share link revoked');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to revoke share link');
      }
    },
    [shareTokens]
  );

  return { shareTokens, handleShare, handleRevoke };
}
