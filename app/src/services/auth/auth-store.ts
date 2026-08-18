import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { tryCatch } from '@/utils/error';

import { ApiError, authFetch } from './api-client';

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
   * from `/auth/me`. Clears all auth state if the server rejects the token; keeps it if the
   * server simply could not be reached.
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
   * Rehydrates the session from `localStorage` on page load: the cached profile is applied
   * immediately, then refreshed from `/auth/me` in the background. No-ops when no token is
   * stored or the session is already active.
   *
   * The session survives a reload with no network — only an outright rejection from the
   * server (401/403) clears it.
   */
  restore: () => Promise<void>;
  /**
   * Fetches `/auth/me` for the currently stored token and caches the result. Signs the user
   * out on 401/403; leaves the session untouched on any other failure (offline, 5xx).
   *
   * Shared by {@link AuthActions.login} and {@link AuthActions.restore}; rarely called directly.
   */
  loadProfile: () => Promise<void>;
}

/** `localStorage` key used to persist the JWT between page loads. */
const TOKEN_KEY = 'mdhd-auth-token';

/**
 * `localStorage` key holding the last profile `/auth/me` returned.
 *
 * Cached so an offline reload can restore a signed-in session without a round
 * trip. It is a display convenience, never an authorisation decision — the JWT
 * remains the only thing the server trusts.
 */
const USER_KEY = 'mdhd-auth-user';

/** Reads the cached profile, tolerating absent or corrupt storage. */
function readCachedUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  const parsed = tryCatch<AuthUser | null>(() => JSON.parse(raw) as AuthUser, null);
  return parsed?.id ? parsed : null;
}

/** Mirrors the profile to `localStorage`, or clears it when signing out. */
function writeCachedUser(user: AuthUser | null): void {
  if (typeof localStorage === 'undefined') return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

/**
 * `true` when the server actively rejected the token, as opposed to being
 * unreachable or briefly broken.
 *
 * Only this case is allowed to sign the user out. Treating an offline
 * `/auth/me` as a rejection would log people out of a local-first app for
 * boarding a plane — and take their sync history with it.
 */
function isSessionRejected(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

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
        const { token } = await authFetch<{ token: string }>('/auth/exchange', {
          method: 'POST',
          body: JSON.stringify({ code }),
        });
        await get().login(token);
      },

      login: async (token) => {
        localStorage.setItem(TOKEN_KEY, token);
        set({ token, isLoading: true });
        await get().loadProfile();
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        writeCachedUser(null);
        set({ user: null, token: null });
      },

      restore: async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return;

        if (get().token === token && get().user) return;

        // Apply the cached profile before the network call so a cold start
        // with no connection lands on a signed-in app rather than a signed-out
        // one that silently drops the token.
        set({ token, user: readCachedUser(), isLoading: true });
        await get().loadProfile();
      },

      loadProfile: async () => {
        try {
          const user = await authFetch<AuthUser>('/auth/me');
          writeCachedUser(user);
          set({ user, isLoading: false });
        } catch (err) {
          if (isSessionRejected(err)) {
            localStorage.removeItem(TOKEN_KEY);
            writeCachedUser(null);
            set({ user: null, token: null, isLoading: false });
            return;
          }
          // Unreachable or briefly broken server. Keep whatever session we
          // already have — the next restore, sync, or API call retries.
          set({ isLoading: false });
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
