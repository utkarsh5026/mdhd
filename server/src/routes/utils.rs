//! Shared utilities for route handlers.
//!
//! This module consolidates logic that is common across multiple route modules
//! (primarily `files` and `share`) to avoid duplication.
//!
//! # Utilities
//!
//! | Function              | Description                                          |
//! |-----------------------|------------------------------------------------------|
//! | [`hex_encode`]        | Encode a byte slice as a lowercase hex string        |
//! | [`validate_path`]     | Ensure a file path starts with `/`                   |
//! | [`storage_key`]       | Derive the S3 storage key for a user + path pair     |
//! | [`prepare_content`]   | Hash and measure content bytes in one call           |
//! | [`fetch_file_by_id`]  | Fetch a `FileMeta` row by primary key or 404         |
//! | [`assert_owner`]      | Return 404 if the file does not belong to the caller |
//! | [`upload_to_s3`]      | Upload bytes to the configured S3 bucket             |

use tracing::instrument;
use uuid::Uuid;

use crate::errors::{AppError, OptionExt};
use crate::models::file::FileMeta;
use crate::state::AppState;
use crate::storage;

/// Encode `bytes` as a lowercase hex string.
///
/// Used for computing SHA-256 content hashes before storing them in the DB.
#[must_use]
pub fn hex_encode(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for &b in bytes {
        s.push(char::from(HEX[usize::from(b >> 4)]));
        s.push(char::from(HEX[usize::from(b & 0xf)]));
    }
    s
}

/// Return `Err(400)` if `path` does not start with `'/'`.
///
/// All stored file paths are absolute (rooted at the user's virtual FS root),
/// so a missing leading slash is always a client error.
///
/// # Errors
///
/// Returns [`AppError::BadRequest`] when `path` does not start with `'/'`.
pub fn validate_path(path: &str) -> Result<(), AppError> {
    if path.starts_with('/') {
        Ok(())
    } else {
        Err(AppError::bad_request("path must start with '/'"))
    }
}

/// Build the S3 object key for a file owned by `user_id` at `path`.
///
/// The key is `"{user_id}{path}"`, e.g. `"550e8400-.../hello/world.md"`.
#[must_use]
pub fn storage_key(user_id: Uuid, path: &str) -> String {
    format!("{user_id}{path}")
}

/// The result of [`prepare_content`]: ready-to-store bytes, byte count, and hash.
pub struct PreparedContent {
    /// Raw UTF-8 bytes of the content.
    pub bytes: Vec<u8>,
    /// `bytes.len()` cast to `i64` for the `size_bytes` DB column.
    pub size_bytes: i64,
    /// Lowercase hex-encoded SHA-256 digest of `bytes`.
    pub hash: String,
}

/// Convert a `&str` content string into [`PreparedContent`].
///
/// # Errors
///
/// Returns [`AppError::BadRequest`] (`"file too large"`, HTTP 400) when the UTF-8
/// byte length of `content` does not fit in an `i64` (practically impossible for
/// normal uploads, but avoids panicking on `try_from`).
pub fn prepare_content(content: &str) -> Result<PreparedContent, AppError> {
    use sha2::{Digest, Sha256};

    let bytes = content.as_bytes().to_vec();
    let size_bytes =
        i64::try_from(bytes.len()).map_err(|_| AppError::bad_request("file too large"))?;
    let hash = hex_encode(&Sha256::digest(&bytes));

    Ok(PreparedContent {
        bytes,
        size_bytes,
        hash,
    })
}

/// Fetch a [`FileMeta`] by primary key, returning `404` if not found.
///
/// # Errors
///
/// Returns [`AppError::Database`] when the query fails.
///
/// Returns [`AppError::NotFound`] when no row exists for `id`.
#[instrument(skip(db), fields(file_id = %id))]
pub async fn fetch_file_by_id(db: &sqlx::PgPool, id: Uuid) -> Result<FileMeta, AppError> {
    sqlx::query_as!(
        FileMeta,
        "SELECT id, user_id, name, path, storage_key, size_bytes, content_hash, share_token, created_at, updated_at
         FROM files WHERE id = $1",
        id
    )
    .fetch_optional(db)
    .await?
    .or_not_found()
}

/// Return `Err(404)` if `file.user_id` does not match `caller_id`.
///
/// We always return 404 (not 403) to avoid leaking the existence of resources
/// owned by other users.
///
/// # Errors
///
/// Returns [`AppError::NotFound`] when `file.user_id` is not `caller_id`.
pub fn assert_owner(file: &FileMeta, caller_id: Uuid) -> Result<(), AppError> {
    if file.user_id == caller_id {
        Ok(())
    } else {
        Err(AppError::NotFound)
    }
}

/// Upload `bytes` to the application's configured S3 bucket under `key`.
///
/// This is a thin convenience wrapper around [`storage::upload_object`] that
/// pulls the S3 client and bucket name directly from [`AppState`], so callers
/// don't have to repeat the `&state.s3` / `&state.config.supabase_storage_bucket`
/// boilerplate in every handler.
///
/// # Errors
///
/// Propagates any S3 transport or service error as an [`AppError::Internal`].
#[instrument(skip(state, bytes), fields(storage_key = %key, size = bytes.len()))]
pub async fn upload_to_s3(state: &AppState, key: &str, bytes: Vec<u8>) -> Result<(), AppError> {
    storage::upload_object(&state.s3, &state.config.supabase_storage_bucket, key, bytes).await?;
    Ok(())
}
