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

/**
 * Fetches all bookmarks for a given file from the server.
 *
 * @param fileId - The ID of the file whose bookmarks should be retrieved.
 * @returns A promise resolving to the list of bookmarks stored on the server for that file.
 */
export async function fetchBookmarks(fileId: string): Promise<ServerBookmark[]> {
  return apiFetch<ServerBookmark[]>(`/files/${fileId}/bookmarks`);
}

/**
 * Creates a new bookmark on the server for the specified file and section.
 *
 * @param fileId - The ID of the file to bookmark.
 * @param sectionIndex - The zero-based index of the section being bookmarked.
 * @param name - A user-visible label for the bookmark.
 * @returns A promise resolving to the newly created bookmark as returned by the server.
 */
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

/**
 * Deletes a bookmark from the server.
 *
 * @param fileId - The ID of the file that owns the bookmark.
 * @param bookmarkServerId - The server-assigned ID of the bookmark to remove.
 */
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
