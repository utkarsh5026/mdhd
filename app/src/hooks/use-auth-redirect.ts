import { useEffect } from 'react';

import { useAuthActions } from '@/services/auth';

/**
 * Captures the `?code=` query parameter from the URL after an OAuth redirect,
 * exchanges it for a JWT via POST /auth/exchange, and cleans up the URL.
 * The one-time code is never stored — it's consumed immediately on load.
 */
export function useAuthRedirect() {
  const { exchange, restore } = useAuthActions();

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const code = params.get('code');

    if (code) {
      // Remove code from URL before the async exchange so it's never stored in history
      params.delete('code');
      const clean = params.toString();
      const url = globalThis.location.pathname + (clean ? `?${clean}` : '');
      globalThis.history.replaceState({}, '', url);

      exchange(code);
    } else {
      restore();
    }
  }, [exchange, restore]);
}
