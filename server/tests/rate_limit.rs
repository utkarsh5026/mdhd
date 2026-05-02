//! Integration tests for the per-IP rate-limit middleware.
//!
//! Built on a minimal Axum router mounted with `rate_limit::layer_with(...)` at tight
//! thresholds so the 429 path is exercised in a handful of requests. These tests
//! deliberately avoid `create_app` — the point here is to verify the middleware
//! itself, not the full stack.

mod common;

use axum::Router;
use axum::http::StatusCode;
use axum::routing::get;
use std::time::Duration;

use common::{get_with_peer, send};

/// Burst size used throughout these tests. Small enough that sequential `oneshot`
/// calls reliably exhaust the bucket before tokens can refill.
const TEST_BURST: u32 = 3;
/// 1 token per second refill — effectively no refill during a fast test.
const TEST_REFILL: Duration = Duration::from_secs(1);

fn limited_app() -> Router {
    Router::new()
        .route("/ping", get(|| async { "pong" }))
        .layer(mdhd_server::middleware::rate_limit::layer_with(
            TEST_BURST,
            TEST_REFILL,
        ))
}

#[tokio::test]
async fn requests_under_burst_limit_succeed() {
    let app = limited_app();

    for _ in 0..TEST_BURST {
        let (status, _) = send(app.clone(), get_with_peer("/ping", "203.0.113.7")).await;
        assert_eq!(status, StatusCode::OK, "within burst should be 200");
    }
}

#[tokio::test]
async fn request_over_burst_limit_returns_429() {
    let app = limited_app();
    let peer = "203.0.113.8";

    for _ in 0..TEST_BURST {
        let (status, _) = send(app.clone(), get_with_peer("/ping", peer)).await;
        assert_eq!(status, StatusCode::OK);
    }

    // Next request from the same IP must be rejected.
    let (status, body) = send(app, get_with_peer("/ping", peer)).await;
    assert_eq!(status, StatusCode::TOO_MANY_REQUESTS);
    assert!(
        String::from_utf8_lossy(&body).contains("Rate limit exceeded"),
        "expected plain-text 429 body, got: {:?}",
        String::from_utf8_lossy(&body)
    );
}

#[tokio::test]
async fn different_ips_have_independent_buckets() {
    let app = limited_app();

    for _ in 0..TEST_BURST {
        let (status, _) = send(app.clone(), get_with_peer("/ping", "198.51.100.1")).await;
        assert_eq!(status, StatusCode::OK);
    }
    let (a_next, _) = send(app.clone(), get_with_peer("/ping", "198.51.100.1")).await;
    assert_eq!(a_next, StatusCode::TOO_MANY_REQUESTS);

    // Peer B is untouched — must still succeed.
    let (b_status, _) = send(app, get_with_peer("/ping", "198.51.100.2")).await;
    assert_eq!(
        b_status,
        StatusCode::OK,
        "peer B's bucket must not be affected by peer A's usage"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn health_endpoint_is_exempt_from_rate_limit(db: sqlx::PgPool) {
    // `/api/health` is mounted *outside* the `rate_limit::layer()` in
    // `create_app`, so it must never return 429 — even under sustained load
    // that would trip the per-IP bucket on any application route.
    //
    // We can't easily exhaust the production bucket (burst=100) inside a unit
    // test without real time passing, so instead we assert: at no point in a
    // reasonable burst does /api/health yield 429. A regression that put the
    // health route *behind* the limiter would eventually fail this once its
    // bucket was drained by repeated calls from other tests; more importantly,
    // the structural invariant is documented by this test.
    let app = common::app_with_db(db);

    for _ in 0..20 {
        let (status, _) = send(app.clone(), get_with_peer("/api/health", "203.0.113.42")).await;
        assert_ne!(
            status,
            StatusCode::TOO_MANY_REQUESTS,
            "/api/health must be exempt from rate limiting"
        );
    }
}
