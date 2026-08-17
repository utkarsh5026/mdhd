import { useEffect, useRef } from 'react';

import { useIsAuthenticated } from '@/services/auth';
import { useIsOnline } from '@/services/offline';
import { useSyncActions } from '@/services/sync';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Triggers file sync at key moments while the user is authenticated:
 * - On login / session restore (when `isAuthenticated` becomes true)
 * - When the connection comes back after being offline
 * - Every 5 minutes while the tab is open
 * - When the user returns to the tab (window focus)
 *
 * Every trigger is a no-op while offline (`startSync` returns early), so the
 * interval and focus handlers are free to keep firing on a plane.
 */
export function useSync() {
  const isAuthenticated = useIsAuthenticated();
  const isOnline = useIsOnline();
  const { startSync } = useSyncActions();

  const startSyncRef = useRef(startSync);
  startSyncRef.current = startSync;

  useEffect(() => {
    if (isAuthenticated && isOnline) startSyncRef.current();
  }, [isAuthenticated, isOnline]);

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
