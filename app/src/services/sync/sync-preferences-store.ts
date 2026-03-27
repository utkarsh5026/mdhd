import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

/** Persisted state tracking which localStorage keys are excluded from cross-device sync. */
interface SyncPreferencesState {
  /** localStorage keys that the user has opted out of syncing. */
  disabledKeys: string[];
}

/** Actions for toggling and querying per-key sync opt-out status. */
interface SyncPreferencesActions {
  /**
   * Enables or disables syncing for a specific localStorage key.
   *
   * @param key - The localStorage key to toggle.
   * @param enabled - `true` to allow syncing (removes from disabled list),
   *   `false` to opt out (adds to disabled list).
   */
  setKeyEnabled(key: string, enabled: boolean): void;

  /**
   * Checks whether a given localStorage key is currently opted in to syncing.
   *
   * @param key - The localStorage key to check.
   * @returns `true` if the key is not in the disabled list.
   */
  isKeyEnabled(key: string): boolean;
}

type SyncPreferencesStore = SyncPreferencesState & SyncPreferencesActions;

const useSyncPreferencesStore = create<SyncPreferencesStore>()(
  devtools(
    persist(
      (set, get) => ({
        disabledKeys: [],

        setKeyEnabled: (key, enabled) =>
          set((state) => {
            if (enabled) return { disabledKeys: state.disabledKeys.filter((k) => k !== key) };
            if (state.disabledKeys.includes(key)) return { disabledKeys: state.disabledKeys };
            return { disabledKeys: [...state.disabledKeys, key] };
          }),

        isKeyEnabled: (key) => !get().disabledKeys.includes(key),
      }),
      { name: 'mdhd-sync-preferences' }
    ),
    { name: 'SyncPreferences' }
  )
);

/**
 * Provides the sync-preferences actions (`setKeyEnabled`, `isKeyEnabled`)
 * with shallow equality to avoid unnecessary re-renders.
 */
export const useSyncPreferencesActions = () =>
  useSyncPreferencesStore(
    useShallow((s) => ({
      setKeyEnabled: s.setKeyEnabled,
      isKeyEnabled: s.isKeyEnabled,
    }))
  );

/** Subscribes to the list of localStorage keys the user has opted out of syncing. */
export const useDisabledSyncKeys = () => useSyncPreferencesStore((s) => s.disabledKeys);

/** Returns the raw store state — used in sync-service outside React. */
export const getSyncPreferencesState = () => useSyncPreferencesStore.getState();
