import { useCallback, useState } from 'react';

import { revokeShare, shareFile, sharePaste } from '@/services/share/share-api';

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
 * Determines whether to share a tab as a file or a paste based on its
 * `sourceType`, then calls the appropriate share API endpoint.
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
      let url: string;

      if (tab.sourceType === 'paste') {
        ({ url } = await sharePaste(tab.title, tab.content));
      } else {
        ({ url } = await shareFile(tab.title, tab.sourcePath ?? tab.title, tab.content));
      }

      setShareUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create share link';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  const revoke = useCallback(
    async (token: string) => {
      if (!tab) return;
      await revokeShare(token, tab.sourceType);
      setShareUrl('');
    },
    [tab]
  );

  const reset = useCallback(() => {
    setShareUrl('');
    setError(null);
    setIsLoading(false);
  }, []);

  return { shareUrl, isLoading, error, share, revoke, reset };
}
