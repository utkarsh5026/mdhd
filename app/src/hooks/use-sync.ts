import { useEffect, useRef } from 'react';

import { useIsAuthenticated } from '@/services/auth';
import { useSyncActions } from '@/services/sync';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Triggers file sync at key moments while the user is authenticated:
 * - On login / session restore (when `isAuthenticated` becomes true)
 * - Every 5 minutes while the tab is open
 * - When the user returns to the tab (window focus)
 */
export function useSync() {
  const isAuthenticated = useIsAuthenticated();
  const { startSync } = useSyncActions();

  const startSyncRef = useRef(startSync);
  startSyncRef.current = startSync;

  useEffect(() => {
    if (isAuthenticated) startSyncRef.current();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => startSyncRef.current(), SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = () => startSyncRef.current();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [isAuthenticated]);
}
