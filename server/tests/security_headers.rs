//! Integration tests verifying the security-header middleware stack applied
//! in [`mdhd_server::create_app`].
//!
//! Every response — successful or not — must carry:
//! - `X-Content-Type-Options: nosniff`
//! - `X-Frame-Options: DENY`
//! - `Referrer-Policy: strict-origin-when-cross-origin`
//! - `x-request-id` (UUID per request)

mod common;

use axum::http::StatusCode;
use axum::http::header;
use sqlx::PgPool;
use tower::ServiceExt;

use common::bare_get;

#[sqlx::test(migrations = "./migrations")]
async fn security_headers_present_on_health(db: PgPool) {
    let app = common::app_with_db(db);

    let resp = app.oneshot(bare_get("/api/health")).await.expect("oneshot");

    let headers = resp.headers();
    assert_eq!(
        headers
            .get(header::X_CONTENT_TYPE_OPTIONS)
            .and_then(|v| v.to_str().ok()),
        Some("nosniff"),
    );
    assert_eq!(
        headers
            .get(header::X_FRAME_OPTIONS)
            .and_then(|v| v.to_str().ok()),
        Some("DENY"),
    );
    assert_eq!(
        headers
            .get(header::REFERRER_POLICY)
            .and_then(|v| v.to_str().ok()),
        Some("strict-origin-when-cross-origin"),
    );
    assert!(
        headers.contains_key("x-request-id"),
        "x-request-id must be stamped on every response"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn security_headers_present_on_401(db: PgPool) {
    let app = common::app_with_db(db);

    let resp = app
        .oneshot(common::get_with_peer("/api/files", "203.0.113.101"))
        .await
        .expect("oneshot");

    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

    let headers = resp.headers();
    assert_eq!(
        headers
            .get(header::X_CONTENT_TYPE_OPTIONS)
            .and_then(|v| v.to_str().ok()),
        Some("nosniff"),
        "error responses must still carry nosniff"
    );
    assert_eq!(
        headers
            .get(header::X_FRAME_OPTIONS)
            .and_then(|v| v.to_str().ok()),
        Some("DENY"),
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn request_id_is_unique_per_request(db: PgPool) {
    let app = common::app_with_db(db);

    let r1 = app
        .clone()
        .oneshot(bare_get("/api/health"))
        .await
        .expect("oneshot");
    let r2 = app.oneshot(bare_get("/api/health")).await.expect("oneshot");

    let id1 = r1.headers().get("x-request-id").cloned();
    let id2 = r2.headers().get("x-request-id").cloned();

    assert!(
        id1.is_some() && id2.is_some(),
        "both responses must carry x-request-id"
    );
    assert_ne!(id1, id2, "x-request-id must be generated fresh per request");
}
