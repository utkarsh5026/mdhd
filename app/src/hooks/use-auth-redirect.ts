import { useEffect } from 'react';

import { useAuthActions } from '@/services/auth';

/**
 * Captures the `?token=` query parameter from the URL after an OAuth redirect,
 * logs the user in, and cleans up the URL.
 */
export function useAuthRedirect() {
  const { login, restore } = useAuthActions();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Remove token from URL without a page reload
      params.delete('token');
      const clean = params.toString();
      const url = window.location.pathname + (clean ? `?${clean}` : '');
      window.history.replaceState({}, '', url);

      login(token);
    } else {
      // No token in URL — try restoring an existing session
      restore();
    }
  }, [login, restore]);
}
