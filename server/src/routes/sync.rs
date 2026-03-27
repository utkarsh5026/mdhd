use std::collections::HashMap;

use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use tracing::{info, instrument};

use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::file::FileMeta;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/sync", post(sync_files))
}

/// A single file entry from the client's local manifest.
#[derive(Debug, Deserialize)]
pub struct ClientFileEntry {
    pub path: String,
    pub content_hash: String,
    pub updated_at: DateTime<Utc>,
}

/// Request body for POST /sync.
#[derive(Debug, Deserialize)]
pub struct SyncRequest {
    /// The client's full local file manifest.
    pub files: Vec<ClientFileEntry>,
    /// The `server_time` returned by the last successful sync, or null on first sync.
    pub last_sync_at: Option<DateTime<Utc>>,
}

/// A file the client should download.
#[derive(Debug, Serialize)]
pub struct DownloadEntry {
    pub id: Uuid,
    pub name: String,
    pub path: String,
    pub content_hash: String,
    pub updated_at: DateTime<Utc>,
}

/// Response body for POST /sync.
#[derive(Debug, Serialize)]
pub struct SyncResponse {
    /// Paths the client should upload via POST /files.
    pub to_upload: Vec<String>,
    /// Files the client should download via GET /files/:id/content.
    pub to_download: Vec<DownloadEntry>,
    /// Paths the client should delete locally.
    pub to_delete: Vec<String>,
    /// Store this as `last_sync_at` for the next sync call.
    pub server_time: DateTime<Utc>,
}

/// POST /sync — bidirectional file sync using last-write-wins reconciliation.
///
/// The client sends its full file manifest (paths + hashes + timestamps).
/// The server compares against its own state and returns three lists:
/// - `to_upload`: paths the server is missing or where client is newer
/// - `to_download`: files the server has that client is missing or where server is newer
/// - `to_delete`: paths the client has that the server no longer has (client deleted them on another device)
#[instrument(skip(state, body), fields(user_id = %auth.user_id, client_files = body.files.len()))]
async fn sync_files(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<SyncRequest>,
) -> Result<Json<SyncResponse>, AppError> {
    let server_time = Utc::now();

    let server_files = sqlx::query_as!(
        FileMeta,
        "SELECT * FROM files WHERE user_id = $1",
        auth.user_id
    )
    .fetch_all(&state.db)
    .await?;

    let server_map: HashMap<&str, &FileMeta> =
        server_files.iter().map(|f| (f.path.as_str(), f)).collect();

    let client_map: HashMap<&str, &ClientFileEntry> =
        body.files.iter().map(|f| (f.path.as_str(), f)).collect();

    let mut to_upload: Vec<String> = Vec::new();
    let mut to_download: Vec<DownloadEntry> = Vec::new();
    let mut to_delete: Vec<String> = Vec::new();

    for client_file in &body.files {
        match server_map.get(client_file.path.as_str()) {
            None => {
                to_upload.push(client_file.path.clone());
            }
            Some(server_file) => {
                let server_hash = server_file.content_hash.as_deref().unwrap_or("");
                if client_file.content_hash == server_hash {
                } else if client_file.updated_at >= server_file.updated_at {
                    to_upload.push(client_file.path.clone());
                } else {
                    to_download.push(download_entry(server_file));
                }
            }
        }
    }

    for server_file in &server_files {
        if client_map.contains_key(server_file.path.as_str()) {
            continue;
        }

        match body.last_sync_at {
            None => {
                to_download.push(download_entry(server_file));
            }
            Some(last_sync) => {
                if server_file.created_at > last_sync {
                    to_download.push(download_entry(server_file));
                } else {
                    to_delete.push(server_file.path.clone());
                }
            }
        }
    }

    info!(
        uploads = to_upload.len(),
        downloads = to_download.len(),
        deletes = to_delete.len(),
        "sync reconciliation complete"
    );

    Ok(Json(SyncResponse {
        to_upload,
        to_download,
        to_delete,
        server_time,
    }))
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
