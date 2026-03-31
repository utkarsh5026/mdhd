use std::time::Duration;

use axum::extract::{Path, State};
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use tracing::{info, instrument, warn};

use crate::errors::{AppError, ResultExt};
use crate::middleware::auth::AuthUser;
use crate::models::file::FileMeta;
use crate::routes::utils::{
    assert_owner, fetch_file_by_id, prepare_content, storage_key, validate_path,
};
use crate::state::AppState;
use crate::storage;

#[derive(Debug, Serialize)]
pub struct FileResponse {
    pub id: Uuid,
    pub name: String,
    pub path: String,
    pub size_bytes: i64,
    pub content_hash: Option<String>,
    pub share_token: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<FileMeta> for FileResponse {
    fn from(f: FileMeta) -> Self {
        FileResponse {
            id: f.id,
            name: f.name,
            path: f.path,
            size_bytes: f.size_bytes,
            content_hash: f.content_hash,
            share_token: f.share_token,
            created_at: f.created_at,
            updated_at: f.updated_at,
        }
    }
}

/// Request body for uploading a new file or overwriting an existing one.
#[derive(Debug, Deserialize)]
pub struct CreateFileRequest {
    pub name: String,
    pub path: String,
    pub content: String,
}

/// Request body for POST /files/import-url.
#[derive(Debug, Deserialize)]
pub struct ImportUrlRequest {
    pub url: String,
}

/// Response body for POST /files/import-url.
#[derive(Debug, Serialize)]
pub struct ImportUrlResponse {
    pub content: String,
    pub filename: String,
    pub size: usize,
}

/// Maximum size in bytes for URL-imported content (5 MB).
const IMPORT_URL_MAX_SIZE: usize = 5 * 1024 * 1024;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/files/search", get(search_files))
        .route("/files/import-url", post(import_url))
        .route("/files", get(list_files).post(create_file))
        .route("/files/{id}", get(get_file).delete(delete_file))
        .route("/files/{id}/content", get(download_content))
}

