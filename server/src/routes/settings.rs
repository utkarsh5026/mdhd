use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::setting::UserSetting;
use crate::services::sync::{ClientSettingEntry, ServerSettingEntry, reconcile_settings};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/settings/sync", post(sync_settings))
}

/// Request body for POST /settings/sync.
#[derive(Debug, Deserialize)]
pub struct SettingsSyncRequest {
    pub settings: Vec<ClientSettingEntry>,
}

/// Response body for POST /settings/sync.
#[derive(Debug, Serialize)]
pub struct SettingsSyncResponse {
    /// Settings where the server has a newer version — client should apply these.
    pub updated: Vec<ServerSettingEntry>,
    /// Keys where the client's version was accepted by the server.
    pub accepted: Vec<String>,
    /// Current server time — store as reference for next sync.
    pub server_time: DateTime<Utc>,
}

/// POST /settings/sync — bidirectional settings sync using last-write-wins.
///
/// The client sends all its settings (key + hash + timestamp + value).
/// The server compares hashes and timestamps, then:
/// - Accepts client values that are newer (upserts them).
/// - Returns server values that are newer for the client to apply.
/// - Returns server settings the client doesn't have yet (from other devices).
async fn sync_settings(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<SettingsSyncRequest>,
) -> Result<Json<SettingsSyncResponse>, AppError> {
    if body.settings.len() > state.config.sync_max_settings {
        return Err(AppError::bad_request("Too many settings in sync request"));
    }

    let server_time = Utc::now();

    let server_settings = sqlx::query_as!(
        UserSetting,
        "SELECT id, user_id, key, value, hash, updated_at FROM user_settings WHERE user_id = $1",
        auth.user_id
    )
    .fetch_all(&state.db)
    .await?;

    let decision = reconcile_settings(&server_settings, &body.settings);

    let mut accepted = Vec::new();
    for entry in &decision.to_upsert {
        upsert_setting(&state, auth.user_id, entry, server_time).await?;
        accepted.push(entry.key.clone());
    }

    let updated = decision.updated;

    Ok(Json(SettingsSyncResponse {
        updated,
        accepted,
        server_time,
    }))
}

/// Insert or update a setting row for the given user.
async fn upsert_setting(
    state: &AppState,
    user_id: uuid::Uuid,
    entry: &ClientSettingEntry,
    server_time: DateTime<Utc>,
) -> Result<(), AppError> {
    sqlx::query!(
        r"
        INSERT INTO user_settings (user_id, key, value, hash, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, key)
        DO UPDATE SET value = $3, hash = $4, updated_at = $5
        ",
        user_id,
        &entry.key,
        &entry.value,
        &entry.hash,
        server_time
    )
    .execute(&state.db)
    .await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use chrono::Duration;
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
        post_json(app, "/settings/sync", token, body).await
    }

    async fn seed_setting(
        db: &PgPool,
        user_id: Uuid,
        key: &str,
        hash: &str,
        updated_at: DateTime<Utc>,
    ) {
        sqlx::query!(
            "INSERT INTO user_settings (user_id, key, value, hash, updated_at) VALUES ($1, $2, '\"seeded\"', $3, $4)",
            user_id,
            key,
            hash,
            updated_at
        )
        .execute(db)
        .await
        .unwrap();
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn missing_token_returns_401(db: PgPool) {
        let (app, _, _) = setup(db).await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/settings/sync")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(json!({ "settings": [] }).to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn first_sync_accepts_all_client_settings(db: PgPool) {
        let (app, _, token) = setup(db).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "settings": [
                    { "key": "theme", "hash": "h1", "updated_at": Utc::now(), "value": "dark" },
                    { "key": "font_size", "hash": "h2", "updated_at": Utc::now(), "value": 16 },
                ]
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        let accepted = body["accepted"].as_array().unwrap();
        assert_eq!(accepted.len(), 2);
        assert!(body["updated"].as_array().unwrap().is_empty());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn client_newer_setting_is_accepted(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        seed_setting(
            &db,
            user_id,
            "theme",
            "old_hash",
            Utc::now() - Duration::hours(1),
        )
        .await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "settings": [{
                    "key": "theme", "hash": "new_hash",
                    "updated_at": Utc::now(), "value": "dark"
                }]
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        assert!(
            body["accepted"]
                .as_array()
                .unwrap()
                .contains(&json!("theme"))
        );
        assert!(body["updated"].as_array().unwrap().is_empty());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn server_newer_setting_is_returned(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        seed_setting(&db, user_id, "theme", "server_hash", Utc::now()).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "settings": [{
                    "key": "theme", "hash": "client_hash",
                    "updated_at": Utc::now() - Duration::hours(1), "value": "light"
                }]
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        assert!(body["accepted"].as_array().unwrap().is_empty());
        let updated = body["updated"].as_array().unwrap();
        assert_eq!(updated.len(), 1);
        assert_eq!(updated[0]["key"], "theme");
        assert_eq!(updated[0]["hash"], "server_hash");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn matching_hash_is_ignored(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        let t = Utc::now();
        seed_setting(&db, user_id, "theme", "same_hash", t).await;

        let (status, body) = post_sync(
            app,
            &token,
            json!({
                "settings": [{
                    "key": "theme", "hash": "same_hash",
                    "updated_at": t, "value": "dark"
                }]
            }),
        )
        .await;

        assert_eq!(status, StatusCode::OK);
        assert!(body["accepted"].as_array().unwrap().is_empty());
        assert!(body["updated"].as_array().unwrap().is_empty());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn server_only_setting_is_sent_to_client(db: PgPool) {
        let (app, user_id, token) = setup(db.clone()).await;
        seed_setting(&db, user_id, "font_size", "hash_fs", Utc::now()).await;

        // Client sends nothing — it doesn't know about font_size yet
        let (status, body) = post_sync(app, &token, json!({ "settings": [] })).await;

        assert_eq!(status, StatusCode::OK);
        assert!(body["accepted"].as_array().unwrap().is_empty());
        let updated = body["updated"].as_array().unwrap();
        assert_eq!(updated.len(), 1);
        assert_eq!(updated[0]["key"], "font_size");
    }
}
