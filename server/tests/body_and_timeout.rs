//! Integration tests for two middleware layers that guard server resources:
//!
//! - **Body limit** (`axum::extract::DefaultBodyLimit::max(10 MiB)`) — rejects
//!   oversized payloads before they reach handler logic.
//! - **Request timeout** (`tower_http::timeout::TimeoutLayer`, 30 s in prod) —
//!   bounds how long a single request may occupy a worker thread.
//!
//! The body-limit test hits the real `/api/files` POST endpoint through the full
//! `create_app` stack. The timeout test stands up an isolated mini-router because
//! no production handler sleeps long enough to exercise the 30-second ceiling.

mod common;

use std::time::Duration;

use axum::Router;
use axum::body::Body;
use axum::http::{Method, Request, StatusCode, header};
use axum::routing::get;
use sqlx::PgPool;
use tokio::time::sleep;
use tower::ServiceExt;
use tower_http::timeout::TimeoutLayer;

use common::{DEFAULT_TEST_PEER, app_with_db, create_test_user};

/// Build the smallest valid JSON payload for `POST /api/files` with a content
/// field of the requested byte size. The payload is valid JSON (content is a
/// plain ASCII run), so any rejection must come from the body-limit layer and
/// not from deserialization.
fn oversized_create_file_body(content_bytes: usize) -> Vec<u8> {
    let content = "a".repeat(content_bytes);
    let body = serde_json::json!({
        "name": "big.md",
        "path": "/big.md",
        "content": content,
    });
    serde_json::to_vec(&body).expect("serialize body")
}

#[sqlx::test(migrations = "./migrations")]
async fn oversized_post_body_returns_413(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    // DefaultBodyLimit in create_app is 10 MiB. Send 11 MiB of content so the
    // total body comfortably exceeds the ceiling even accounting for JSON wrapping.
    let body = oversized_create_file_body(11 * 1024 * 1024);

    let req = Request::builder()
        .method(Method::POST)
        .uri("/api/files")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::AUTHORIZATION, format!("Bearer {token}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::from(body))
        .unwrap();

    let resp = app.oneshot(req).await.expect("oneshot");
    assert_eq!(
        resp.status(),
        StatusCode::PAYLOAD_TOO_LARGE,
        "oversized POST body must be rejected with 413"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn body_within_limit_is_accepted_by_layer(db: PgPool) {
    // A small valid body must NOT be rejected by the body-limit layer. The
    // handler itself may still fail (S3 upload goes to the dummy client and
    // errors), but the status must not be 413 — that's the specific guarantee
    // of the body-limit layer we are pinning here.
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let body = oversized_create_file_body(1024); // 1 KiB — well under the limit.

    let req = Request::builder()
        .method(Method::POST)
        .uri("/api/files")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::AUTHORIZATION, format!("Bearer {token}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::from(body))
        .unwrap();

    let resp = app.oneshot(req).await.expect("oneshot");
    assert_ne!(
        resp.status(),
        StatusCode::PAYLOAD_TOO_LARGE,
        "under-limit body must not trigger 413 (got {:?})",
        resp.status()
    );
}

// ── Timeout layer ──────────────────────────────────────────────────────────
//
// The production TimeoutLayer waits 30 s before aborting. That's too long to
// exercise directly in a unit test, so we build a miniature router with the
// same layer configured at 50 ms and a handler that deliberately sleeps past it.

fn slow_router(timeout: Duration, handler_sleep: Duration) -> Router {
    Router::new()
        .route(
            "/slow",
            get(move || async move {
                sleep(handler_sleep).await;
                "ok"
            }),
        )
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            timeout,
        ))
}

#[tokio::test]
async fn handler_exceeding_timeout_returns_408() {
    let app = slow_router(Duration::from_millis(50), Duration::from_millis(500));

    let req = Request::builder()
        .method(Method::GET)
        .uri("/slow")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.expect("oneshot");
    assert_eq!(
        resp.status(),
        StatusCode::REQUEST_TIMEOUT,
        "handler that exceeds the timeout must be aborted with 408"
    );
}

#[tokio::test]
async fn handler_within_timeout_succeeds() {
    let app = slow_router(Duration::from_millis(500), Duration::from_millis(10));

    let req = Request::builder()
        .method(Method::GET)
        .uri("/slow")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.expect("oneshot");
    assert_eq!(
        resp.status(),
        StatusCode::OK,
        "handler that finishes before the timeout must succeed"
    );
}
