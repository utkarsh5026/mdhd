/** Base URL for all API requests, configured via `VITE_API_URL` env var. */
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * A response came back, but it wasn't a 2xx.
 *
 * Carries the status so callers can tell "your session is gone" (401/403 —
 * clear it) from "the server is having a bad day" (5xx — keep it and retry).
 */
export class ApiError extends Error {
  /** HTTP status code of the failing response. */
  readonly status: number;

  constructor(status: number, message: string) {
    super(message || `API error: ${status}`);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * The request never reached a server: no connection, DNS failure, CORS
 * rejection, or an aborted request.
 *
 * MDHD is offline-first, so this is an expected outcome rather than a fault —
 * callers use it to defer work until connectivity returns instead of
 * destroying local state.
 */
export class NetworkError extends Error {
  /** The underlying `fetch` rejection, kept for debugging. */
  readonly reason: unknown;

  constructor(reason?: unknown) {
    super('Network request failed');
    this.name = 'NetworkError';
    this.reason = reason;
  }
}

/**
 * `true` when the error means "we couldn't reach the server", covering both a
 * failed request and an explicit offline state.
 *
 * @param error - Any thrown value.
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Performs the fetch, normalising the two failure modes into {@link NetworkError}
 * and {@link ApiError} so every caller can branch on them.
 */
async function request(url: string, options: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new NetworkError(err);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ApiError(response.status, text);
  }

  return response;
}

/**
 * Builds the `Authorization` / `Content-Type` headers shared by every wrapper.
 */
function buildHeaders(options: ApiFetchInit): Headers {
  const token = localStorage.getItem('mdhd-auth-token');

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

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
 * @throws {NetworkError} When the server could not be reached.
 * @throws {ApiError} On a non-2xx response.
 */
export async function authFetch<T>(path: string, options: ApiFetchInit = {}): Promise<T> {
  const response = await request(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

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
 * @throws {NetworkError} When the server could not be reached — expected
 *   whenever the user is offline, and never a reason to discard local state.
 * @throws {ApiError} On a non-2xx response, carrying the status code.
 *
 * @example
 * ```ts
 * const files = await apiFetch<FileList>('/files');
 * await apiFetch<void>('/sync', { method: 'POST', body: JSON.stringify(payload) });
 * ```
 */
export async function apiFetch<T>(path: string, options: ApiFetchInit = {}): Promise<T> {
  const response = await request(apiUrl(path), { ...options, headers: buildHeaders(options) });

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
  const response = await request(apiUrl(path), { ...options, headers: buildHeaders(options) });
  return response.text();
}

/**
 * Base URL for OAuth flows. Falls back to {@link API_BASE} when unset.
 *
 * In PR-preview deployments, this points at the stable stage backend that
 * holds the registered Google OAuth credentials, while {@link API_BASE} points
 * at the per-PR backend. Splitting them lets every PR exercise its own
 * backend for normal API calls while routing login through the one backend
 * Google knows about. In prod and local dev they're the same value.
 */
const OAUTH_BASE = import.meta.env.VITE_OAUTH_URL || API_BASE;

/**
 * Returns the full URL to start the OAuth flow for a given provider.
 *
 * The returned URL is intended for browser navigation (e.g., `window.location.href`),
 * which initiates the server-side OAuth redirect flow.
 *
 * Passes `return_to=<current origin>` so the backend redirects back to the
 * frontend that initiated the flow — required for PR-preview deployments
 * where each preview has a unique Vercel URL but all share one stable
 * OAuth backend. The backend validates this against an allowlist before
 * honoring it, so it can't be used for open redirects.
 *
 * @param provider - The OAuth provider to authenticate with.
 */
export function getOAuthUrl(provider: 'google'): string {
  const returnTo = encodeURIComponent(window.location.origin);
  return `${OAUTH_BASE}/auth/${provider}?return_to=${returnTo}`;
}
