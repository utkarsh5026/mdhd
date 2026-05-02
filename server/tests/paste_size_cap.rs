//! Integration test for the paste-share size cap.
//!
//! `POST /api/share/paste` rejects payloads whose `content` exceeds
//! `config.paste_max_size` (512 KiB in the test harness — see
//! `common::test_config`). The check runs before any DB insert, so the
//! rejection path is hermetic.
//!
//! The global body-limit layer (10 MiB) is covered separately in
//! `body_and_timeout.rs`; this file pins the *finer* handler-level cap that
//! exists to keep `paste_shares` rows bounded independently of the global limit.

mod common;

use axum::http::StatusCode;
use serde_json::json;
use sqlx::PgPool;

use common::{app_with_db, create_test_user, post_json};

/// Paste cap from `common::test_config`: 512 KiB.
const PASTE_MAX: usize = 512 * 1024;

#[sqlx::test(migrations = "./migrations")]
async fn paste_over_cap_returns_400(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let oversized = "a".repeat(PASTE_MAX + 1);
    let (status, body) = post_json(
        app,
        "/api/share/paste",
        &token,
        json!({ "title": "too big", "content": oversized }),
    )
    .await;

    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert!(
        body["error"]
            .as_str()
            .is_some_and(|s| s.to_lowercase().contains("too large")),
        "error must flag oversized paste, got: {body}"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn paste_at_cap_is_accepted(db: PgPool) {
    // Exactly at the cap must pass (`> max`, not `>= max`).
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let at_cap = "a".repeat(PASTE_MAX);
    let (status, _) = post_json(
        app,
        "/api/share/paste",
        &token,
        json!({ "title": "boundary", "content": at_cap }),
    )
    .await;

    assert_eq!(
        status,
        StatusCode::CREATED,
        "paste with content.len() == paste_max_size must be accepted"
    );
}
