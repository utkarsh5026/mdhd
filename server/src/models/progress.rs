//! Reading progress models — per-file resume state and per-day rollups.
//!
//! `ReadingProgress` tracks the last-known position and cumulative time a user has
//! spent in a single file. `ReadingSession` is a daily aggregate per user that
//! powers streaks and the stats dashboard.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Last-known reading position and accumulated time for a given (user, file).
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReadingProgress {
    pub user_id: Uuid,
    pub file_id: Uuid,
    /// Zero-based index of the last viewed section within the file's section list.
    pub section_index: i32,
    /// Fractional scroll position within the current section, in `[0.0, 1.0]`.
    pub scroll_pct: f32,
    /// Total seconds the user has actively read this file (not wall-clock).
    pub seconds_spent: i32,
    /// Timestamp the file was first marked complete by the client; null until then.
    pub completed_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
    /// Heading-slug breadcrumb to the topmost visible block, or `[]` for blocks
    /// that aren't under any sub-heading. `None` for card mode and legacy rows.
    pub anchor_heading_path: Option<Vec<String>>,
    /// Block index within its heading group (or within the section when path is `[]`).
    pub anchor_block_offset: Option<i32>,
    /// HTML tag of the anchored block (`p`, `ul`, `pre`, etc.), used as a sanity
    /// check during resume so a paragraph isn't matched to a code block at the
    /// same offset after edits.
    pub anchor_block_tag: Option<String>,
    /// 8-char hash of the block's first 80 normalized characters. Lets resume
    /// find the block even when it has shifted within the heading group.
    pub anchor_block_hash: Option<String>,
}

/// Per-day reading-time rollup for a user. One row per (user, day).
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReadingSession {
    pub user_id: Uuid,
    pub day: NaiveDate,
    pub seconds_spent: i32,
    pub files_touched: i32,
    pub updated_at: DateTime<Utc>,
}
