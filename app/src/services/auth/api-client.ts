/** Base URL for all API requests, configured via `VITE_API_URL` env var. */
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Builds a full API URL from a relative path.
 */
function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Authenticated fetch wrapper that injects the JWT bearer token from localStorage.
 *
 * Automatically attaches the `Authorization` header when a token is present
 * and sets `Content-Type: application/json` for requests with a body (unless
 * already specified). Returns `undefined` for 204 No Content responses.
 *
 * @param path - Relative API path (e.g., `'/files'`, `'/sync'`).
 * @param options - Standard `RequestInit` options forwarded to `fetch`.
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
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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
 */
export async function apiFetchText(path: string, options: RequestInit = {}): Promise<string> {
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
export function getOAuthUrl(provider: 'google' | 'github'): string {
  return apiUrl(`/auth/${provider}`);
}
