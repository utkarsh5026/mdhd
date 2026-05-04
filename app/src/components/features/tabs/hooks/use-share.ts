import { useCallback, useState } from 'react';

import { revokeShare, shareFile } from '@/services/share/share-api';

import type { Tab } from '../store/types';

export interface UseShareReturn {
  shareUrl: string;
  isLoading: boolean;
  error: string | null;
  share: () => Promise<void>;
  revoke: (token: string) => Promise<void>;
  reset: () => void;
}

/**
 * Creates a public share link for the given tab via the file-share endpoint.
 * Unsaved tabs (no `sourcePath`) fall back to the tab title as the path.
 */
export function useShare(tab: Tab | undefined): UseShareReturn {
  const [shareUrl, setShareUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const share = useCallback(async () => {
    if (!tab) return;

    setIsLoading(true);
    setError(null);

    try {
      const { url } = await shareFile(tab.title, tab.sourcePath ?? tab.title, tab.content);
      setShareUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create share link';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  const revoke = useCallback(async (token: string) => {
    await revokeShare(token);
    setShareUrl('');
  }, []);

  const reset = useCallback(() => {
    setShareUrl('');
    setError(null);
    setIsLoading(false);
  }, []);

  return { shareUrl, isLoading, error, share, revoke, reset };
}
