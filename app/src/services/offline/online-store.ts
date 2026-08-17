import { create } from 'zustand';

/**
 * Reactive mirror of the browser's connectivity flag.
 *
 * One store rather than a `navigator.onLine` read per component, so every
 * consumer (the offline banner, sync, the progress tracker) flips at the same
 * moment and tests can drive connectivity by dispatching `online` / `offline`.
 *
 * Note the flag is only as good as the browser's: `navigator.onLine` reports a
 * link to *something*, not a working route to our API. It is used to skip work
 * that is certain to fail, never to promise that a request will succeed.
 */
interface OnlineState {
  /** `true` when the browser reports a network connection. */
  isOnline: boolean;
}

/** Assume online where `navigator` is absent (SSR, non-DOM test envs). */
const readNavigatorOnline = (): boolean =>
  typeof navigator === 'undefined' ? true : navigator.onLine !== false;

const useOnlineStore = create<OnlineState>()(() => ({
  isOnline: readNavigatorOnline(),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useOnlineStore.setState({ isOnline: true }));
  window.addEventListener('offline', () => useOnlineStore.setState({ isOnline: false }));
}

/** Subscribes to connectivity. Re-renders only when the flag actually flips. */
export const useIsOnline = (): boolean => useOnlineStore((s) => s.isOnline);

/**
 * Imperative read for non-React code (sync service, progress tracker).
 *
 * @returns `true` when the browser reports a network connection.
 */
export const getIsOnline = (): boolean => useOnlineStore.getState().isOnline;

/**
 * Runs `listener` whenever connectivity flips. Returns the unsubscribe function.
 *
 * @param listener - Called with the new connectivity state.
 */
export const subscribeToOnline = (listener: (isOnline: boolean) => void): (() => void) =>
  useOnlineStore.subscribe((state, prev) => {
    if (state.isOnline !== prev.isOnline) listener(state.isOnline);
  });

export default useOnlineStore;
