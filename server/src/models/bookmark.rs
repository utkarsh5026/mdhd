//! Bookmark model for persisting named reading positions within files.
//!
//! Bookmarks let users save and recall specific sections of a document by name,
//! enabling quick navigation back to points of interest across sessions.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A named, saved position within a user-owned file.
///
/// Each bookmark pins a specific section of a document (identified by its zero-based index
/// within the parsed section list) and associates it with a human-readable name chosen by
/// the user. Bookmarks are scoped to a `(user_id, file_id)` pair so that different users
/// can independently bookmark the same file without conflict.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Bookmark {
    /// Unique identifier for this bookmark.
    pub id: Uuid,
    /// The user who owns this bookmark.
    pub user_id: Uuid,
    /// The file this bookmark points into.
    pub file_id: Uuid,
    /// Zero-based index of the target section within the file's parsed section list.
    pub section_index: i32,
    /// Display name given to this bookmark by the user (e.g. `"Introduction"`, `"TODO here"`).
    pub name: String,
    pub created_at: DateTime<Utc>,
}
