//! Open-tab model — one row per file the user has open in their tab bar.
//!
//! Synced across devices so the working set follows the user. Only file-backed
//! tabs are persisted (unsaved tabs are local-only and skipped by the client).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A single open tab for a user, identified by the file it points at.
///
/// The `(user_id, file_id)` pair is the primary key, so opening the same file
/// twice doesn't create two rows — tabs are file-scoped, not session-scoped.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserTab {
    pub user_id: Uuid,
    pub file_id: Uuid,
    /// Order in the tab bar. Server returns rows sorted by this ascending.
    pub position: i32,
    /// True for the single tab the user last had focused on this account.
    pub is_active: bool,
    pub pinned: bool,
    pub updated_at: DateTime<Utc>,
}
