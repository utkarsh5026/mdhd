import { apiFetch } from '@/services/auth/api-client';

/** A tab as persisted on the server. Only file-backed tabs are synced. */
export interface ServerTab {
  file_id: string;
  position: number;
  is_active: boolean;
  pinned: boolean;
  updated_at: string;
  custom_icon: string | null;
  /** Opaque JSON string — deserialize on the client before use. */
  custom_cover: string | null;
}

/** A single entry in a `PUT /tabs` request body. */
export interface TabEntry {
  file_id: string;
  position: number;
  is_active: boolean;
  pinned: boolean;
  custom_icon: string | null;
  /** Serialized JSON string of the cover override object. */
  custom_cover: string | null;
}

/** Fetch all tabs the authenticated user has open across devices. */
export async function fetchTabs(): Promise<ServerTab[]> {
  return apiFetch<ServerTab[]>('/tabs');
}

/**
 * Replace the user's tab set on the server with `tabs`.
 *
 * Server diffs against current state in a single transaction — entries not in
 * `tabs` are removed, the rest are upserted. Empty array clears all tabs.
 */
export async function putTabs(tabs: TabEntry[]): Promise<void> {
  await apiFetch<void>('/tabs', {
    method: 'PUT',
    body: JSON.stringify({ tabs }),
  });
}
