//! Domain types for user-owned markdown files.
//!
//! This module defines the database-backed representation of a file. File content itself
//! is stored in Supabase S3; this model holds the metadata needed to locate, identify,
//! and sync it.

use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Full file record as stored in the database.
///
/// This is the internal representation and includes sensitive fields (`storage_key`, `user_id`)
/// that should not be leaked to API responses. Convert to a safe response type before
/// serializing to clients when those fields must be omitted.
#[derive(Debug, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct FileMeta {
    /// Unique identifier for this file record.
    pub id: Uuid,
    /// The user who owns this file.
    pub user_id: Uuid,
    /// Display name of the file (e.g. `"my-notes.md"`).
    pub name: String,
    /// Virtual path within the user's file tree (e.g. `"/docs/my-notes.md"`).
    pub path: String,
    /// Object key used to retrieve the file's content from Supabase S3 storage.
    pub storage_key: String,
    /// Size of the file content in bytes.
    pub size_bytes: i64,
    /// SHA-256 (or equivalent) hash of the file content, used for change detection during sync.
    /// `None` if no hash was computed at upload time.
    pub content_hash: Option<String>,
    /// Opaque UUID token granting public read access to this file's content.
    /// `None` means the file is not currently shared.
    pub share_token: Option<Uuid>,
    /// Timestamp of when this record was first created.
    pub created_at: DateTime<Utc>,
    /// Timestamp of the most recent update to this record.
    pub updated_at: DateTime<Utc>,
}
