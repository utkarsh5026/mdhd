//! Bookmark routes — create, list, and delete named section saves for a file.
//!
//! All endpoints require a valid JWT (`AuthUser` extractor) and enforce that the
//! requesting user owns the target file before any bookmark operation is performed.
//! The three routes mounted by [`router`] are:
//!
//! | Method | Path | Handler |
//! |--------|------|---------|
//! | GET | `/files/:id/bookmarks` | [`list_bookmarks`] |
//! | POST | `/files/:id/bookmarks` | [`create_bookmark`] |
//! | DELETE | `/files/:id/bookmarks/:bookmark_id` | [`delete_bookmark`] |

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::routing::{delete, get};
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::errors::{AppError, OptionExt};
use crate::middleware::auth::AuthUser;
use crate::models::bookmark::Bookmark;
use crate::state::AppState;

/// Public bookmark data returned to the client.
///
/// This is a projection of [`Bookmark`] that intentionally omits `user_id` to avoid
/// leaking ownership information in API responses.
#[derive(Debug, Serialize)]
pub struct BookmarkResponse {
    pub id: Uuid,
    pub file_id: Uuid,
    /// Zero-based index of the bookmarked section within the file's parsed section list.
    pub section_index: i32,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

/// Converts a [`Bookmark`] into its public API representation, dropping `user_id`.
impl From<Bookmark> for BookmarkResponse {
    fn from(b: Bookmark) -> Self {
        BookmarkResponse {
            id: b.id,
            file_id: b.file_id,
            section_index: b.section_index,
            name: b.name,
            created_at: b.created_at,
        }
    }
}

/// Request body for creating or updating a bookmark.
#[derive(Debug, Deserialize)]
pub struct CreateBookmarkRequest {
    /// Zero-based index of the section to bookmark. Must be non-negative.
    pub section_index: i32,
    /// Display name for the bookmark. Must be non-empty after trimming and at most 200 characters.
    pub name: String,
}

/// Builds the bookmark sub-router and registers all bookmark endpoints.
///
/// Mount this router into the application router via `Router::merge` or `Router::nest`.
pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/files/{id}/bookmarks",
            get(list_bookmarks).post(create_bookmark),
        )
        .route(
            "/files/{id}/bookmarks/{bookmark_id}",
            delete(delete_bookmark),
        )
}

/// Verifies a file exists and is owned by `user_id`.
///
/// Returns `NotFound` for both "file doesn't exist" and "file belongs to a different user" so
/// that ownership cannot be probed by unauthenticated enumeration.
async fn verify_file_owner(
    db: &sqlx::PgPool,
    file_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let file_user_id = sqlx::query_scalar!("SELECT user_id FROM files WHERE id = $1", file_id)
        .fetch_optional(db)
        .await?
        .or_not_found()?;

    if file_user_id != user_id {
        return Err(AppError::NotFound);
    }
    Ok(())
}

/// `GET /files/:id/bookmarks` — returns all bookmarks for the authenticated user's file,
/// ordered by `section_index` ascending.
///
/// # Errors
/// - [`AppError::Unauthorized`] — missing or invalid JWT.
/// - [`AppError::NotFound`] — file does not exist or belongs to another user.
async fn list_bookmarks(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(file_id): Path<Uuid>,
) -> Result<Json<Vec<BookmarkResponse>>, AppError> {
    verify_file_owner(&state.db, file_id, auth.user_id).await?;

    let bookmarks = sqlx::query_as!(
        Bookmark,
        "SELECT * FROM bookmarks WHERE user_id = $1 AND file_id = $2 ORDER BY section_index ASC",
        auth.user_id,
        file_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        bookmarks.into_iter().map(BookmarkResponse::from).collect(),
    ))
}

