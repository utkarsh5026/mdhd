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

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use chrono::{Duration, Utc};
    use serde_json::{Value, json};
    use sqlx::PgPool;
    use tower::ServiceExt;
    use uuid::Uuid;

    use crate::testutil::{create_test_user, post_json, test_state};

    async fn setup(db: PgPool) -> (axum::Router, Uuid, String) {
        let (user_id, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));
        (app, user_id, token)
    }

    async fn post_sync(app: axum::Router, token: &str, body: Value) -> (StatusCode, Value) {
        post_json(app, "/sync", token, body).await
    }

    async fn seed_file(
        db: &PgPool,
        user_id: Uuid,
        path: &str,
        hash: &str,
        updated_at: chrono::DateTime<Utc>,
        created_at: chrono::DateTime<Utc>,
    ) -> Uuid {
        sqlx::query_scalar(
            "INSERT INTO files (user_id, name, path, storage_key, size_bytes, content_hash, created_at, updated_at)
             VALUES ($1, $2, $3, 'key', 0, $4, $5, $6)
             RETURNING id",
        )
        .bind(user_id)
        .bind(path.rsplit('/').next().unwrap_or(path))
        .bind(path)
        .bind(hash)
        .bind(created_at)
        .bind(updated_at)
        .fetch_one(db)
        .await
        .unwrap()
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn missing_token_returns_401(db: PgPool) {
        let (app, _, _) = setup(db).await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/sync")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({ "files": [], "last_sync_at": null }).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn empty_client_empty_server_returns_nothing(db: PgPool) {
        let (app, _, token) = setup(db).await;

        let (status, body) =
            post_sync(app, &token, json!({ "files": [], "last_sync_at": null })).await;

        assert_eq!(status, StatusCode::OK);
        assert!(body["to_upload"].as_array().unwrap().is_empty());
        assert!(body["to_download"].as_array().unwrap().is_empty());
        assert!(body["to_delete"].as_array().unwrap().is_empty());
        assert!(body["server_time"].is_string());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn client_only_file_is_marked_for_upload(db: PgPool) {
        let (app, _, token) = setup(db).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "files": [{ "path": "notes/readme.md", "content_hash": "abc", "updated_at": Utc::now() }],
                "last_sync_at": null
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        let uploads = body["to_upload"].as_array().unwrap();
        assert_eq!(uploads.len(), 1);
        assert_eq!(uploads[0], "notes/readme.md");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn server_only_file_first_sync_is_downloaded(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        let now = Utc::now();
        seed_file(&db, user_id, "docs/guide.md", "h1", now, now).await;

        let (status, body) =
            post_sync(app, &token, json!({ "files": [], "last_sync_at": null })).await;

        assert_eq!(status, StatusCode::OK);
        let downloads = body["to_download"].as_array().unwrap();
        assert_eq!(downloads.len(), 1);
        assert_eq!(downloads[0]["path"], "docs/guide.md");
        assert_eq!(downloads[0]["content_hash"], "h1");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn server_only_file_created_after_last_sync_is_downloaded(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        let last_sync = Utc::now() - Duration::hours(1);
        let created = Utc::now();
        seed_file(&db, user_id, "new.md", "h1", created, created).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({ "files": [], "last_sync_at": last_sync }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        let downloads = body["to_download"].as_array().unwrap();
        assert_eq!(downloads.len(), 1);
        assert_eq!(downloads[0]["path"], "new.md");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn server_only_file_created_before_last_sync_is_deleted(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        let created = Utc::now() - Duration::hours(2);
        let last_sync = Utc::now() - Duration::hours(1);
        seed_file(&db, user_id, "old.md", "h1", created, created).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({ "files": [], "last_sync_at": last_sync }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        let deletes = body["to_delete"].as_array().unwrap();
        assert_eq!(deletes.len(), 1);
        assert_eq!(deletes[0], "old.md");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn matching_hash_produces_no_action(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        let now = Utc::now();
        seed_file(&db, user_id, "file.md", "same", now, now).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "files": [{ "path": "file.md", "content_hash": "same", "updated_at": now }],
                "last_sync_at": null
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        assert!(body["to_upload"].as_array().unwrap().is_empty());
        assert!(body["to_download"].as_array().unwrap().is_empty());
        assert!(body["to_delete"].as_array().unwrap().is_empty());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn client_newer_file_is_marked_for_upload(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        let server_time = Utc::now() - Duration::hours(1);
        seed_file(
            &db,
            user_id,
            "file.md",
            "old_hash",
            server_time,
            server_time,
        )
        .await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "files": [{ "path": "file.md", "content_hash": "new_hash", "updated_at": Utc::now() }],
                "last_sync_at": null
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        let uploads = body["to_upload"].as_array().unwrap();
        assert_eq!(uploads.len(), 1);
        assert_eq!(uploads[0], "file.md");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn server_newer_file_is_marked_for_download(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        let now = Utc::now();
        seed_file(&db, user_id, "file.md", "server_hash", now, now).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "files": [{ "path": "file.md", "content_hash": "client_hash", "updated_at": now - Duration::hours(1) }],
                "last_sync_at": null
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        let downloads = body["to_download"].as_array().unwrap();
        assert_eq!(downloads.len(), 1);
        assert_eq!(downloads[0]["path"], "file.md");
        assert_eq!(downloads[0]["content_hash"], "server_hash");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn mixed_sync_returns_correct_buckets(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        let now = Utc::now();
        let old = now - Duration::hours(2);
        let last_sync = now - Duration::hours(1);

        seed_file(&db, user_id, "unchanged.md", "same", now, now).await;
        seed_file(&db, user_id, "server_newer.md", "s_hash", now, now).await;
        seed_file(&db, user_id, "server_only_new.md", "sn", now, now).await;
        seed_file(&db, user_id, "server_only_old.md", "so", old, old).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "files": [
                    { "path": "unchanged.md", "content_hash": "same", "updated_at": now },
                    { "path": "server_newer.md", "content_hash": "c_hash", "updated_at": old },
                    { "path": "client_only.md", "content_hash": "co", "updated_at": now },
                ],
                "last_sync_at": last_sync
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);

        let uploads: Vec<&str> = body["to_upload"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap())
            .collect();
        assert!(uploads.contains(&"client_only.md"));
        assert_eq!(uploads.len(), 1);

        let downloads: Vec<&str> = body["to_download"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v["path"].as_str().unwrap())
            .collect();
        assert!(downloads.contains(&"server_newer.md"));
        assert!(downloads.contains(&"server_only_new.md"));
        assert_eq!(downloads.len(), 2);

        let deletes: Vec<&str> = body["to_delete"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap())
            .collect();
        assert!(deletes.contains(&"server_only_old.md"));
        assert_eq!(deletes.len(), 1);
    }

    // ── Isolation: other user's files are not visible ────────────────

    #[sqlx::test(migrations = "./migrations")]
    async fn other_users_files_are_not_visible(db: PgPool) {
        let (app, _, token) = setup(db.clone()).await;

        // Create a second user and seed a file for them
        let (other_user, _) = create_test_user(&db).await;
        let now = Utc::now();
        seed_file(&db, other_user, "secret.md", "x", now, now).await;

        let (status, body) =
            post_sync(app, &token, json!({ "files": [], "last_sync_at": null })).await;

        assert_eq!(status, StatusCode::OK);
        assert!(body["to_download"].as_array().unwrap().is_empty());
    }

    // ── Equal timestamps with different hash → client wins ───────────

    #[sqlx::test(migrations = "./migrations")]
    async fn equal_timestamps_different_hash_client_wins(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        let t = Utc::now();
        seed_file(&db, user_id, "tie.md", "server_h", t, t).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "files": [{ "path": "tie.md", "content_hash": "client_h", "updated_at": t }],
                "last_sync_at": null
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        // `>=` in the code means equal timestamp → client wins → upload
        let uploads = body["to_upload"].as_array().unwrap();
        assert_eq!(uploads.len(), 1);
        assert_eq!(uploads[0], "tie.md");
    }
}
