import type { Bookmark } from '@/components/features/tabs/store/types';
import { apiFetch } from '@/services/auth/api-client';

/** Bookmark shape as returned by the server. */
export interface ServerBookmark {
  id: string;
  file_id: string;
  section_index: number;
  name: string;
  created_at: string;
}

export async function fetchBookmarks(fileId: string): Promise<ServerBookmark[]> {
  return apiFetch<ServerBookmark[]>(`/files/${fileId}/bookmarks`);
}

export async function createBookmark(
  fileId: string,
  sectionIndex: number,
  name: string
): Promise<ServerBookmark> {
  return apiFetch<ServerBookmark>(`/files/${fileId}/bookmarks`, {
    method: 'POST',
    body: JSON.stringify({ section_index: sectionIndex, name }),
  });
}

export async function deleteBookmark(fileId: string, bookmarkServerId: string): Promise<void> {
  return apiFetch<void>(`/files/${fileId}/bookmarks/${bookmarkServerId}`, {
    method: 'DELETE',
  });
}

/** Convert a server bookmark to the local Bookmark shape. */
export function toLocalBookmark(s: ServerBookmark): Bookmark {
  return {
    localId: s.id,
    serverId: s.id,
    sectionIndex: s.section_index,
    name: s.name,
    createdAt: new Date(s.created_at).getTime(),
  };
}
