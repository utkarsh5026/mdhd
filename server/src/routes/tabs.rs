//! Tab sync endpoints.
//!
//! Persists the user's open file-backed tabs so the working set follows them
//! across devices. Unsaved tabs are intentionally not synced — they have no
//! durable identity and only exist in the local Zustand store.
//!
//! The sync model is intentionally simple: the client owns the desired state
//! and `PUT /tabs` replaces the server set in one transaction. Last-writer
//! wins; there is no per-tab CRUD plumbing to keep in step.
//!
//! | Method | Path | Handler |
//! |--------|------|---------|
//! | GET | `/tabs` | [`list_tabs`] — current open tabs ordered by position |
//! | PUT | `/tabs` | [`replace_tabs`] — full replace of the user's tab set |

use std::collections::HashSet;

use axum::extract::State;
use axum::http::StatusCode;
use axum::routing::get;
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use tracing::instrument;
use uuid::Uuid;

use sqlx::{PgPool, Postgres, Transaction};

use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::tab::UserTab;
use crate::state::AppState;

/// Hard cap on tabs per user. Protects against runaway clients pushing huge sets.
const MAX_TABS_PER_USER: usize = 50;

/// Public tab row returned by `GET /tabs`, omitting `user_id` from [`UserTab`].
#[derive(Debug, serde::Serialize)]
pub struct TabResponse {
    pub file_id: Uuid,
    pub position: i32,
    pub is_active: bool,
    pub pinned: bool,
    pub updated_at: DateTime<Utc>,
}

/// Maps a persisted [`UserTab`] into the JSON shape exposed to clients.
impl From<UserTab> for TabResponse {
    fn from(t: UserTab) -> Self {
        TabResponse {
            file_id: t.file_id,
            position: t.position,
            is_active: t.is_active,
            pinned: t.pinned,
            updated_at: t.updated_at,
        }
    }
}

/// One tab in the `PUT /tabs` request body: a file reference plus display metadata.
///
/// `is_active` and `pinned` default to `false` when omitted in JSON.
#[derive(Debug, serde::Deserialize)]
pub struct TabEntry {
    pub file_id: Uuid,
    pub position: i32,

    #[serde(default)]
    pub is_active: bool,

    #[serde(default)]
    pub pinned: bool,
}

/// Request body for `PUT /tabs`: the full desired tab set for the user.
#[derive(Debug, Deserialize)]
pub struct ReplaceTabsRequest {
    pub tabs: Vec<TabEntry>,
}

/// Builds the tab sub-router with `GET` and `PUT` on `/tabs`.
///
/// Mount this router into the application router via `Router::merge` or `Router::nest`.
pub fn router() -> Router<AppState> {
    Router::new().route("/tabs", get(list_tabs).put(replace_tabs))
}

/// `GET /tabs` — all open tabs for the authenticated user, ordered by position.
///
/// # Errors
///
/// Propagates [`AppError`] from the database when the query fails.
#[instrument(skip(state), fields(user_id = %auth.user_id))]
async fn list_tabs(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<TabResponse>>, AppError> {
    let rows = sqlx::query_as!(
        UserTab,
        "SELECT user_id, file_id, position, is_active, pinned, updated_at
         FROM user_tabs WHERE user_id = $1 ORDER BY position ASC",
        auth.user_id,
    )
    .fetch_all(&state.db)
    .await?;
    Ok(Json(rows.into_iter().map(TabResponse::from).collect()))
}

/// `PUT /tabs` — replace the user's tab set in a single transaction.
///
/// Validates ownership of every referenced file, ensures at most one active tab,
/// then deletes rows not in the new set and upserts the rest. Empty body clears
/// all tabs.
///
/// # Returns
///
/// [`StatusCode::NO_CONTENT`] on success.
///
/// # Errors
///
/// - Bad request: tab count above the server's per-user cap (`MAX_TABS_PER_USER`), negative
///   `position`, duplicate
///   `file_id`, or more than one tab with `is_active`.
/// - [`AppError::NotFound`] when any `file_id` is missing or not owned by the caller
///   (same response for both cases).
/// - Other [`AppError`] variants from the database or transaction commit.
#[instrument(skip(state, body), fields(user_id = %auth.user_id, tabs = body.tabs.len()))]
async fn replace_tabs(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<ReplaceTabsRequest>,
) -> Result<StatusCode, AppError> {
    let file_ids = validated_file_ids_for_replace(&body.tabs)?;
    ensure_tab_files_owned_by_user(&state.db, auth.user_id, &file_ids).await?;

    let mut tx = state.db.begin().await?;
    let keep_ids: Vec<Uuid> = file_ids.into_iter().collect();
    persist_tab_replace_in_transaction(&mut tx, auth.user_id, &body.tabs, &keep_ids).await?;

    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

/// Checks count, positions, duplicate files, and the single-active-tab rule.
///
/// Returns every distinct `file_id` in `tabs` when the payload is consistent.
fn validated_file_ids_for_replace(tabs: &[TabEntry]) -> Result<HashSet<Uuid>, AppError> {
    if tabs.len() > MAX_TABS_PER_USER {
        return Err(AppError::bad_request(format!(
            "tab set exceeds {MAX_TABS_PER_USER} entries"
        )));
    }

    let mut seen = HashSet::with_capacity(tabs.len());
    let mut active_count = 0usize;

    for t in tabs {
        if t.position < 0 {
            return Err(AppError::bad_request("position must be non-negative"));
        }
        if !seen.insert(t.file_id) {
            return Err(AppError::bad_request("duplicate file_id in tab set"));
        }
        active_count += usize::from(t.is_active);
    }

    if active_count > 1 {
        return Err(AppError::bad_request("at most one tab may be active"));
    }

    Ok(seen)
}

/// Ensures every referenced file exists and belongs to `user_id` (404 otherwise).
async fn ensure_tab_files_owned_by_user(
    db: &PgPool,
    user_id: Uuid,
    file_ids: &HashSet<Uuid>,
) -> Result<(), AppError> {
    if file_ids.is_empty() {
        return Ok(());
    }

    let ids: Vec<Uuid> = file_ids.iter().copied().collect();
    let owned: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*)::BIGINT AS \"v!\" FROM files\n             WHERE user_id = $1 AND id = ANY($2)",
        user_id,
        &ids,
    )
    .fetch_one(db)
    .await?;

    let expected_owned =
        i64::try_from(file_ids.len()).expect("tab set length is bounded by MAX_TABS_PER_USER");

    if owned != expected_owned {
        return Err(AppError::NotFound);
    }

    Ok(())
}

