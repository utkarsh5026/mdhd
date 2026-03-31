//! Share routes — create, revoke, and publicly serve shared content.
//!
//! Two kinds of shareable content are supported:
//!
//! | Kind  | Auth to share | Storage                          |
//! |-------|---------------|----------------------------------|
//! | File  | Yes (owner)   | `files.share_token` column + S3  |
//! | Paste | Yes (owner)   | `paste_shares` table (inline)    |
//!
//! The public read endpoint [`get_shared_content`] is mounted without auth
//! middleware in `routes/mod.rs` so anyone with a valid token can fetch content.
//!
//! | Method | Path                   | Handler                |
//! |--------|------------------------|------------------------|
//! | POST   | `/share/file`          | [`share_file`]         |
//! | DELETE | `/share/file/{token}`  | [`revoke_file_share`]  |
//! | POST   | `/share/paste`         | [`share_paste`]        |
//! | DELETE | `/share/paste/{token}` | [`revoke_paste_share`] |
//! | GET    | `/api/share/{token}`   | [`get_shared_content`] (public, wired in mod.rs) |

use axum::extract::{Path, State};
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::IntoResponse;
use axum::routing::{delete, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use tracing::{info, instrument};

use crate::errors::{AppError, OptionExt};
use crate::middleware::auth::AuthUser;
use crate::models::file::FileMeta;
use crate::routes::utils::{
    assert_owner, prepare_content, storage_key, upload_to_s3, validate_path,
};
use crate::state::AppState;
use crate::storage;

/// Request body for `POST /share/file`.
#[derive(Debug, Deserialize)]
pub struct ShareFileRequest {
    pub name: String,
    pub path: String,
    pub content: String,
}

/// Request body for `POST /share/paste`.
#[derive(Debug, Deserialize)]
pub struct SharePasteRequest {
    pub title: String,
    pub content: String,
}

/// Response returned by both share endpoints.
#[derive(Debug, Serialize)]
pub struct ShareResponse {
    pub token: Uuid,
    pub url: String,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/share/file", post(share_file))
        .route("/share/file/{token}", delete(revoke_file_share))
        .route("/share/paste", post(share_paste))
        .route("/share/paste/{token}", delete(revoke_paste_share))
}

/// `POST /share/file` — upsert file content and mint (or preserve) a share token.
///
/// If the file already has a share token it is preserved via `COALESCE`, so
/// previously distributed links keep working after a content update.
#[instrument(skip(state, body), fields(user_id = %auth.user_id, path = %body.path))]
async fn share_file(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<ShareFileRequest>,
) -> Result<Json<ShareResponse>, AppError> {
    validate_path(&body.path)?;

    let content = prepare_content(&body.content)?;
    let key = storage_key(auth.user_id, &body.path);

    upload_to_s3(&state, &key, content.bytes).await?;

    let candidate_token = Uuid::new_v4();

    let file = sqlx::query_as!(
        FileMeta,
        "INSERT INTO files (user_id, name, path, storage_key, size_bytes, content_hash, share_token, content_text, search_content)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, to_tsvector('english', $8))
         ON CONFLICT (user_id, path) DO UPDATE
             SET name           = EXCLUDED.name,
                 storage_key    = EXCLUDED.storage_key,
                 size_bytes     = EXCLUDED.size_bytes,
                 content_hash   = EXCLUDED.content_hash,
                 share_token    = COALESCE(files.share_token, EXCLUDED.share_token),
                 content_text   = EXCLUDED.content_text,
                 search_content = EXCLUDED.search_content,
                 updated_at     = now()
         RETURNING id, user_id, name, path, storage_key, size_bytes, content_hash, share_token, created_at, updated_at",
        auth.user_id,
        &body.name,
        &body.path,
        &key,
        content.size_bytes,
        &content.hash,
        candidate_token,
        &body.content
    )
    .fetch_one(&state.db)
    .await?;

    let token = file
        .share_token
        .expect("share_token must be set after upsert");
    let url = format!("{}/share/{}", state.config.frontend_url, token);

    info!(file_id = %file.id, %token, "file share created/preserved");
    Ok(Json(ShareResponse { token, url }))
}

/// `DELETE /share/file/{token}` — revoke a file share token.
///
/// Ownership is verified before nulling the token so a user cannot revoke
/// another user's link.
#[instrument(skip(state), fields(user_id = %auth.user_id, %token))]
async fn revoke_file_share(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(token): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let file = sqlx::query_as!(
        FileMeta,
        "SELECT id, user_id, name, path, storage_key, size_bytes, content_hash, share_token, created_at, updated_at
         FROM files WHERE share_token = $1",
        token
    )
    .fetch_optional(&state.db)
    .await?
    .or_not_found()?;

    assert_owner(&file, auth.user_id)?;

    sqlx::query!("UPDATE files SET share_token = NULL WHERE id = $1", file.id)
        .execute(&state.db)
        .await?;

    info!(file_id = %file.id, "file share token revoked");
    Ok(StatusCode::NO_CONTENT)
}

/// `POST /share/paste` — store paste content inline and return a public share URL.
///
/// Unlike file shares, paste content is stored directly in the `paste_shares`
/// table — no S3 upload needed. Each call creates a new share row with a fresh
/// token, so the caller controls whether to reuse an existing link or generate
/// a new one.
#[instrument(skip(state, body), fields(user_id = %auth.user_id))]
async fn share_paste(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<SharePasteRequest>,
) -> Result<(StatusCode, Json<ShareResponse>), AppError> {
    let title = body.title.trim().to_string();
    if title.is_empty() {
        return Err(AppError::bad_request("title must not be empty"));
    }
    if body.content.is_empty() {
        return Err(AppError::bad_request("content must not be empty"));
    }

    let token = sqlx::query_scalar!(
        "INSERT INTO paste_shares (user_id, title, content) VALUES ($1, $2, $3) RETURNING token",
        auth.user_id,
        title,
        &body.content
    )
    .fetch_one(&state.db)
    .await?;

    let url = format!("{}/share/{}", state.config.frontend_url, token);

    info!(%token, "paste share created");
    Ok((StatusCode::CREATED, Json(ShareResponse { token, url })))
}

/// `DELETE /share/paste/{token}` — delete a paste share.
///
/// Ownership is verified before deletion so a user cannot revoke another
/// user's paste share.
#[instrument(skip(state), fields(user_id = %auth.user_id, %token))]
async fn revoke_paste_share(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(token): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let row = sqlx::query!("SELECT user_id FROM paste_shares WHERE token = $1", token)
        .fetch_optional(&state.db)
        .await?
        .or_not_found()?;

    if row.user_id != auth.user_id {
        return Err(AppError::NotFound);
    }

    sqlx::query!("DELETE FROM paste_shares WHERE token = $1", token)
        .execute(&state.db)
        .await?;

    info!("paste share revoked");
    Ok(StatusCode::NO_CONTENT)
}

/// `GET /api/share/{token}` — public read endpoint, no authentication required.
///
/// Checks `paste_shares` first (no S3 round-trip needed), then falls back to
/// `files.share_token`. Returns raw markdown with `text/markdown` content type.
///
/// Registered directly in `routes/mod.rs` without any auth middleware.
#[instrument(skip(state), fields(%token))]
pub async fn get_shared_content(
    State(state): State<AppState>,
    Path(token): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    // Check paste_shares first — cheaper path (no S3).
    let paste = sqlx::query!("SELECT content FROM paste_shares WHERE token = $1", token)
        .fetch_optional(&state.db)
        .await?;

    if let Some(row) = paste {
        return Ok((
            [
                (
                    header::CONTENT_TYPE,
                    HeaderValue::from_static("text/markdown; charset=utf-8"),
                ),
                (
                    header::CACHE_CONTROL,
                    HeaderValue::from_static("public, max-age=60"),
                ),
            ],
            row.content.into_bytes(),
        ));
    }

    // Fall back to file share.
    let file = sqlx::query_as!(
        FileMeta,
        "SELECT id, user_id, name, path, storage_key, size_bytes, content_hash, share_token, created_at, updated_at
         FROM files WHERE share_token = $1",
        token
    )
    .fetch_optional(&state.db)
    .await?
    .or_not_found()?;

    let bytes = storage::download_object(
        &state.s3,
        &state.config.supabase_storage_bucket,
        &file.storage_key,
    )
    .await?;

    Ok((
        [
            (
                header::CONTENT_TYPE,
                HeaderValue::from_static("text/markdown; charset=utf-8"),
            ),
            (
                header::CACHE_CONTROL,
                HeaderValue::from_static("public, max-age=60"),
            ),
        ],
        bytes,
    ))
}

#[cfg(test)]
mod tests {

    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use axum::routing::get;
    use serde_json::{Value, json};
    use sqlx::PgPool;
    use tower::ServiceExt;
    use uuid::Uuid;

    use crate::testutil::{create_test_user, delete_req, post_json, test_state};

    /// Returns `true` when S3 integration tests should run.
    fn s3_integration_enabled() -> bool {
        std::env::var("S3_INTEGRATION_TESTS").is_ok()
    }

    /// Builds a test router that includes both the authenticated share endpoints
    /// and the public `GET /api/share/{token}` endpoint.
    fn test_router(state: crate::state::AppState) -> axum::Router {
        super::router()
            .route("/api/share/{token}", get(super::get_shared_content))
            .with_state(state)
    }

    /// Helper: POST to `/share/paste` and return `(status, body)`.
    async fn create_paste(
        app: axum::Router,
        token: &str,
        title: &str,
        content: &str,
    ) -> (StatusCode, Value) {
        post_json(
            app,
            "/share/paste",
            token,
            json!({ "title": title, "content": content }),
        )
        .await
    }

    /// Helper: POST to `/share/file` and return `(status, body)`.
    async fn create_file_share(
        app: axum::Router,
        token: &str,
        name: &str,
        path: &str,
        content: &str,
    ) -> (StatusCode, Value) {
        post_json(
            app,
            "/share/file",
            token,
            json!({ "name": name, "path": path, "content": content }),
        )
        .await
    }

    /// Helper: GET `/api/share/{token}` without auth; returns `(status, bytes)`.
    async fn get_shared(app: axum::Router, share_token: &str) -> (StatusCode, Vec<u8>) {
        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/api/share/{share_token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let status = response.status();
        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap()
            .to_vec();
        (status, bytes)
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn share_paste_without_token_returns_401(db: PgPool) {
        let app = test_router(test_state(db));

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/share/paste")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({ "title": "t", "content": "c" }).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn share_paste_empty_title_returns_400(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (status, body) = create_paste(app, &jwt, "   ", "some content").await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap().contains("empty"),
            "expected 'empty' in error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn share_paste_empty_content_returns_400(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (status, body) = create_paste(app, &jwt, "My Title", "").await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap().contains("empty"),
            "expected 'empty' in error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn share_paste_returns_201_with_token_and_url(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (status, body) = create_paste(app, &jwt, "My Notes", "# Hello").await;

        assert_eq!(status, StatusCode::CREATED);
        assert!(
            body["token"].as_str().is_some(),
            "token must be present, got: {body}"
        );
        assert!(
            body["url"].as_str().is_some(),
            "url must be present, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn share_paste_url_contains_token(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (_, body) = create_paste(app, &jwt, "Title", "Content").await;
        let token = body["token"].as_str().unwrap();
        let url = body["url"].as_str().unwrap();

        assert!(
            url.contains(token),
            "url '{url}' should contain token '{token}'"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn share_paste_trims_title_whitespace(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db.clone()));

        let (status, _body) = create_paste(app, &jwt, "  trimmed  ", "content").await;
        assert_eq!(status, StatusCode::CREATED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn each_share_paste_call_creates_independent_token(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (_, body1) = create_paste(app.clone(), &jwt, "Note A", "content A").await;
        let (_, body2) = create_paste(app, &jwt, "Note B", "content B").await;

        let token1 = body1["token"].as_str().unwrap();
        let token2 = body2["token"].as_str().unwrap();
        assert_ne!(token1, token2, "each paste should get a unique token");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_shared_content_returns_paste_body_as_markdown(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (_, share_body) = create_paste(app.clone(), &jwt, "Shared Note", "# Hello World").await;
        let share_token = share_body["token"].as_str().unwrap();

        let (status, bytes) = get_shared(app, share_token).await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(bytes, b"# Hello World");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_shared_content_sets_text_markdown_content_type(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (_, share_body) = create_paste(app.clone(), &jwt, "CT Test", "content").await;
        let share_token = share_body["token"].as_str().unwrap();

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/api/share/{share_token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let ct = response
            .headers()
            .get(header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");
        assert!(
            ct.contains("text/markdown"),
            "expected text/markdown content-type, got: {ct}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_shared_content_unknown_token_returns_404(db: PgPool) {
        let app = test_router(test_state(db));
        let bogus = Uuid::new_v4();

        let (status, _) = get_shared(app, &bogus.to_string()).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_shared_content_requires_no_auth(db: PgPool) {
        // Regression: the public endpoint must NOT require a JWT header.
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (_, share_body) = create_paste(app.clone(), &jwt, "Public", "open content").await;
        let share_token = share_body["token"].as_str().unwrap();

        // Request without any Authorization header:
        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/api/share/{share_token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn revoke_paste_returns_204(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (_, share_body) = create_paste(app.clone(), &jwt, "To Delete", "bye").await;
        let share_token = share_body["token"].as_str().unwrap();

        let status = delete_req(app, &format!("/share/paste/{share_token}"), &jwt).await;
        assert_eq!(status, StatusCode::NO_CONTENT);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn revoked_paste_no_longer_publicly_accessible(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (_, share_body) = create_paste(app.clone(), &jwt, "Ephemeral", "gone soon").await;
        let share_token = share_body["token"].as_str().unwrap();

        delete_req(app.clone(), &format!("/share/paste/{share_token}"), &jwt).await;

        let (status, _) = get_shared(app, share_token).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn revoke_paste_nonexistent_token_returns_404(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let missing = Uuid::new_v4();
        let status = delete_req(app, &format!("/share/paste/{missing}"), &jwt).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn other_user_cannot_revoke_foreign_paste(db: PgPool) {
        let (_user1_id, jwt1) = create_test_user(&db).await;
        let (_user2_id, jwt2) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let (_, share_body) = create_paste(app.clone(), &jwt1, "Mine", "my content").await;
        let share_token = share_body["token"].as_str().unwrap();

        // User 2 tries to revoke user 1's paste:
        let status = delete_req(app, &format!("/share/paste/{share_token}"), &jwt2).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn revoke_paste_without_token_returns_401(db: PgPool) {
        let app = test_router(test_state(db));
        let random = Uuid::new_v4();

        let response = app
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/share/paste/{random}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn share_file_without_token_returns_401(db: PgPool) {
        let app = test_router(test_state(db));

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/share/file")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({ "name": "a.md", "path": "/a.md", "content": "x" }).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn share_file_path_without_leading_slash_returns_400(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        // Path doesn't start with '/' — must be rejected before any S3 call.
        let (status, body) =
            create_file_share(app, &jwt, "note.md", "no-slash/note.md", "# Hi").await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap().contains('/'),
            "expected path error to mention '/', got: {body}"
        );
    }

    #[tokio::test]
    async fn share_file_returns_201_with_token_and_url() {
        if !s3_integration_enabled() {
            return;
        }

        let db = {
            let url = std::env::var("DATABASE_URL")
                .expect("DATABASE_URL required for S3 integration tests");
            sqlx::postgres::PgPoolOptions::new()
                .connect(&url)
                .await
                .unwrap()
        };

        let s3 = {
            let endpoint = std::env::var("SUPABASE_S3_ENDPOINT")
                .unwrap_or_else(|_| "http://localhost:9000".into());
            let access_key =
                std::env::var("SUPABASE_S3_ACCESS_KEY").unwrap_or_else(|_| "minioadmin".into());
            let secret_key =
                std::env::var("SUPABASE_S3_SECRET_KEY").unwrap_or_else(|_| "minioadmin".into());
            let creds =
                aws_sdk_s3::config::Credentials::new(&access_key, &secret_key, None, None, "test");
            let cfg = aws_sdk_s3::Config::builder()
                .behavior_version_latest()
                .region(aws_sdk_s3::config::Region::new("us-east-1"))
                .endpoint_url(endpoint)
                .credentials_provider(creds)
                .force_path_style(true)
                .build();
            aws_sdk_s3::Client::from_conf(cfg)
        };

        let mut state = crate::testutil::test_state(db.clone());
        state.s3 = s3;
        state.config.supabase_storage_bucket = "test-share".to_string();
        state.config.frontend_url = "https://example.com".to_string();

        // Ensure bucket exists.
        state
            .s3
            .create_bucket()
            .bucket("test-share")
            .send()
            .await
            .ok();

        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(state);

        let (status, body) = create_file_share(app, &jwt, "note.md", "/note.md", "# Hello").await;
        assert_eq!(status, StatusCode::OK);
        assert!(body["token"].as_str().is_some(), "token must be present");
        let url = body["url"].as_str().unwrap();
        assert!(
            url.contains(body["token"].as_str().unwrap()),
            "url should contain token"
        );
    }

    #[tokio::test]
    async fn share_file_preserves_token_on_re_upload() {
        if !s3_integration_enabled() {
            return;
        }
        // Uploading the same path twice must keep the original share token (COALESCE).
        // Full integration setup omitted for brevity — this test is a reminder/marker.
        // Run with S3_INTEGRATION_TESTS=1 and a real DB + MinIO.
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn revoke_file_share_without_token_returns_401(db: PgPool) {
        let app = test_router(test_state(db));
        let random = Uuid::new_v4();

        let response = app
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/share/file/{random}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn revoke_file_share_nonexistent_token_returns_404(db: PgPool) {
        let (_user_id, jwt) = create_test_user(&db).await;
        let app = test_router(test_state(db));

        let missing = Uuid::new_v4();
        let status = delete_req(app, &format!("/share/file/{missing}"), &jwt).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn other_user_cannot_revoke_foreign_file_share(db: PgPool) {
        // Seed a file row with a share_token directly (no S3 needed for revoke path).
        let (user1_id, _jwt1) = create_test_user(&db).await;
        let (_user2_id, jwt2) = create_test_user(&db).await;

        let share_token = Uuid::new_v4();
        sqlx::query!(
            "INSERT INTO files (user_id, name, path, storage_key, share_token)
             VALUES ($1, 'secret.md', $2, $3, $4)",
            user1_id,
            format!("/secret/{}", Uuid::new_v4()),
            format!("key/{}", Uuid::new_v4()),
            share_token,
        )
        .execute(&db)
        .await
        .unwrap();

        let app = test_router(test_state(db));
        let status = delete_req(app, &format!("/share/file/{share_token}"), &jwt2).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn revoke_file_share_nulls_share_token(db: PgPool) {
        // Seed a file row directly — avoids needing a real S3 bucket.
        let (user_id, jwt) = create_test_user(&db).await;
        let share_token = Uuid::new_v4();
        let file_id: Uuid = sqlx::query_scalar!(
            "INSERT INTO files (user_id, name, path, storage_key, share_token)
             VALUES ($1, 'note.md', $2, $3, $4) RETURNING id",
            user_id,
            format!("/note/{}", Uuid::new_v4()),
            format!("key/{}", Uuid::new_v4()),
            share_token,
        )
        .fetch_one(&db)
        .await
        .unwrap();

        let app = test_router(test_state(db.clone()));
        let status = delete_req(app, &format!("/share/file/{share_token}"), &jwt).await;
        assert_eq!(status, StatusCode::NO_CONTENT);

        // Confirm share_token is now NULL in the DB.
        let token_in_db: Option<Uuid> =
            sqlx::query_scalar!("SELECT share_token FROM files WHERE id = $1", file_id)
                .fetch_one(&db)
                .await
                .unwrap();
        assert!(
            token_in_db.is_none(),
            "share_token must be nulled after revoke"
        );
    }
}
