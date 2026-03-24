import { useCallback, useState } from 'react';

export function useCopyToClipboard(resetDelay = 2000) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn('Clipboard API not available');
        return false;
      }
      try {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), resetDelay);
        return true;
      } catch (err) {
        console.error('Copy failed:', err);
        setCopiedText(null);
        return false;
      }
    },
    [resetDelay]
  );

  return { copiedText, copy };
}
