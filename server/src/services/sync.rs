//! Sync reconciliation logic for bidirectional cross-device file sync.
//!
//! This module is pure business logic — it takes a [`SyncManifest`] describing what the server and
//! client each have, and returns a [`SyncDecision`] with three disjoint action lists. No I/O or
//! database access happens here, making the reconciliation fully unit-testable.

use crate::models::file::FileMeta;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A single file entry from the client's local manifest.
#[derive(Debug, Deserialize)]
pub struct ClientFileEntry {
    pub path: String,
    pub content_hash: String,
    pub updated_at: DateTime<Utc>,
}

/// A file the client should download.
#[derive(Debug, Serialize)]
pub struct DownloadEntry {
    pub id: uuid::Uuid,
    pub name: String,
    pub path: String,
    pub content_hash: String,
    pub updated_at: DateTime<Utc>,
}

/// The inputs to [`reconcile`]: the server's current file list, the client's manifest, and the
/// timestamp of the client's last successful sync.
pub struct SyncManifest {
    /// All files currently stored on the server for this user.
    pub server: Vec<FileMeta>,
    /// The client's full local file manifest at the time of the sync request.
    pub client: Vec<ClientFileEntry>,
    /// The `server_time` returned by the previous sync, or `None` on the very first sync.
    ///
    /// Used to distinguish between "server has a file the client deleted" (file predates last sync)
    /// and "server has a new file the client doesn't know about yet" (file postdates last sync).
    pub last_sync_at: Option<DateTime<Utc>>,
}

/// The three disjoint action lists produced by [`reconcile`].
pub struct SyncDecision {
    /// Paths the client should upload via `POST /files`.
    pub upload: Vec<String>,
    /// Files the client should download via `GET /files/:id/content`.
    pub download: Vec<DownloadEntry>,
    /// Paths the client should delete from its local store.
    pub delete: Vec<String>,
}

fn download_entry(f: &FileMeta) -> DownloadEntry {
    DownloadEntry {
        id: f.id,
        name: f.name.clone(),
        path: f.path.clone(),
        content_hash: f.content_hash.clone().unwrap_or_default(),
        updated_at: f.updated_at,
    }
}

/// Computes which files need to be uploaded, downloaded, or deleted using last-write-wins.
///
/// The algorithm works in two passes:
///
/// 1. **Client files** — for each file the client has:
///    - If the server doesn't have it → client uploads.
///    - If hashes match → no action needed.
///    - If hashes differ and client is newer (or equal timestamp) → client uploads.
///    - If hashes differ and server is newer → client downloads.
///
/// 2. **Server-only files** — for each file the server has that the client didn't mention:
///    - If `last_sync_at` is `None` (first sync) → client downloads.
///    - If the file was created after `last_sync_at` → it's new on another device → client downloads.
///    - Otherwise → the client deleted it on another device → client deletes its own copy if any.
pub fn reconcile(manifest: &SyncManifest) -> SyncDecision {
    let server_map: HashMap<&str, &FileMeta> = manifest
        .server
        .iter()
        .map(|f| (f.path.as_str(), f))
        .collect();

    let client_map: HashMap<&str, &ClientFileEntry> = manifest
        .client
        .iter()
        .map(|f| (f.path.as_str(), f))
        .collect();

    let mut upload = Vec::new();
    let mut download = Vec::new();
    let mut delete = Vec::new();

    for f in &manifest.client {
        match server_map.get(f.path.as_str()) {
            None => {
                upload.push(f.path.clone());
            }
            Some(sf) => {
                let server_hash = sf.content_hash.as_deref().unwrap_or("");
                if f.content_hash == server_hash {
                } else if f.updated_at >= sf.updated_at {
                    upload.push(f.path.clone());
                } else {
                    download.push(download_entry(sf));
                }
            }
        }
    }

    for f in &manifest.server {
        if client_map.contains_key(f.path.as_str()) {
            continue;
        }

        match manifest.last_sync_at {
            None => {
                download.push(download_entry(f));
            }
            Some(last_sync) => {
                if f.created_at > last_sync {
                    download.push(download_entry(f));
                } else {
                    delete.push(f.path.clone());
                }
            }
        }
    }

    SyncDecision {
        upload,
        download,
        delete,
    }
}