/// `POST /files/:id/bookmarks` — creates or updates a bookmark at a given section.
///
/// Uses an `INSERT … ON CONFLICT … DO UPDATE` on `(user_id, file_id, section_index)`, so
/// `POST` twice for the same section updates the name in place rather than creating a duplicate.
/// The name is trimmed of leading/trailing whitespace before storage.
///
/// # Errors
/// - [`AppError::Unauthorized`] — missing or invalid JWT.
/// - [`AppError::BadRequest`] — `section_index` is negative, `name` is blank after trim, or
///   `name` exceeds 200 characters.
/// - [`AppError::NotFound`] — file does not exist or belongs to another user.
async fn create_bookmark(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(file_id): Path<Uuid>,
    Json(body): Json<CreateBookmarkRequest>,
) -> Result<(StatusCode, Json<BookmarkResponse>), AppError> {
    if body.section_index < 0 {
        return Err(AppError::bad_request("section_index must be non-negative"));
    }

    let name = body.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::bad_request("name must not be empty"));
    }

    if name.len() > 200 {
        return Err(AppError::bad_request("name must not exceed 200 characters"));
    }

    verify_file_owner(&state.db, file_id, auth.user_id).await?;

    let bookmark = sqlx::query_as!(
        Bookmark,
        r"
        INSERT INTO bookmarks (user_id, file_id, section_index, name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, file_id, section_index)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING *
        ",
        auth.user_id,
        file_id,
        body.section_index,
        name,
    )
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(BookmarkResponse::from(bookmark))))
}

