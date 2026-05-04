/** Base URL for all API requests, configured via `VITE_API_URL` env var. */
const API_BASE = import.meta.env.VITE_API_URL || '';

/** HTTP verbs supported by our API wrappers (narrower than `RequestInit['method']`). */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Same as `RequestInit` but with a typed `method` field. */
export type ApiFetchInit = Omit<RequestInit, 'method'> & {
  method?: HttpMethod;
};

/**
 * Builds a full API URL from a relative path.
 */
function apiUrl(path: string): string {
  return `${API_BASE}/api${path}`;
}

/**
 * Like `apiFetch` but calls `/auth/*` routes directly (no `/api` prefix).
 * Use this for auth endpoints that live outside the `/api` namespace.
 *
 * Automatically attaches the `Authorization` header when a token is present
 * and sets `Content-Type: application/json` for requests with a body (unless
 * already specified). Returns `undefined` for 204 No Content responses.
 *
 * @param path - Path relative to the API base (e.g. `'/auth/me'`).
 * @param options - Fetch options; `method` is limited to {@link HttpMethod}.
 */
export async function authFetch<T>(path: string, options: ApiFetchInit = {}): Promise<T> {
  const token = localStorage.getItem('mdhd-auth-token');

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `API error: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/**
 * Authenticated fetch to `/api/*` that injects the JWT bearer token from localStorage.
 *
 * Automatically attaches the `Authorization` header when a token is present
 * and sets `Content-Type: application/json` for requests with a body (unless
 * already specified). Returns `undefined` for 204 No Content responses.
 *
 * @param path - Relative API path (e.g. `'/files'`, `'/sync'`).
 * @param options - Fetch options; `method` is limited to {@link HttpMethod}.
 * @returns The parsed JSON response body, typed as `T`.
 * @throws {Error} On non-OK responses, with the response body text or a
 *   fallback message including the HTTP status code.
 *
 * @example
 * ```ts
 * const files = await apiFetch<FileList>('/files');
 * await apiFetch<void>('/sync', { method: 'POST', body: JSON.stringify(payload) });
 * ```
 */
export async function apiFetch<T>(path: string, options: ApiFetchInit = {}): Promise<T> {
  const token = localStorage.getItem('mdhd-auth-token');

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(path), { ...options, headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `API error: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/**
 * Like `apiFetch` but returns the raw response body as a string instead of JSON.
 * Use this for endpoints that return `text/markdown` or other non-JSON content.
 *
 * @param options - Fetch options; `method` is limited to {@link HttpMethod}.
 */
export async function apiFetchText(path: string, options: ApiFetchInit = {}): Promise<string> {
  const token = localStorage.getItem('mdhd-auth-token');

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), { ...options, headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `API error: ${response.status}`);
  }

  return response.text();
}

/**
 * Returns the full URL to start the OAuth flow for a given provider.
 *
 * The returned URL is intended for browser navigation (e.g., `window.location.href`),
 * which initiates the server-side OAuth redirect flow.
 *
 * @param provider - The OAuth provider to authenticate with.
 */
export function getOAuthUrl(provider: 'google'): string {
  return `${API_BASE}/auth/${provider}`;
}
