import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { tryCatch } from '@/utils/error';

import { LATEST_RELEASE } from '../data/releases';

const STORAGE_KEY = 'mdhd-whats-new';

/**
 * localStorage keys that only exist once someone has actually used MDHD.
 * They let us tell a returning reader — who has earned an announcement —
 * apart from a first-time visitor, who should meet the welcome screen rather
 * than a changelog.
 */
const RETURNING_USER_KEYS = [
  'mdhd-tabs-storage',
  'mdhd-recent-files',
  'mdhd-sidebar-panel',
  'mdhd-sidebar-position',
  'mdhd-auth-token',
  'reading-settings',
  'typography-settings',
  'markdown-style',
];

/** Shape persisted under {@link STORAGE_KEY}. */
interface PersistedState {
  /** `Release.id` of the newest release this browser has already been shown. */
  lastSeenReleaseId: string | null;
}

const DEFAULT_PERSISTED: PersistedState = { lastSeenReleaseId: null };

/** Reads the persisted announcement state, tolerating any older shape. */
const loadPersisted = (): PersistedState => {
  if (typeof window === 'undefined') return DEFAULT_PERSISTED;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_PERSISTED;

  const parsed = tryCatch(() => JSON.parse(saved), null);
  if (!parsed) return DEFAULT_PERSISTED;

  return {
    lastSeenReleaseId:
      typeof parsed.lastSeenReleaseId === 'string'
        ? parsed.lastSeenReleaseId
        : DEFAULT_PERSISTED.lastSeenReleaseId,
  };
};

const persist = (state: PersistedState) => {
  if (typeof window === 'undefined') return;
  tryCatch(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), undefined);
};

/** True when this browser shows signs of a previous MDHD session. */
const isReturningUser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return RETURNING_USER_KEYS.some((key) => localStorage.getItem(key) !== null);
};

interface WhatsNewState {
  /** Whether the modal is currently on screen. */
  isOpen: boolean;
  /** `Release.id` last acknowledged, or `null` if nothing ever has been. */
  lastSeenReleaseId: string | null;
  /** Auto-open the modal once per session if the latest release is unseen. */
  announceLatest: () => void;
  /** Show the release notes on demand, without changing what counts as seen. */
  open: () => void;
  /** Close the modal and mark the latest release as read. */
  dismiss: () => void;
}

/**
 * Tracks which release announcement this browser has already seen.
 *
 * State lives in `localStorage` rather than the synced settings because
 * "have I read this note?" is per-device by nature — seeing it once on a
 * laptop shouldn't silently swallow it on a phone.
 */
export const useWhatsNewStore = create<WhatsNewState>((set, get) => ({
  isOpen: false,
  lastSeenReleaseId: loadPersisted().lastSeenReleaseId,

  announceLatest: () => {
    const { lastSeenReleaseId } = get();
    if (lastSeenReleaseId === LATEST_RELEASE.id) return;

    // A brand-new install has nothing to catch up on — record the current
    // release silently so the first thing they ever see isn't a changelog.
    if (lastSeenReleaseId === null && !isReturningUser()) {
      persist({ lastSeenReleaseId: LATEST_RELEASE.id });
      set({ lastSeenReleaseId: LATEST_RELEASE.id });
      return;
    }

    set({ isOpen: true });
  },

  open: () => set({ isOpen: true }),

  dismiss: () => {
    persist({ lastSeenReleaseId: LATEST_RELEASE.id });
    set({ isOpen: false, lastSeenReleaseId: LATEST_RELEASE.id });
  },
}));

/** Whether the release-notes modal is currently open. */
export const useIsWhatsNewOpen = () => useWhatsNewStore((state) => state.isOpen);

/** True while the newest release has not been acknowledged on this device. */
export const useHasUnseenRelease = () =>
  useWhatsNewStore((state) => state.lastSeenReleaseId !== LATEST_RELEASE.id);

/** Actions for opening, auto-announcing, and dismissing the release notes. */
export const useWhatsNewActions = () =>
  useWhatsNewStore(
    useShallow((state) => ({
      announceLatest: state.announceLatest,
      open: state.open,
      dismiss: state.dismiss,
    }))
  );
