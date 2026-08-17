import { beforeEach, describe, expect, it } from 'vitest';

// Imported through the barrel on purpose: it also pulls in the service-worker
// module, so this asserts the `virtual:pwa-register` import stays resolvable
// outside a browser build.
import { getIsOnline, subscribeToOnline } from './index';
import useOnlineStore from './online-store';

/** Drives `navigator.onLine` and fires the matching window event. */
function setBrowserOnline(isOnline: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: isOnline, configurable: true });
  window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
}

describe('online store', () => {
  beforeEach(() => {
    setBrowserOnline(true);
  });

  it('tracks the browser going offline and back', () => {
    expect(getIsOnline()).toBe(true);

    setBrowserOnline(false);
    expect(getIsOnline()).toBe(false);

    setBrowserOnline(true);
    expect(getIsOnline()).toBe(true);
  });

  it('notifies subscribers only when the flag actually flips', () => {
    const seen: boolean[] = [];
    const unsubscribe = subscribeToOnline((isOnline) => seen.push(isOnline));

    setBrowserOnline(false);
    // A second `offline` event (some browsers fire spurious ones) is not a flip.
    window.dispatchEvent(new Event('offline'));
    setBrowserOnline(true);

    unsubscribe();
    setBrowserOnline(false);

    expect(seen).toEqual([false, true]);
  });

  it('stops notifying after unsubscribe', () => {
    let calls = 0;
    const unsubscribe = subscribeToOnline(() => calls++);
    unsubscribe();

    setBrowserOnline(false);

    expect(calls).toBe(0);
    expect(useOnlineStore.getState().isOnline).toBe(false);
  });
});
