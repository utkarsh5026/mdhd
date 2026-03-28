import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { apiFetch } from './api-client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthActions {
  /** Set token, persist it, and fetch the user profile. */
  login: (token: string) => Promise<void>;
  /** Exchange a one-time auth code for a JWT, then log in. */
  exchange: (code: string) => Promise<void>;
  /** Clear all auth state. */
  logout: () => void;
  /** Attempt to restore session from a previously stored token. */
  restore: () => Promise<void>;
}

const TOKEN_KEY = 'mdhd-auth-token';

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

export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthToken = () => useAuthStore((s) => s.token);
export const useIsAuthenticated = () => useAuthStore((s) => !!s.user);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);

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
