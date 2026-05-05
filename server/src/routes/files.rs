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

/// Request body for PATCH /files/{id} — rename / move a file.
#[derive(Debug, Deserialize)]
pub struct RenameFileRequest {
    pub name: String,
    pub path: String,
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

// Import size and timeout are now configurable via Config.import_max_size
// and Config.import_timeout_secs respectively.

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/files/search", get(search_files))
        .route("/files/import-url", post(import_url))
        .route("/files", get(list_files).post(create_file))
        .route(
            "/files/{id}",
            get(get_file).delete(delete_file).patch(rename_file),
        )
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

/// PATCH /files/:id — rename (and/or move) a file.
///
/// Updates the file's `name` and `path` and copies the underlying S3 object to
/// the new derived storage key. The operation is idempotent: re-issuing the
/// same rename returns the current state without doing additional S3 work.
#[instrument(skip(state, body), fields(user_id = %auth.user_id, file_id = %id, new_path = %body.path))]
async fn rename_file(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
    Json(body): Json<RenameFileRequest>,
) -> Result<Json<FileResponse>, AppError> {
    let file = fetch_file_by_id(&state.db, id).await?;
    assert_owner(&file, auth.user_id)?;

    if body.name.trim().is_empty() {
        return Err(AppError::bad_request("name must not be empty"));
    }
    if body.name.contains('/') {
        return Err(AppError::bad_request("name must not contain '/'"));
    }
    validate_path(&body.path)?;

    if file.name == body.name && file.path == body.path {
        return Ok(Json(FileResponse::from(file)));
    }

    if file.path != body.path {
        let conflict = sqlx::query_scalar!(
            "SELECT id FROM files WHERE user_id = $1 AND path = $2 AND id <> $3 LIMIT 1",
            auth.user_id,
            &body.path,
            id
        )
        .fetch_optional(&state.db)
        .await?;
        if conflict.is_some() {
            return Err(AppError::bad_request("a file already exists at that path"));
        }
    }

    let new_storage_key = storage_key(auth.user_id, &body.path);
    let old_storage_key = file.storage_key.clone();
    let path_changed = old_storage_key != new_storage_key;

    if path_changed {
        let bytes = storage::download_object(
            &state.s3,
            &state.config.supabase_storage_bucket,
            &old_storage_key,
        )
        .await?;
        storage::upload_object(
            &state.s3,
            &state.config.supabase_storage_bucket,
            &new_storage_key,
            bytes,
        )
        .await?;
    }

    let updated = sqlx::query_as!(
        FileMeta,
        "UPDATE files
         SET name = $1, path = $2, storage_key = $3, updated_at = now()
         WHERE id = $4 AND user_id = $5
         RETURNING id, user_id, name, path, storage_key, size_bytes, content_hash, share_token, created_at, updated_at",
        &body.name,
        &body.path,
        &new_storage_key,
        id,
        auth.user_id
    )
    .fetch_one(&state.db)
    .await?;

    if path_changed
        && let Err(e) = storage::delete_object(
            &state.s3,
            &state.config.supabase_storage_bucket,
            &old_storage_key,
        )
        .await
    {
        warn!(storage_key = %old_storage_key, error = %e, "S3 delete of old key failed; orphaned object will be reaped later");
    }

    info!("file renamed");
    Ok(Json(FileResponse::from(updated)))
}

/// Checks if the given IPv4 address is in a private, local, or otherwise restricted range.
///
/// Covers standard RFC1918 (private) ranges, loopback, link-local, broadcast, and CGNAT blocks
/// (100.64.0.0/10).
///
/// # Arguments
/// * `ip` - The IPv4 address to check.
///
/// # Returns
/// `true` if the address is private, local, broadcast, or reserved; `false` otherwise.
fn is_private_ipv4(ip: std::net::Ipv4Addr) -> bool {
    ip.is_loopback()
        || ip.is_private()
        || ip.is_link_local()
        || ip.is_broadcast()
        || ip.is_unspecified()
        // Explicit check for 169.254.0.0/16 link-local block
        || ip.octets()[0] == 169 && ip.octets()[1] == 254
        // CGNAT block: 100.64.0.0/10 (RFC6598)
        || ip.octets()[0] == 100 && (ip.octets()[1] & 0xC0) == 64
}

/// Checks if the given IPv6 address is in a private, loopback, or reserved range.
///
/// Handles loopback, unspecified (::), unique local addresses (`fc00::/7`),
/// and detects IPv4-mapped addresses for embedded private ranges.
///
/// # Arguments
/// * `ip` - The IPv6 address to check.
///
/// # Returns
/// `true` if the address is private, local, or reserved; `false` otherwise.
fn is_private_ipv6(ip: std::net::Ipv6Addr) -> bool {
    if ip.is_loopback() || ip.is_unspecified() {
        return true;
    }
    if let Some(v4) = ip.to_ipv4_mapped() {
        return is_private_ipv4(v4);
    }
    let segments = ip.segments();
    (segments[0] & 0xfe00) == 0xfc00
}

/// Determines if a host string is a private, internal, or potentially unsafe address (SSRF guard).
///
/// Attempts to treat the given host as an IPv4/IPv6 address or common internal names,
/// returning `true` if it matches loopback, unspecified, or private address classes.
///
/// Strips brackets around IPv6 hosts for parsing. Does not perform DNS lookup; checks only string-literal hosts.
///
/// # Arguments
/// * `host` - The hostname or string IP representation.
///
/// # Returns
/// `true` if input is a private/internal/loopback/etc. address, `false` otherwise.
fn is_private_host(host: &str) -> bool {
    let host = host.trim_start_matches('[').trim_end_matches(']');
    if matches!(host, "localhost" | "0.0.0.0" | "::1" | "[::]") {
        return true;
    }
    if let Ok(ip) = host.parse::<std::net::Ipv4Addr>() {
        return is_private_ipv4(ip);
    }
    if let Ok(ip) = host.parse::<std::net::Ipv6Addr>() {
        return is_private_ipv6(ip);
    }
    false
}

/// Resolves a hostname and returns `Err` if any resolved IP is private.
///
/// This guards against DNS rebinding attacks where a public hostname resolves
/// to a private IP address.
async fn verify_resolved_ips(host: &str) -> Result<(), AppError> {
    use tokio::net::lookup_host;
    let addresses = lookup_host(format!("{host}:0"))
        .await
        .map_err(|_| AppError::bad_request("Cannot resolve hostname"))?;

    for addr in addresses {
        match addr.ip() {
            std::net::IpAddr::V4(ip) if is_private_ipv4(ip) => {
                return Err(AppError::bad_request(
                    "Cannot fetch from private/internal addresses",
                ));
            }
            std::net::IpAddr::V6(ip) if is_private_ipv6(ip) => {
                return Err(AppError::bad_request(
                    "Cannot fetch from private/internal addresses",
                ));
            }
            _ => {}
        }
    }

    Ok(())
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

    let host = parsed
        .host_str()
        .ok_or_else(|| AppError::bad_request("URL has no host"))?;

    if is_private_host(host) {
        return Err(AppError::bad_request(
            "Cannot fetch from private/internal addresses",
        ));
    }

    verify_resolved_ips(host).await?;

    let max_size = state.config.import_max_size;
    let timeout_secs = state.config.import_timeout_secs;

    let response = state
        .http
        .get(parsed.as_str())
        .timeout(Duration::from_secs(timeout_secs))
        .send()
        .await
        .internal("Failed to fetch URL")?;

    if !response.status().is_success() {
        return Err(AppError::bad_request("Remote server returned an error"));
    }

    if let Some(len) = response.content_length()
        && len > max_size as u64
    {
        return Err(AppError::bad_request("File too large"));
    }

    let bytes = response
        .bytes()
        .await
        .internal("Failed to read response body")?;

    if bytes.len() > max_size {
        return Err(AppError::bad_request("File too large"));
    }

    let content = String::from_utf8(bytes.into())
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
    // Postgres text columns reject NUL bytes — surface that as a 400 rather
    // than a generic 500 from the driver.
    if q.contains('\0') {
        return Err(AppError::bad_request("query must not contain NUL bytes"));
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

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use serde_json::{Value, json};
    use sqlx::PgPool;
    use tower::ServiceExt;

    use crate::testutil::{create_test_user, delete_req, get_json, post_json, test_state};

    async fn seed_file(db: &PgPool, user_id: Uuid, path: &str, content_text: &str) -> Uuid {
        sqlx::query_scalar!(
            r#"
            INSERT INTO files (user_id, name, path, storage_key, size_bytes, content_text, search_content)
            VALUES ($1, $2, $3, $4, $5, $6, to_tsvector('english', $6))
            RETURNING id
            "#,
            user_id,
            path.split('/').last().unwrap_or("test.md"),
            path,
            storage_key(user_id, path),
            i64::try_from(content_text.len()).unwrap_or(i64::MAX),
            content_text,
        )
        .fetch_one(db)
        .await
        .unwrap()
    }

    /// POST /files with a JSON body and return `(status, body)`.
    async fn create_file(
        app: axum::Router,
        token: &str,
        name: &str,
        path: &str,
        content: &str,
    ) -> (StatusCode, Value) {
        post_json(
            app,
            "/files",
            token,
            json!({ "name": name, "path": path, "content": content }),
        )
        .await
    }

    async fn patch_json(
        app: axum::Router,
        uri: &str,
        token: &str,
        body: Value,
    ) -> (StatusCode, Value) {
        let response = app
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(uri)
                    .header(header::CONTENT_TYPE, "application/json")
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::from(body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let status = response.status();
        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let json: Value = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
        (status, json)
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_without_token_returns_401(db: PgPool) {
        let app = super::router().with_state(test_state(db));
        let resp = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/files")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn create_without_token_returns_401(db: PgPool) {
        let app = super::router().with_state(test_state(db));
        let resp = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/files")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({"name":"a","path":"/a.md","content":""}).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_file_without_token_returns_401(db: PgPool) {
        let app = super::router().with_state(test_state(db));
        let resp = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/files/{}", Uuid::new_v4()))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn delete_without_token_returns_401(db: PgPool) {
        let app = super::router().with_state(test_state(db));
        let resp = app
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/files/{}", Uuid::new_v4()))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn rename_without_token_returns_401(db: PgPool) {
        let app = super::router().with_state(test_state(db));
        let resp = app
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/files/{}", Uuid::new_v4()))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({"name":"renamed.md","path":"/renamed.md"}).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_files_empty_returns_empty_array(db: PgPool) {
        let (_, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let (status, body) = get_json(app, "/files", &token).await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body.as_array().unwrap().len(), 0);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_files_returns_only_own_files(db: PgPool) {
        let (user1, token1) = create_test_user(&db).await;
        let (user2, _token2) = create_test_user(&db).await;

        seed_file(&db, user1, "/user1/a.md", "hello").await;
        seed_file(&db, user1, "/user1/b.md", "world").await;
        seed_file(&db, user2, "/user2/c.md", "other").await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = get_json(app, "/files", &token1).await;

        assert_eq!(status, StatusCode::OK);
        let arr = body.as_array().unwrap();
        assert_eq!(arr.len(), 2, "should only see own files");
        for entry in arr {
            assert!(
                entry["path"].as_str().unwrap().starts_with("/user1/"),
                "unexpected path: {entry}"
            );
        }
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_files_returns_correct_fields(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        seed_file(&db, user_id, "/notes/hello.md", "# Hello").await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = get_json(app, "/files", &token).await;

        assert_eq!(status, StatusCode::OK);
        let entry = &body.as_array().unwrap()[0];
        assert!(entry["id"].as_str().is_some());
        assert_eq!(entry["path"], "/notes/hello.md");
        assert!(
            entry.get("user_id").is_none(),
            "user_id must not be exposed"
        );
        assert!(
            entry.get("storage_key").is_none(),
            "storage_key must not be exposed"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_files_ordered_by_path(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        seed_file(&db, user_id, "/z/z.md", "z").await;
        seed_file(&db, user_id, "/a/a.md", "a").await;
        seed_file(&db, user_id, "/m/m.md", "m").await;

        let app = super::router().with_state(test_state(db));
        let (_, body) = get_json(app, "/files", &token).await;

        let paths: Vec<&str> = body
            .as_array()
            .unwrap()
            .iter()
            .map(|e| e["path"].as_str().unwrap())
            .collect();
        assert_eq!(paths, vec!["/a/a.md", "/m/m.md", "/z/z.md"]);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_file_returns_correct_metadata(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "/docs/readme.md", "# Readme").await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = get_json(app, &format!("/files/{file_id}"), &token).await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["id"], file_id.to_string());
        assert_eq!(body["path"], "/docs/readme.md");
        assert!(body.get("user_id").is_none(), "user_id must not be exposed");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_file_not_found_returns_404(db: PgPool) {
        let (_, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let (status, _) = get_json(app, &format!("/files/{}", Uuid::new_v4()), &token).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_file_owned_by_other_user_returns_404(db: PgPool) {
        let (owner, _owner_token) = create_test_user(&db).await;
        let (_, attacker_token) = create_test_user(&db).await;
        let file_id = seed_file(&db, owner, "/secret.md", "secret").await;

        let app = super::router().with_state(test_state(db));
        let (status, _) = get_json(app, &format!("/files/{file_id}"), &attacker_token).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn delete_file_returns_204(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "/to-delete.md", "bye").await;

        let app = super::router().with_state(test_state(db));
        let status = delete_req(app, &format!("/files/{file_id}"), &token).await;
        assert_eq!(status, StatusCode::NO_CONTENT);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn delete_file_removes_row_from_db(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "/gone.md", "content").await;

        let app = super::router().with_state(test_state(db.clone()));
        delete_req(app, &format!("/files/{file_id}"), &token).await;

        let count: i64 = sqlx::query_scalar!("SELECT COUNT(*) FROM files WHERE id = $1", file_id)
            .fetch_one(&db)
            .await
            .unwrap()
            .unwrap_or(0);
        assert_eq!(count, 0);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn delete_nonexistent_file_returns_404(db: PgPool) {
        let (_, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let status = delete_req(app, &format!("/files/{}", Uuid::new_v4()), &token).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn delete_foreign_file_returns_404(db: PgPool) {
        let (owner, _) = create_test_user(&db).await;
        let (_, attacker_token) = create_test_user(&db).await;
        let file_id = seed_file(&db, owner, "/owner-file.md", "content").await;

        let app = super::router().with_state(test_state(db));
        let status = delete_req(app, &format!("/files/{file_id}"), &attacker_token).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn rename_file_updates_name_when_path_unchanged(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "/docs/original.md", "content").await;

        let app = super::router().with_state(test_state(db.clone()));
        let (status, body) = patch_json(
            app,
            &format!("/files/{file_id}"),
            &token,
            json!({"name":"renamed.md","path":"/docs/original.md"}),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["id"], file_id.to_string());
        assert_eq!(body["name"], "renamed.md");
        assert_eq!(body["path"], "/docs/original.md");

        let row = sqlx::query!(
            "SELECT name, path, storage_key FROM files WHERE id = $1",
            file_id
        )
        .fetch_one(&db)
        .await
        .unwrap();
        assert_eq!(row.name, "renamed.md");
        assert_eq!(row.path, "/docs/original.md");
        assert!(!row.storage_key.is_empty());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn rename_file_same_name_and_path_is_idempotent(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "/docs/current.md", "content").await;

        let before = sqlx::query!("SELECT updated_at FROM files WHERE id = $1", file_id)
            .fetch_one(&db)
            .await
            .unwrap()
            .updated_at;

        let app = super::router().with_state(test_state(db.clone()));
        let (status, body) = patch_json(
            app,
            &format!("/files/{file_id}"),
            &token,
            json!({"name":"current.md","path":"/docs/current.md"}),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["name"], "current.md");
        assert_eq!(body["path"], "/docs/current.md");

        let after = sqlx::query!("SELECT updated_at FROM files WHERE id = $1", file_id)
            .fetch_one(&db)
            .await
            .unwrap()
            .updated_at;
        assert_eq!(after, before, "idempotent rename must not update the row");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn rename_file_empty_name_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "/docs/file.md", "content").await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = patch_json(
            app,
            &format!("/files/{file_id}"),
            &token,
            json!({"name":"   ","path":"/docs/file.md"}),
        )
        .await;

        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap_or("").contains("empty"),
            "expected empty-name error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn rename_file_name_with_slash_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "/docs/file.md", "content").await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = patch_json(
            app,
            &format!("/files/{file_id}"),
            &token,
            json!({"name":"bad/name.md","path":"/docs/file.md"}),
        )
        .await;

        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap_or("").contains('/'),
            "expected slash-name error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn rename_file_invalid_path_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "/docs/file.md", "content").await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = patch_json(
            app,
            &format!("/files/{file_id}"),
            &token,
            json!({"name":"file.md","path":"docs/file.md"}),
        )
        .await;

        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap_or("").contains('/'),
            "expected path error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn rename_file_existing_path_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "/docs/source.md", "content").await;
        seed_file(&db, user_id, "/docs/existing.md", "other").await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = patch_json(
            app,
            &format!("/files/{file_id}"),
            &token,
            json!({"name":"existing.md","path":"/docs/existing.md"}),
        )
        .await;

        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"]
                .as_str()
                .unwrap_or("")
                .contains("already exists"),
            "expected conflict error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn rename_foreign_file_returns_404(db: PgPool) {
        let (owner, _) = create_test_user(&db).await;
        let (_, attacker_token) = create_test_user(&db).await;
        let file_id = seed_file(&db, owner, "/secret.md", "secret").await;

        let app = super::router().with_state(test_state(db));
        let (status, _) = patch_json(
            app,
            &format!("/files/{file_id}"),
            &attacker_token,
            json!({"name":"secret-renamed.md","path":"/secret.md"}),
        )
        .await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn create_file_invalid_path_returns_400(db: PgPool) {
        let (_, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));
        let (status, body) = create_file(app, &token, "test.md", "no-slash.md", "content").await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap_or("").contains('/'),
            "expected error about '/', got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn search_without_token_returns_401(db: PgPool) {
        let app = super::router().with_state(test_state(db));
        let resp = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/files/search?q=hello")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn search_short_query_returns_400(db: PgPool) {
        let (_, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let (status, body) = get_json(app, "/files/search?q=a", &token).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap_or("").contains("2 char"),
            "expected '2 char' in error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn search_returns_matching_files(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        seed_file(
            &db,
            user_id,
            "/notes/rust.md",
            "Rust is a systems programming language",
        )
        .await;
        seed_file(
            &db,
            user_id,
            "/notes/python.md",
            "Python is a scripting language",
        )
        .await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = get_json(app, "/files/search?q=systems", &token).await;

        assert_eq!(status, StatusCode::OK);
        let results = body["results"].as_array().unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0]["file_path"], "/notes/rust.md");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn search_is_isolated_to_requesting_user(db: PgPool) {
        let (user1, token1) = create_test_user(&db).await;
        let (user2, _) = create_test_user(&db).await;

        seed_file(&db, user1, "/u1/doc.md", "unique token xyzzy").await;
        seed_file(&db, user2, "/u2/doc.md", "unique token xyzzy").await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = get_json(app, "/files/search?q=xyzzy", &token1).await;

        assert_eq!(status, StatusCode::OK);
        let results = body["results"].as_array().unwrap();
        assert_eq!(
            results.len(),
            1,
            "search must not surface other users' files"
        );
        assert!(
            results[0]["file_path"]
                .as_str()
                .unwrap()
                .starts_with("/u1/")
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn search_no_matches_returns_empty_results(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        seed_file(&db, user_id, "/notes/intro.md", "Hello world").await;

        let app = super::router().with_state(test_state(db));
        let (status, body) = get_json(app, "/files/search?q=zzznomatch", &token).await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["results"].as_array().unwrap().len(), 0);
    }

    #[test]
    fn localhost_is_private() {
        assert!(is_private_host("localhost"));
    }

    #[test]
    fn loopback_ipv4_is_private() {
        assert!(is_private_host("127.0.0.1"));
    }

    #[test]
    fn loopback_ipv6_is_private() {
        assert!(is_private_host("::1"));
    }

    #[test]
    fn private_rfc1918_is_private() {
        assert!(is_private_host("10.0.0.1"));
        assert!(is_private_host("192.168.1.1"));
        assert!(is_private_host("172.16.0.1"));
    }

    #[test]
    fn link_local_is_private() {
        assert!(is_private_host("169.254.0.1"));
    }

    #[test]
    fn zero_zero_is_private() {
        assert!(is_private_host("0.0.0.0"));
    }

    #[test]
    fn public_ip_is_not_private() {
        assert!(!is_private_host("8.8.8.8"));
        assert!(!is_private_host("93.184.216.34"));
    }

    #[test]
    fn public_hostname_is_not_private() {
        assert!(!is_private_host("example.com"));
        assert!(!is_private_host("github.com"));
    }

    #[test]
    fn derive_filename_keeps_md_extension() {
        let url = url::Url::parse("https://example.com/docs/readme.md").unwrap();
        assert_eq!(derive_filename(&url), "readme.md");
    }

    #[test]
    fn derive_filename_keeps_markdown_extension() {
        let url = url::Url::parse("https://example.com/docs/guide.markdown").unwrap();
        assert_eq!(derive_filename(&url), "guide.markdown");
    }

    #[test]
    fn derive_filename_adds_md_when_no_extension() {
        let url = url::Url::parse("https://example.com/some/page").unwrap();
        assert_eq!(derive_filename(&url), "page.md");
    }

    #[test]
    fn derive_filename_adds_md_when_unknown_extension() {
        let url = url::Url::parse("https://example.com/file.txt").unwrap();
        assert_eq!(derive_filename(&url), "file.txt.md");
    }

    #[test]
    fn derive_filename_root_path_falls_back_to_imported() {
        let url = url::Url::parse("https://example.com/").unwrap();
        assert_eq!(derive_filename(&url), "imported.md");
    }

    #[test]
    fn file_response_from_file_meta_maps_all_fields() {
        use crate::models::file::FileMeta;

        let now = chrono::Utc::now();
        let id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let share = Uuid::new_v4();

        let meta = FileMeta {
            id,
            user_id,
            name: "notes.md".to_string(),
            path: "/notes.md".to_string(),
            storage_key: "key/notes".to_string(),
            size_bytes: 42,
            content_hash: Some("abc123".to_string()),
            share_token: Some(share),
            created_at: now,
            updated_at: now,
        };

        let resp = FileResponse::from(meta);
        assert_eq!(resp.id, id);
        assert_eq!(resp.name, "notes.md");
        assert_eq!(resp.path, "/notes.md");
        assert_eq!(resp.size_bytes, 42);
        assert_eq!(resp.content_hash.as_deref(), Some("abc123"));
        assert_eq!(resp.share_token, Some(share));
        assert_eq!(resp.created_at, now);
        assert_eq!(resp.updated_at, now);
    }

    #[test]
    fn file_response_does_not_expose_user_id_or_storage_key() {
        // FileResponse type itself must not have those fields — compile-time check.
        let resp = FileResponse {
            id: Uuid::new_v4(),
            name: "x".into(),
            path: "/x".into(),
            size_bytes: 0,
            content_hash: None,
            share_token: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };
        // If the struct had user_id or storage_key, accessing `.id` here
        // would compile but the fields below would not exist — this test
        // simply documents the expected shape.
        let _ = resp.id;
    }
}
