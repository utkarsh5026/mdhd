use axum::extract::{Path, State};
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::errors::{AppError, OptionExt};
use crate::middleware::auth::AuthUser;
use crate::models::file::FileMeta;
use crate::state::AppState;
use crate::storage;

/// Public file metadata returned to the client (omits internal fields).
#[derive(Debug, Serialize)]
pub struct FileResponse {
    pub id: Uuid,
    pub name: String,
    pub path: String,
    pub size_bytes: i64,
    pub content_hash: Option<String>,
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

fn hex_encode(bytes: &[u8]) -> String {
    use std::fmt::Write as _;
    bytes
        .iter()
        .fold(String::with_capacity(bytes.len() * 2), |mut s, b| {
            write!(s, "{b:02x}").unwrap();
            s
        })
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/files", get(list_files).post(create_file))
        .route("/files/{id}", get(get_file).delete(delete_file))
        .route("/files/{id}/content", get(download_content))
}

/// GET /files — list all files belonging to the authenticated user.
async fn list_files(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<FileResponse>>, AppError> {
    let files = sqlx::query_as!(
        FileMeta,
        "SELECT * FROM files WHERE user_id = $1 ORDER BY path ASC",
        auth.user_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(files.into_iter().map(FileResponse::from).collect()))
}

/// POST /files — upload or overwrite a file.
///
/// Uses UPSERT on `(user_id, path)` so re-uploading the same path updates the record.
async fn create_file(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<CreateFileRequest>,
) -> Result<(StatusCode, Json<FileResponse>), AppError> {
    if !body.path.starts_with('/') {
        return Err(AppError::bad_request("path must start with '/'"));
    }

    let content_bytes = body.content.as_bytes().to_vec();
    let size_bytes =
        i64::try_from(content_bytes.len()).map_err(|_| AppError::bad_request("file too large"))?;

    let hash = hex_encode(&Sha256::digest(&content_bytes));
    let storage_key = format!("{}{}", auth.user_id, body.path);

    storage::upload_object(
        &state.s3,
        &state.config.supabase_storage_bucket,
        &storage_key,
        content_bytes,
    )
    .await?;

    let file = sqlx::query_as!(
        FileMeta,
        r"
        INSERT INTO files (user_id, name, path, storage_key, size_bytes, content_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, path) DO UPDATE
            SET name = EXCLUDED.name,
                storage_key = EXCLUDED.storage_key,
                size_bytes = EXCLUDED.size_bytes,
                content_hash = EXCLUDED.content_hash,
                updated_at = now()
        RETURNING *
        ",
        auth.user_id,
        body.name,
        body.path,
        storage_key,
        size_bytes,
        hash,
    )
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(FileResponse::from(file))))
}

/// GET /files/:id — get metadata for a single file.
async fn get_file(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<FileResponse>, AppError> {
    let file = sqlx::query_as!(FileMeta, "SELECT * FROM files WHERE id = $1", id)
        .fetch_optional(&state.db)
        .await?
        .or_not_found()?;

    if file.user_id != auth.user_id {
        return Err(AppError::NotFound);
    }

    Ok(Json(FileResponse::from(file)))
}

/// GET /files/:id/content — download the raw markdown content of a file.
async fn download_content(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let file = sqlx::query_as!(FileMeta, "SELECT * FROM files WHERE id = $1", id)
        .fetch_optional(&state.db)
        .await?
        .or_not_found()?;

    if file.user_id != auth.user_id {
        return Err(AppError::NotFound);
    }

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
async fn delete_file(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<StatusCode, AppError> {
    let file = sqlx::query_as!(FileMeta, "SELECT * FROM files WHERE id = $1", id)
        .fetch_optional(&state.db)
        .await?
        .or_not_found()?;

    if file.user_id != auth.user_id {
        return Err(AppError::NotFound);
    }

    let _ = storage::delete_object(
        &state.s3,
        &state.config.supabase_storage_bucket,
        &file.storage_key,
    )
    .await;

    sqlx::query!("DELETE FROM files WHERE id = $1", id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}
