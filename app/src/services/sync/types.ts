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

/**
 * A file that was downloaded for the first time on this device — i.e. no
 * matching record existed in IndexedDB before the sync. Used by the UI layer
 * to auto-open these files as tabs (the "paste on laptop, read on mobile"
 * workflow).
 */
export interface NewlyDownloadedFile {
  fileId: string;
  name: string;
  path: string;
  content: string;
}

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  deleted: number;
  serverTime: string;
  /** Files downloaded from the server that did not exist locally before this sync. */
  newFiles: NewlyDownloadedFile[];
  /** File IDs that were deleted from IndexedDB during this sync. */
  deletedFileIds: string[];
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
