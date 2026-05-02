//! Integration tests for sync-payload size guards.
//!
//! Two config knobs protect the sync endpoints from oversized manifests:
//!
//! - `sync_max_files`     — cap on `POST /api/sync` manifest length
//! - `sync_max_settings`  — cap on `POST /api/settings/sync` list length
//!
//! Each handler checks `body.*.len() > config.*_max_*` before touching the
//! database, so the rejection path is hermetic — no DB state required beyond a
//! valid user for the auth guard.

mod common;

use chrono::Utc;
use serde_json::{Value, json};
use sqlx::PgPool;

use common::{app_with_db, create_test_user, post_json};

/// Build a sync manifest of `n` distinct client files. Each entry has a unique
/// path so the handler cannot dedup before the length check.
fn file_entries(n: usize) -> Value {
    let now = Utc::now();
    let files: Vec<Value> = (0..n)
        .map(|i| {
            json!({
                "path": format!("note-{i}.md"),
                "content_hash": format!("h{i}"),
                "updated_at": now,
            })
        })
        .collect();
    json!({ "files": files, "last_sync_at": null })
}

/// Build a settings-sync payload of `n` distinct keys.
fn setting_entries(n: usize) -> Value {
    let now = Utc::now();
    let settings: Vec<Value> = (0..n)
        .map(|i| {
            json!({
                "key": format!("k{i}"),
                "hash": format!("h{i}"),
                "updated_at": now,
                "value": i,
            })
        })
        .collect();
    json!({ "settings": settings })
}

#[sqlx::test(migrations = "./migrations")]
async fn sync_over_file_limit_returns_400(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, body) = post_json(app, "/api/sync", &token, file_entries(1001)).await;

    assert_eq!(status, axum::http::StatusCode::BAD_REQUEST);
    assert!(
        body["error"]
            .as_str()
            .is_some_and(|s| s.to_lowercase().contains("too many")),
        "error message must flag the manifest size, got: {body}"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn sync_at_file_limit_is_accepted(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, _) = post_json(app, "/api/sync", &token, file_entries(1000)).await;

    assert_eq!(
        status,
        axum::http::StatusCode::OK,
        "manifest at exactly the limit must not be rejected"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn settings_sync_over_limit_returns_400(db: PgPool) {
    // test_config sets sync_max_settings = 200 → send 201 to trip the guard.
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, body) = post_json(app, "/api/settings/sync", &token, setting_entries(201)).await;

    assert_eq!(status, axum::http::StatusCode::BAD_REQUEST);
    assert!(
        body["error"]
            .as_str()
            .is_some_and(|s| s.to_lowercase().contains("too many")),
        "error message must flag the settings size, got: {body}"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn settings_sync_at_limit_is_accepted(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, _) = post_json(app, "/api/settings/sync", &token, setting_entries(200)).await;

    assert_eq!(
        status,
        axum::http::StatusCode::OK,
        "settings list at exactly the limit must not be rejected"
    );
}
