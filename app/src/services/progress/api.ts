import { apiFetch } from '@/services/auth/api-client';

/** Last-known reading position for a single file as returned by the server. */
export interface ServerProgress {
  file_id: string;
  section_index: number;
  scroll_pct: number;
  seconds_spent: number;
  completed_at: string | null;
  updated_at: string;
  anchor_heading_path: string[] | null;
  anchor_block_offset: number | null;
  anchor_block_tag: string | null;
  anchor_block_hash: string | null;
}

/** A single entry in a `POST /progress` batch. */
export interface ProgressEntry {
  file_id: string;
  section_index: number;
  scroll_pct: number;
  /** Active seconds elapsed since the previous flush for this file. */
  seconds_delta: number;
  completed?: boolean;
  /**
   * Optional sub-section anchor for cross-device resume. All four fields are
   * captured together; an empty `heading_path` is valid and means "no
   * sub-heading above this block."
   */
  anchor_heading_path?: string[];
  anchor_block_offset?: number;
  anchor_block_tag?: string;
  anchor_block_hash?: string | null;
}

export interface DayBucket {
  day: string;
  seconds_spent: number;
}

export interface RecentFile {
  file_id: string;
  name: string;
  section_index: number;
  scroll_pct: number;
  updated_at: string;
}

export interface StatsSummary {
  total_seconds: number;
  files_completed: number;
  current_streak: number;
  longest_streak: number;
  last_7_days: DayBucket[];
  recent_files: RecentFile[];
}

/** Fetch all reading-progress rows for the authenticated user. */
export async function fetchAllProgress(): Promise<ServerProgress[]> {
  return apiFetch<ServerProgress[]>('/progress');
}

/** Fetch a single file's progress. Returns `null` on 404 (no progress yet). */
export async function fetchProgressForFile(fileId: string): Promise<ServerProgress | null> {
  try {
    return await apiFetch<ServerProgress>(`/progress/${fileId}`);
  } catch (err) {
    if (err instanceof Error && /404/.test(err.message)) return null;
    throw err;
  }
}

/** Send a batch of progress updates. Server responds with 204. */
export async function postProgressBatch(entries: ProgressEntry[]): Promise<void> {
  if (entries.length === 0) return;
  await apiFetch<void>('/progress', {
    method: 'POST',
    body: JSON.stringify({ entries }),
  });
}

/** Fetch the stats dashboard summary (totals, streaks, last-7-days, recent files). */
export async function fetchStatsSummary(): Promise<StatsSummary> {
  return apiFetch<StatsSummary>('/stats/summary');
}

/**
 * Best-effort flush via `navigator.sendBeacon` so progress is recorded even
 * when the page is closing. Falls back to `fetch + keepalive` when sendBeacon
 * is not available (e.g. in tests).
 */
export function sendProgressBeacon(entries: ProgressEntry[]): void {
  if (entries.length === 0) return;
  const token = localStorage.getItem('mdhd-auth-token');
  if (!token) return;
  const apiBase = import.meta.env.VITE_API_URL || '';
  const url = `${apiBase}/api/progress`;
  const body = JSON.stringify({ entries });

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    // sendBeacon ignores headers, so the server must accept the JWT via query
    // string fallback OR we use fetch+keepalive. The server only reads the
    // Authorization header, so we use fetch+keepalive instead.
  }
  try {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort
  }
}