/// GET /files — list all files belonging to the authenticated user.
#[instrument(skip(state), fields(user_id = %auth.user_id))]
async fn list_files(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<FileResponse>>, AppError> {
    let files = sqlx::query_as!(
        FileMeta,
        "SELECT id, user_id, name, path, storage_key, size_bytes, content_hash, share_token, created_at, updated_at
         FROM files WHERE user_id = $1 ORDER BY path ASC",
        auth.user_id
    )
    .fetch_all(&state.db)
    .await?;

    info!(count = files.len(), "listed files");
    Ok(Json(files.into_iter().map(FileResponse::from).collect()))
}

/// POST /files — upload or overwrite a file.
///
/// Uses UPSERT on `(user_id, path)` so re-uploading the same path updates the record.
#[instrument(skip(state, body), fields(user_id = %auth.user_id, path = %body.path, size = body.content.len()))]
async fn create_file(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<CreateFileRequest>,
) -> Result<(StatusCode, Json<FileResponse>), AppError> {
    validate_path(&body.path)?;

    let content = prepare_content(&body.content)?;
    let key = storage_key(auth.user_id, &body.path);

    storage::upload_object(
        &state.s3,
        &state.config.supabase_storage_bucket,
        &key,
        content.bytes,
    )
    .await?;

    let file = sqlx::query_as!(
        FileMeta,
        "INSERT INTO files (user_id, name, path, storage_key, size_bytes, content_hash, content_text, search_content)
         VALUES ($1, $2, $3, $4, $5, $6, $7, to_tsvector('english', $7))
         ON CONFLICT (user_id, path) DO UPDATE
             SET name = EXCLUDED.name,
                 storage_key = EXCLUDED.storage_key,
                 size_bytes = EXCLUDED.size_bytes,
                 content_hash = EXCLUDED.content_hash,
                 content_text = EXCLUDED.content_text,
                 search_content = EXCLUDED.search_content,
                 updated_at = now()
         RETURNING id, user_id, name, path, storage_key, size_bytes, content_hash, share_token, created_at, updated_at",
        auth.user_id,
        &body.name,
        &body.path,
        &key,
        content.size_bytes,
        &content.hash,
        &body.content
    )
    .fetch_one(&state.db)
    .await?;

    info!(file_id = %file.id, "file created/updated");
    Ok((StatusCode::CREATED, Json(FileResponse::from(file))))
}

/// GET /files/:id — get metadata for a single file.
#[instrument(skip(state), fields(user_id = %auth.user_id, file_id = %id))]
async fn get_file(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<FileResponse>, AppError> {
    let file = fetch_file_by_id(&state.db, id).await?;
    assert_owner(&file, auth.user_id)?;
    Ok(Json(FileResponse::from(file)))
}

/// GET /files/:id/content — download the raw markdown content of a file.
#[instrument(skip(state), fields(user_id = %auth.user_id, file_id = %id))]
async fn download_content(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let file = fetch_file_by_id(&state.db, id).await?;
    assert_owner(&file, auth.user_id)?;

    let bytes = storage::download_object(
        &state.s3,
        &state.config.supabase_storage_bucket,
        &file.storage_key,
    )
    .await?;

    Ok((
        [(
            header::CONTENT_TYPE,
            HeaderValue::from_static("text/markdown; charset=utf-8"),
        )],
        bytes,
    ))
}

/// DELETE /files/:id — delete a file from S3 and the database.
#[instrument(skip(state), fields(user_id = %auth.user_id, file_id = %id))]
async fn delete_file(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<StatusCode, AppError> {
    let file = fetch_file_by_id(&state.db, id).await?;
    assert_owner(&file, auth.user_id)?;

    if let Err(e) = storage::delete_object(
        &state.s3,
        &state.config.supabase_storage_bucket,
        &file.storage_key,
    )
    .await
    {
        warn!(storage_key = %file.storage_key, error = %e, "S3 delete failed, proceeding with DB delete");
    }

    sqlx::query!("DELETE FROM files WHERE id = $1", id)
        .execute(&state.db)
        .await?;

    info!("file deleted");
    Ok(StatusCode::NO_CONTENT)
}

/// Returns `true` if the hostname looks like a private/internal address (SSRF guard).
fn is_private_host(host: &str) -> bool {
    let host = host.trim_start_matches('[').trim_end_matches(']');
    if matches!(host, "localhost" | "0.0.0.0" | "::1" | "[::]") {
        return true;
    }
    if let Ok(ip) = host.parse::<std::net::Ipv4Addr>() {
        return ip.is_loopback()
            || ip.is_private()
            || ip.is_link_local()
            || ip.octets()[0] == 169 && ip.octets()[1] == 254;
    }
    if let Ok(ip) = host.parse::<std::net::Ipv6Addr>() {
        return ip.is_loopback() || ip.is_unspecified();
    }
    false
}

/// Derive a `.md` filename from the URL path.
fn derive_filename(parsed: &url::Url) -> String {
    let segment = parsed
        .path_segments()
        .and_then(|mut s| s.rfind(|seg: &&str| !seg.is_empty()))
        .unwrap_or("imported");

    let name = segment.to_string();
    let ext = std::path::Path::new(&name)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    if ext.eq_ignore_ascii_case("md") || ext.eq_ignore_ascii_case("markdown") {
        name
    } else if name.is_empty() {
        "imported.md".to_string()
    } else {
        format!("{name}.md")
    }
}

/// POST /files/import-url — fetch markdown content from a remote URL and return it.
///
/// Acts as a proxy to avoid CORS issues on the frontend. Validates the URL,
/// guards against SSRF, and caps the response at 5 MB.
#[instrument(skip(state), fields(user_id = %auth.user_id, url = %body.url))]
async fn import_url(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<ImportUrlRequest>,
) -> Result<Json<ImportUrlResponse>, AppError> {
    let parsed = url::Url::parse(&body.url).map_err(|_| AppError::bad_request("Invalid URL"))?;

    match parsed.scheme() {
        "http" | "https" => {}
        _ => return Err(AppError::bad_request("URL must use http or https")),
    }

    if let Some(host) = parsed.host_str() {
        if is_private_host(host) {
            return Err(AppError::bad_request(
                "Cannot fetch from private/internal addresses",
            ));
        }
    } else {
        return Err(AppError::bad_request("URL has no host"));
    }

    let response = state
        .http
        .get(parsed.as_str())
        .timeout(Duration::from_secs(15))
        .send()
        .await
        .internal("Failed to fetch URL")?;

    if !response.status().is_success() {
        return Err(AppError::bad_request(format!(
            "Remote server returned {}",
            response.status()
        )));
    }

    if let Some(len) = response.content_length()
        && len > IMPORT_URL_MAX_SIZE as u64
    {
        return Err(AppError::bad_request("File too large (max 5 MB)"));
    }

    let bytes = response
        .bytes()
        .await
        .internal("Failed to read response body")?;

    if bytes.len() > IMPORT_URL_MAX_SIZE {
        return Err(AppError::bad_request("File too large (max 5 MB)"));
    }

    let content = String::from_utf8(bytes.to_vec())
        .map_err(|_| AppError::bad_request("Response is not valid UTF-8 text"))?;

    let filename = derive_filename(&parsed);
    let size = content.len();

    info!(%filename, %size, "imported markdown from URL");
    Ok(Json(ImportUrlResponse {
        content,
        filename,
        size,
    }))
}

/// Query parameters for GET /files/search.
#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

/// A single search result entry.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SearchResultEntry {
    pub file_id: Uuid,
    pub file_name: String,
    pub file_path: String,
    pub headline: String,
    pub rank: f32,
}

/// Response body for GET /files/search.
#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResultEntry>,
}

/// GET /files/search?q=<query> — full-text search across all user's files.
#[instrument(skip(state), fields(user_id = %auth.user_id, query = %params.q))]
async fn search_files(
    auth: AuthUser,
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<SearchQuery>,
) -> Result<Json<SearchResponse>, AppError> {
    let q = params.q.trim();
    if q.len() < 2 {
        return Err(AppError::bad_request("query must be at least 2 characters"));
    }

    let results = sqlx::query_as!(
        SearchResultEntry,
        r#"SELECT
            id AS file_id,
            name AS file_name,
            path AS file_path,
            ts_headline('english', content_text, plainto_tsquery('english', $2),
                'MaxWords=35, MinWords=15, StartSel=<mark>, StopSel=</mark>'
            ) AS "headline!",
            ts_rank(search_content, plainto_tsquery('english', $2)) AS "rank!"
        FROM files
        WHERE user_id = $1
          AND search_content @@ plainto_tsquery('english', $2)
        ORDER BY ts_rank(search_content, plainto_tsquery('english', $2)) DESC
        LIMIT 50"#,
        auth.user_id,
        q
    )
    .fetch_all(&state.db)
    .await?;

    info!(count = results.len(), "search completed");
    Ok(Json(SearchResponse { results }))
}
