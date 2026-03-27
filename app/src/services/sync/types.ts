export interface ClientFileEntry {
  path: string;
  content_hash: string;
  updated_at: string; // ISO 8601
}

export interface DownloadEntry {
  id: string;
  name: string;
  path: string;
  content_hash: string;
  updated_at: string;
}

export interface SyncRequest {
  files: ClientFileEntry[];
  last_sync_at: string | null;
}

export interface SyncResponse {
  to_upload: string[];
  to_download: DownloadEntry[];
  to_delete: string[];
  server_time: string;
}

export interface CreateFileRequest {
  name: string;
  path: string;
  content: string;
}

export interface DownloadedPaste {
  tabId: string;
  title: string;
  content: string;
}

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  deleted: number;
  serverTime: string;
  /** Paste tabs downloaded from another device that need to be opened. */
  downloadedPastes: DownloadedPaste[];
  /** Tab IDs of paste tabs that were deleted on another device. */
  deletedPasteTabIds: string[];
}

/** Intermediate result of fetching a file from the server before writing to IndexedDB. */
export interface FetchedFile {
  entry: DownloadEntry;
  content: string;
  hash: string;
  existingId: string | null;
}

/** A local file resolved by path, ready to be deleted. */
export interface ResolvedDelete {
  id: string;
  path: string;
}

export interface ClientSettingEntry {
  key: string;
  hash: string;
  updated_at: string;
  value: Record<string, unknown>;
}

export interface ServerSettingEntry {
  key: string;
  value: Record<string, unknown>;
  hash: string;
  updated_at: string;
}

export interface SettingsSyncRequest {
  settings: ClientSettingEntry[];
}

export interface SettingsSyncResponse {
  updated: ServerSettingEntry[];
  accepted: string[];
  server_time: string;
}

export interface SettingsSyncResult {
  pushed: number;
  pulled: number;
}
