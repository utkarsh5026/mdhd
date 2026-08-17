import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

vi.mock('./api-client', async () => {
  const actual = await vi.importActual<typeof import('./api-client')>('./api-client');
  return { ...actual, authFetch: vi.fn() };
});

import { ApiError, authFetch, NetworkError } from './api-client';
import useAuthStore from './auth-store';

const TOKEN_KEY = 'mdhd-auth-token';
const USER_KEY = 'mdhd-auth-user';

const USER = { id: 'u1', email: 'reader@example.com', name: 'Reader', avatar_url: null };

const mockAuthFetch = authFetch as Mock;

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    mockAuthFetch.mockReset();
    useAuthStore.setState({ user: null, token: null, isLoading: false });
  });

  describe('restore', () => {
    it('keeps the session when the profile refresh cannot reach the server', async () => {
      localStorage.setItem(TOKEN_KEY, 'jwt');
      localStorage.setItem(USER_KEY, JSON.stringify(USER));
      mockAuthFetch.mockRejectedValue(new NetworkError());

      await useAuthStore.getState().restore();

      const state = useAuthStore.getState();
      expect(state.token).toBe('jwt');
      expect(state.user).toEqual(USER);
      expect(state.isLoading).toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt');
    });

    it('keeps the session when the server is broken', async () => {
      localStorage.setItem(TOKEN_KEY, 'jwt');
      localStorage.setItem(USER_KEY, JSON.stringify(USER));
      mockAuthFetch.mockRejectedValue(new ApiError(503, 'upstream down'));

      await useAuthStore.getState().restore();

      expect(useAuthStore.getState().user).toEqual(USER);
      expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt');
    });

    it('signs out when the server rejects the token', async () => {
      localStorage.setItem(TOKEN_KEY, 'stale-jwt');
      localStorage.setItem(USER_KEY, JSON.stringify(USER));
      mockAuthFetch.mockRejectedValue(new ApiError(401, 'expired'));

      await useAuthStore.getState().restore();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });

    it('caches the profile it fetches so the next offline start has one', async () => {
      localStorage.setItem(TOKEN_KEY, 'jwt');
      mockAuthFetch.mockResolvedValue(USER);

      await useAuthStore.getState().restore();

      expect(useAuthStore.getState().user).toEqual(USER);
      expect(JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')).toEqual(USER);
    });

    it('ignores a corrupt cached profile', async () => {
      localStorage.setItem(TOKEN_KEY, 'jwt');
      localStorage.setItem(USER_KEY, '{not json');
      mockAuthFetch.mockRejectedValue(new NetworkError());

      await useAuthStore.getState().restore();

      expect(useAuthStore.getState().user).toBeNull();
      // The token is still good — only the display copy was unusable.
      expect(useAuthStore.getState().token).toBe('jwt');
    });

    it('does nothing without a stored token', async () => {
      await useAuthStore.getState().restore();

      expect(mockAuthFetch).not.toHaveBeenCalled();
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  describe('login', () => {
    it('keeps a freshly issued token when the profile call cannot go out', async () => {
      mockAuthFetch.mockRejectedValue(new NetworkError());

      await useAuthStore.getState().login('fresh-jwt');

      expect(localStorage.getItem(TOKEN_KEY)).toBe('fresh-jwt');
      expect(useAuthStore.getState().token).toBe('fresh-jwt');
    });

    it('discards a token the server refuses', async () => {
      mockAuthFetch.mockRejectedValue(new ApiError(401, 'nope'));

      await useAuthStore.getState().login('bad-jwt');

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears the cached profile alongside the token', async () => {
      localStorage.setItem(TOKEN_KEY, 'jwt');
      localStorage.setItem(USER_KEY, JSON.stringify(USER));

      useAuthStore.getState().logout();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
