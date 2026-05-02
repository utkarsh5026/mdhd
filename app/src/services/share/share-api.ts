import { apiFetch } from '@/services/auth/api-client';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface ShareResponse {
  token: string;
  url: string;
}

/**
 * POST /share/file — upsert the file on the server and return a public share URL.
 *
 * If the file already has a share token it is preserved, so previously
 * distributed links keep working. Requires the user to be authenticated.
 */
export async function shareFile(
  name: string,
  path: string,
  content: string
): Promise<ShareResponse> {
  return apiFetch<ShareResponse>('/share/file', {
    method: 'POST',
    body: JSON.stringify({ name, path, content }),
  });
}

/**
 * DELETE /share/file/:token — revoke a file share link.
 *
 * Requires the user to be authenticated and to own the file.
 */
export async function revokeFileShare(token: string): Promise<void> {
  return apiFetch<void>(`/share/file/${token}`, { method: 'DELETE' });
}

/**
 * POST /share/paste — store paste content inline and return a public share URL.
 *
 * Unlike file sharing, paste content is stored directly in the database — no
 * file upload required. Each call produces a fresh share token. Requires auth.
 */
export async function sharePaste(title: string, content: string): Promise<ShareResponse> {
  return apiFetch<ShareResponse>('/share/paste', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });
}

/**
 * DELETE /share/paste/:token — revoke a paste share link.
 *
 * Requires the user to be authenticated and to own the paste share.
 */
export async function revokePasteShare(token: string): Promise<void> {
  return apiFetch<void>(`/share/paste/${token}`, { method: 'DELETE' });
}

/**
 * Revoke a share link for either a file or paste tab.
 *
 * Dispatches to the correct endpoint based on `sourceType` so callers don't
 * need to know which backend route to use.
 */
export async function revokeShare(token: string, sourceType: 'file' | 'paste'): Promise<void> {
  return sourceType === 'paste' ? revokePasteShare(token) : revokeFileShare(token);
}

export interface SharedContent {
  content: string;
  sharer_name: string | null;
  sharer_avatar: string | null;
}

/**
 * Fetch the markdown content and sharer metadata for a publicly shared resource.
 *
 * This does NOT use `apiFetch` because the endpoint is public and does not
 * require an Authorization header.
 */
export async function fetchSharedContent(token: string): Promise<SharedContent> {
  const response = await fetch(`${API_BASE}/api/share/${token}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || String(response.status));
  }
  return response.json() as Promise<SharedContent>;
}
