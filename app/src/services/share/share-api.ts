import { apiFetch } from '@/services/auth/api-client';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface ShareResponse {
  token: string;
  url: string;
}

/**
 * POST /files/share — upsert the file on the server and return a public share URL.
 *
 * If the file already has a share token it is preserved, so previously
 * distributed links keep working. Requires the user to be authenticated.
 */
export async function shareFile(
  name: string,
  path: string,
  content: string
): Promise<ShareResponse> {
  return apiFetch<ShareResponse>('/files/share', {
    method: 'POST',
    body: JSON.stringify({ name, path, content }),
  });
}

/**
 * DELETE /files/share/:token — revoke a share link.
 *
 * Requires the user to be authenticated and to own the file.
 */
export async function revokeShare(token: string): Promise<void> {
  return apiFetch<void>(`/files/share/${token}`, { method: 'DELETE' });
}

/**
 * Fetch the raw markdown content of a publicly shared file.
 *
 * This does NOT use `apiFetch` because the endpoint is public and does not
 * require an Authorization header.
 */
export async function fetchSharedContent(token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/share/${token}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || String(response.status));
  }
  return response.text();
}
