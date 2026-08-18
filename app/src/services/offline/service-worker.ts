import { registerSW } from 'virtual:pwa-register';

import { getIsOnline, subscribeToOnline } from './online-store';

/** How often an open tab asks the server whether a newer build exists. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Callbacks fired by the service-worker lifecycle. */
export interface ServiceWorkerHandlers {
  /**
   * Fired once, on the very first install, when the whole app shell has been
   * precached and the app will boot with no network from here on.
   */
  onOfflineReady?: () => void;
  /**
   * Fired when a newer build has been downloaded and is waiting to take over.
   * Call the function returned by {@link registerServiceWorker} to activate it
   * and reload.
   */
  onNeedRefresh?: () => void;
}

/**
 * Registers the generated service worker that makes MDHD boot without a
 * network connection.
 *
 * Registration is explicit (rather than the plugin's injected `registerSW.js`)
 * so the app controls the update moment. The worker is built with
 * `registerType: 'prompt'`: a new build downloads in the background but waits
 * to take over until the returned callback runs. That matters for a reader
 * people leave open for hours — swapping the precache under a live page
 * invalidates the lazy chunks it has not loaded yet.
 *
 * Safe to call in any environment: without service-worker support, or in dev
 * where the plugin resolves to a no-op, this does nothing.
 *
 * @param handlers - Lifecycle callbacks, typically wired to a toast.
 * @returns Activates the waiting worker and reloads the page.
 */
export function registerServiceWorker(handlers: ServiceWorkerHandlers = {}): () => Promise<void> {
  return registerSW({
    immediate: false,
    onOfflineReady: handlers.onOfflineReady,
    onNeedRefresh: handlers.onNeedRefresh,
    onRegisteredSW: (_swUrl, registration) => {
      if (!registration) return;
      scheduleUpdateChecks(registration);
    },
  });
}

/**
 * Polls for a new build on an interval, and once more the moment connectivity
 * comes back — a laptop that was closed offline for a week should not have to
 * wait out a full interval before it learns there is a newer MDHD.
 *
 * Checks are skipped while offline: `registration.update()` rejects with no
 * network, and the rejection is uncatchable noise in the console otherwise.
 */
function scheduleUpdateChecks(registration: ServiceWorkerRegistration): void {
  const check = () => {
    if (!getIsOnline()) return;
    void registration.update().catch(() => {
      // Offline, or the server is unreachable. The next check retries.
    });
  };

  setInterval(check, UPDATE_CHECK_INTERVAL_MS);
  subscribeToOnline((isOnline) => {
    if (isOnline) check();
  });
}