/// `DELETE /files/:id/bookmarks/:bookmark_id` — deletes a bookmark by ID.
///
/// Both `file_id` and `user_id` are verified against the stored bookmark before deletion so
/// that a user cannot delete bookmarks on files they don't own.
///
/// # Errors
/// - [`AppError::Unauthorized`] — missing or invalid JWT.
/// - [`AppError::NotFound`] — bookmark does not exist, belongs to another user, or is on a
///   different file than the one in the URL path.
async fn delete_bookmark(
    auth: AuthUser,
    State(state): State<AppState>,
    Path((file_id, bookmark_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, AppError> {
    let bookmark = sqlx::query_as!(
        Bookmark,
        "SELECT * FROM bookmarks WHERE id = $1",
        bookmark_id
    )
    .fetch_optional(&state.db)
    .await?
    .or_not_found()?;

    if bookmark.user_id != auth.user_id || bookmark.file_id != file_id {
        return Err(AppError::NotFound);
    }

    sqlx::query!("DELETE FROM bookmarks WHERE id = $1", bookmark_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use serde_json::{Value, json};
    use sqlx::PgPool;
    use tower::ServiceExt;
    use uuid::Uuid;

    use crate::testutil::{create_test_user, delete_req, get_json, post_json, test_state};

    /// Insert a file owned by `user_id` and return its UUID.
    async fn seed_file(db: &PgPool, user_id: Uuid) -> Uuid {
        sqlx::query_scalar!(
            "INSERT INTO files (user_id, name, path, storage_key) VALUES ($1, 'test.md', $2, $3) RETURNING id",
            user_id,
            format!("/test/{}", Uuid::new_v4()),
            format!("key/{}", Uuid::new_v4()),
        )
        .fetch_one(db)
        .await
        .unwrap()
    }

    /// POST a bookmark and return `(status, body)`.
    async fn create_bookmark(
        app: axum::Router,
        token: &str,
        file_id: Uuid,
        section_index: i32,
        name: &str,
    ) -> (StatusCode, Value) {
        post_json(
            app,
            &format!("/files/{file_id}/bookmarks"),
            token,
            json!({ "section_index": section_index, "name": name }),
        )
        .await
    }

    /// GET all bookmarks for `file_id`.
    async fn list_bookmarks(app: axum::Router, token: &str, file_id: Uuid) -> (StatusCode, Value) {
        get_json(app, &format!("/files/{file_id}/bookmarks"), token).await
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_without_token_returns_401(db: PgPool) {
        let (user_id, _token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/files/{file_id}/bookmarks"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn create_without_token_returns_401(db: PgPool) {
        let (user_id, _token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/files/{file_id}/bookmarks"))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({"section_index": 0, "name": "x"}).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn negative_section_index_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let (status, body) = create_bookmark(app, &token, file_id, -1, "bad").await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap().contains("non-negative"),
            "expected 'non-negative' in error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn empty_name_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let (status, body) = create_bookmark(app, &token, file_id, 0, "   ").await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap().contains("empty"),
            "expected 'empty' in error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn name_over_200_chars_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let long_name = "a".repeat(201);
        let (status, body) = create_bookmark(app, &token, file_id, 0, &long_name).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body["error"].as_str().unwrap().contains("200"),
            "expected '200' in error, got: {body}"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn file_not_found_returns_404(db: PgPool) {
        let (_user_id, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));
        let missing = Uuid::new_v4();

        let (status, _) = create_bookmark(app, &token, missing, 0, "intro").await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn create_bookmark_returns_201_with_correct_body(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let (status, body) = create_bookmark(app, &token, file_id, 3, "Chapter 1").await;

        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(body["section_index"], 3);
        assert_eq!(body["name"], "Chapter 1");
        assert_eq!(body["file_id"], file_id.to_string());
        assert!(body["id"].as_str().is_some(), "id should be present");
        assert!(
            body["created_at"].as_str().is_some(),
            "created_at should be present"
        );
        assert!(body.get("user_id").is_none(), "user_id must not be exposed");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn create_trims_whitespace_from_name(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let (status, body) = create_bookmark(app, &token, file_id, 0, "  intro  ").await;

        assert_eq!(status, StatusCode::CREATED);
        assert_eq!(body["name"], "intro");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn duplicate_section_upserts_name_keeps_same_id(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let (s1, b1) = create_bookmark(app.clone(), &token, file_id, 5, "First").await;
        let (s2, b2) = create_bookmark(app, &token, file_id, 5, "Updated").await;

        assert_eq!(s1, StatusCode::CREATED);
        assert_eq!(s2, StatusCode::CREATED);
        // Same row → same id
        assert_eq!(b1["id"], b2["id"], "upsert should keep the same row id");
        assert_eq!(b2["name"], "Updated");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_empty_file_returns_empty_array(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let (status, body) = list_bookmarks(app, &token, file_id).await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body.as_array().unwrap().len(), 0);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_returns_bookmarks_sorted_by_section_index(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        create_bookmark(app.clone(), &token, file_id, 10, "Ten").await;
        create_bookmark(app.clone(), &token, file_id, 2, "Two").await;
        create_bookmark(app.clone(), &token, file_id, 7, "Seven").await;

        let (status, body) = list_bookmarks(app, &token, file_id).await;

        assert_eq!(status, StatusCode::OK);
        let arr = body.as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0]["section_index"], 2);
        assert_eq!(arr[1]["section_index"], 7);
        assert_eq!(arr[2]["section_index"], 10);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn other_user_cannot_list_bookmarks(db: PgPool) {
        let (user_id, _token1) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let (_user2_id, token2) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let (status, _) = list_bookmarks(app, &token2, file_id).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn other_user_cannot_create_bookmark_on_foreign_file(db: PgPool) {
        let (user_id, _token1) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let (_user2_id, token2) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let (status, _) = create_bookmark(app, &token2, file_id, 0, "steal").await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn delete_bookmark_returns_204(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let (_, body) = create_bookmark(app.clone(), &token, file_id, 0, "to delete").await;
        let bookmark_id = body["id"].as_str().unwrap();

        let status = delete_req(
            app,
            &format!("/files/{file_id}/bookmarks/{bookmark_id}"),
            &token,
        )
        .await;
        assert_eq!(status, StatusCode::NO_CONTENT);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn deleted_bookmark_no_longer_appears_in_list(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let (_, body) = create_bookmark(app.clone(), &token, file_id, 1, "temp").await;
        let bookmark_id = body["id"].as_str().unwrap();

        delete_req(
            app.clone(),
            &format!("/files/{file_id}/bookmarks/{bookmark_id}"),
            &token,
        )
        .await;

        let (status, list_body) = list_bookmarks(app, &token, file_id).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(list_body.as_array().unwrap().len(), 0);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn delete_nonexistent_bookmark_returns_404(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let app = super::router().with_state(test_state(db));

        let missing = Uuid::new_v4();
        let status = delete_req(
            app,
            &format!("/files/{file_id}/bookmarks/{missing}"),
            &token,
        )
        .await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn other_user_cannot_delete_foreign_bookmark(db: PgPool) {
        let (user_id, token1) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id).await;
        let (_user2_id, token2) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let (_, body) = create_bookmark(app.clone(), &token1, file_id, 0, "mine").await;
        let bookmark_id = body["id"].as_str().unwrap();

        let status = delete_req(
            app,
            &format!("/files/{file_id}/bookmarks/{bookmark_id}"),
            &token2,
        )
        .await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[test]
    fn bookmark_response_from_bookmark_maps_all_fields() {
        let now = chrono::Utc::now();
        let b = Bookmark {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            file_id: Uuid::new_v4(),
            section_index: 42,
            name: "Test".to_string(),
            created_at: now,
        };
        let resp = BookmarkResponse::from(b.clone());
        assert_eq!(resp.id, b.id);
        assert_eq!(resp.file_id, b.file_id);
        assert_eq!(resp.section_index, 42);
        assert_eq!(resp.name, "Test");
        assert_eq!(resp.created_at, now);
    }
}