/// Applies delete-then-upsert inside an open transaction (caller commits).
async fn persist_tab_replace_in_transaction(
    tx: &mut Transaction<'_, Postgres>,
    user_id: Uuid,
    tabs: &[TabEntry],
    keep_ids: &[Uuid],
) -> Result<(), AppError> {
    sqlx::query!(
        "DELETE FROM user_tabs WHERE user_id = $1 AND NOT (file_id = ANY($2))",
        user_id,
        keep_ids,
    )
    .execute(&mut **tx)
    .await?;

    if !keep_ids.is_empty() {
        sqlx::query!(
            "UPDATE user_tabs SET is_active = FALSE WHERE user_id = $1",
            user_id,
        )
        .execute(&mut **tx)
        .await?;
    }

    for t in tabs {
        sqlx::query!(
            r"
            INSERT INTO user_tabs (user_id, file_id, position, is_active, pinned, updated_at)
            VALUES ($1, $2, $3, $4, $5, now())
            ON CONFLICT (user_id, file_id) DO UPDATE SET
                position = EXCLUDED.position,
                is_active = EXCLUDED.is_active,
                pinned = EXCLUDED.pinned,
                updated_at = now()
            ",
            user_id,
            t.file_id,
            t.position,
            t.is_active,
            t.pinned,
        )
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use serde_json::{Value, json};
    use sqlx::PgPool;
    use tower::ServiceExt;
    use uuid::Uuid;

    use crate::testutil::{create_test_user, get_json, test_state};

    async fn seed_file(db: &PgPool, user_id: Uuid, name: &str) -> Uuid {
        sqlx::query_scalar!(
            "INSERT INTO files (user_id, name, path, storage_key)
             VALUES ($1, $2, $3, $4) RETURNING id",
            user_id,
            name,
            format!("/test/{}", Uuid::new_v4()),
            format!("key/{}", Uuid::new_v4()),
        )
        .fetch_one(db)
        .await
        .unwrap()
    }

    async fn put_json(app: axum::Router, token: &str, body: Value) -> (StatusCode, Value) {
        let response = app
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/tabs")
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
    async fn get_without_token_returns_401(db: PgPool) {
        let app = super::router().with_state(test_state(db));
        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/tabs")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_empty_returns_empty_array(db: PgPool) {
        let (_, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));
        let (status, body) = get_json(app, "/tabs", &token).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body.as_array().unwrap().len(), 0);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn put_then_get_round_trip_preserves_order(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "a.md").await;
        let f2 = seed_file(&db, user_id, "b.md").await;
        let f3 = seed_file(&db, user_id, "c.md").await;
        let app = super::router().with_state(test_state(db));

        let body = json!({
            "tabs": [
                {"file_id": f3, "position": 0, "is_active": true, "pinned": false},
                {"file_id": f1, "position": 1, "is_active": false, "pinned": true},
                {"file_id": f2, "position": 2, "is_active": false, "pinned": false},
            ]
        });
        let (s, _) = put_json(app.clone(), &token, body).await;
        assert_eq!(s, StatusCode::NO_CONTENT);

        let (status, body) = get_json(app, "/tabs", &token).await;
        assert_eq!(status, StatusCode::OK);
        let arr = body.as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0]["file_id"], f3.to_string());
        assert_eq!(arr[0]["is_active"], true);
        assert_eq!(arr[1]["file_id"], f1.to_string());
        assert_eq!(arr[1]["pinned"], true);
        assert_eq!(arr[2]["file_id"], f2.to_string());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn put_replaces_set_drops_missing(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "a.md").await;
        let f2 = seed_file(&db, user_id, "b.md").await;
        let app = super::router().with_state(test_state(db));

        put_json(
            app.clone(),
            &token,
            json!({
                "tabs": [
                    {"file_id": f1, "position": 0, "is_active": false, "pinned": false},
                    {"file_id": f2, "position": 1, "is_active": true, "pinned": false},
                ]
            }),
        )
        .await;

        // Replace with just f2.
        let (s, _) = put_json(
            app.clone(),
            &token,
            json!({
                "tabs": [
                    {"file_id": f2, "position": 0, "is_active": true, "pinned": false},
                ]
            }),
        )
        .await;
        assert_eq!(s, StatusCode::NO_CONTENT);

        let (_, body) = get_json(app, "/tabs", &token).await;
        let arr = body.as_array().unwrap();
        assert_eq!(arr.len(), 1);
        assert_eq!(arr[0]["file_id"], f2.to_string());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn put_empty_clears_all_tabs(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "a.md").await;
        let app = super::router().with_state(test_state(db));

        put_json(
            app.clone(),
            &token,
            json!({"tabs": [{"file_id": f1, "position": 0, "is_active": true, "pinned": false}]}),
        )
        .await;

        let (s, _) = put_json(app.clone(), &token, json!({"tabs": []})).await;
        assert_eq!(s, StatusCode::NO_CONTENT);

        let (_, body) = get_json(app, "/tabs", &token).await;
        assert_eq!(body.as_array().unwrap().len(), 0);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn put_swap_active_in_one_call(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "a.md").await;
        let f2 = seed_file(&db, user_id, "b.md").await;
        let app = super::router().with_state(test_state(db));

        put_json(
            app.clone(),
            &token,
            json!({
                "tabs": [
                    {"file_id": f1, "position": 0, "is_active": true, "pinned": false},
                    {"file_id": f2, "position": 1, "is_active": false, "pinned": false},
                ]
            }),
        )
        .await;

        let (s, _) = put_json(
            app.clone(),
            &token,
            json!({
                "tabs": [
                    {"file_id": f1, "position": 0, "is_active": false, "pinned": false},
                    {"file_id": f2, "position": 1, "is_active": true, "pinned": false},
                ]
            }),
        )
        .await;
        assert_eq!(s, StatusCode::NO_CONTENT);

        let (_, body) = get_json(app, "/tabs", &token).await;
        let arr = body.as_array().unwrap();
        assert_eq!(arr[0]["is_active"], false);
        assert_eq!(arr[1]["is_active"], true);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn put_two_active_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "a.md").await;
        let f2 = seed_file(&db, user_id, "b.md").await;
        let app = super::router().with_state(test_state(db));

        let (s, _) = put_json(
            app,
            &token,
            json!({
                "tabs": [
                    {"file_id": f1, "position": 0, "is_active": true, "pinned": false},
                    {"file_id": f2, "position": 1, "is_active": true, "pinned": false},
                ]
            }),
        )
        .await;
        assert_eq!(s, StatusCode::BAD_REQUEST);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn put_duplicate_file_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "a.md").await;
        let app = super::router().with_state(test_state(db));

        let (s, _) = put_json(
            app,
            &token,
            json!({
                "tabs": [
                    {"file_id": f1, "position": 0, "is_active": false, "pinned": false},
                    {"file_id": f1, "position": 1, "is_active": false, "pinned": false},
                ]
            }),
        )
        .await;
        assert_eq!(s, StatusCode::BAD_REQUEST);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn put_foreign_file_returns_404(db: PgPool) {
        let (user_id, _) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "a.md").await;
        let (_other, other_token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let (s, _) = put_json(
            app,
            &other_token,
            json!({"tabs": [{"file_id": f1, "position": 0, "is_active": false, "pinned": false}]}),
        )
        .await;
        assert_eq!(s, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_returns_user_rows_only(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "a.md").await;
        let (other, other_token) = create_test_user(&db).await;
        let f_other = seed_file(&db, other, "x.md").await;
        let app = super::router().with_state(test_state(db));

        put_json(
            app.clone(),
            &token,
            json!({"tabs": [{"file_id": f1, "position": 0, "is_active": true, "pinned": false}]}),
        )
        .await;
        put_json(
            app.clone(),
            &other_token,
            json!({"tabs": [{"file_id": f_other, "position": 0, "is_active": true, "pinned": false}]}),
        )
        .await;

        let (_, body) = get_json(app, "/tabs", &token).await;
        let arr = body.as_array().unwrap();
        assert_eq!(arr.len(), 1);
        assert_eq!(arr[0]["file_id"], f1.to_string());
    }
}
