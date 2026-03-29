import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { apiFetch } from './api-client';

/**
 * Represents an authenticated user returned from the `/auth/me` endpoint.
 */
export interface AuthUser {
  id: string;
  email: string;
  /** Display name provided by the OAuth provider. `null` if not supplied. */
  name: string | null;
  /** URL to the user's profile picture from the OAuth provider. `null` if not supplied. */
  avatar_url: string | null;
}

/** Reactive state slice of the auth store. */
interface AuthState {
  /** The currently authenticated user, or `null` when logged out. */
  user: AuthUser | null;
  /** The active JWT stored in memory. Persisted to `localStorage` under `TOKEN_KEY`. */
  token: string | null;
  /** `true` while an auth request (login, exchange, or restore) is in-flight. */
  isLoading: boolean;
}

/** Mutating actions exposed by the auth store. */
interface AuthActions {
  /**
   * Persists the given JWT to `localStorage`, stores it in state, and fetches the user profile
   * from `/auth/me`. Clears all auth state if the profile fetch fails (e.g. token is invalid).
   */
  login: (token: string) => Promise<void>;
  /**
   * Exchanges a one-time OAuth authorization `code` for a JWT via `POST /auth/exchange`,
   * then calls {@link AuthActions.login} with the returned token.
   */
  exchange: (code: string) => Promise<void>;
  /** Clears all auth state and removes the persisted token from `localStorage`. */
  logout: () => void;
  /**
   * Reads the token from `localStorage` and, if present and not already active, fetches the
   * user profile to rehydrate the session. No-ops when no token is stored or the session is
   * already active. Clears storage on a failed profile fetch.
   */
  restore: () => Promise<void>;
}

/** `localStorage` key used to persist the JWT between page loads. */
const TOKEN_KEY = 'mdhd-auth-token';

/**
 * Core Zustand store for authentication state. Prefer the focused selector hooks
 * (`useAuthUser`, `useIsAuthenticated`, etc.) over consuming this store directly
 * to avoid unnecessary re-renders.
 */
const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      exchange: async (code) => {
        const { token } = await apiFetch<{ token: string }>('/auth/exchange', {
          method: 'POST',
          body: JSON.stringify({ code }),
        });
        await get().login(token);
      },

      login: async (token) => {
        localStorage.setItem(TOKEN_KEY, token);
        set({ token, isLoading: true });

        try {
          const user = await apiFetch<AuthUser>('/auth/me');
          set({ user, isLoading: false });
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          set({ user: null, token: null, isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        set({ user: null, token: null });
      },

      restore: async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return;

        if (get().token === token && get().user) return;

        set({ token, isLoading: true });
        try {
          const user = await apiFetch<AuthUser>('/auth/me');
          set({ user, isLoading: false });
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          set({ user: null, token: null, isLoading: false });
        }
      },
    }),
    { name: 'mdhd-auth' }
  )
);

/**
 *  Returns the current {@link AuthUser}, or `null` when the user is not authenticated.
 */
export const useAuthUser = () => useAuthStore((s) => s.user);

/**
 *  Returns the active JWT string, or `null` when logged out.
 */
export const useAuthToken = () => useAuthStore((s) => s.token);

/**
 *  Returns `true` when a user is authenticated (i.e. a profile has been loaded).
 */
export const useIsAuthenticated = () => useAuthStore((s) => !!s.user);

/**
 *  Returns `true` while an authentication request is in-flight.
 */
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);

/**
 * Returns a stable object containing all auth action callbacks (`login`, `exchange`,
 * `logout`, `restore`). Uses `useShallow` so the reference only changes when the
 * action implementations themselves are replaced.
 */
export const useAuthActions = () =>
  useAuthStore(
    useShallow((s) => ({
      login: s.login,
      exchange: s.exchange,
      logout: s.logout,
      restore: s.restore,
    }))
  );

export default useAuthStore;
