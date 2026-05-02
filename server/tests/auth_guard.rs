//! Integration tests for the JWT-based authentication extractor applied to all
//! `/api/*` routes (bar `/api/health`). Exercises the negative paths: missing,
//! malformed, signed-with-wrong-secret, expired, and tampered tokens.
//!
//! The full router is mounted via [`mdhd_server::create_app`] so these tests
//! also implicitly confirm the extractor runs *before* route handlers and
//! returns a uniform 401.

mod common;

use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use common::{JWT_SECRET, app_with_db, get_with_peer};

fn with_auth(uri: &str, token: &str, peer: &str) -> Request<Body> {
    Request::builder()
        .method("GET")
        .uri(uri)
        .header(header::AUTHORIZATION, format!("Bearer {token}"))
        .header("X-Forwarded-For", peer)
        .body(Body::empty())
        .unwrap()
}

#[sqlx::test(migrations = "./migrations")]
async fn missing_auth_header_returns_401(db: PgPool) {
    let app = app_with_db(db);
    let resp = app
        .oneshot(get_with_peer("/api/files", "203.0.113.10"))
        .await
        .expect("oneshot");
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "./migrations")]
async fn malformed_bearer_token_returns_401(db: PgPool) {
    let app = app_with_db(db);
    let resp = app
        .oneshot(with_auth("/api/files", "not-a-jwt", "203.0.113.11"))
        .await
        .expect("oneshot");
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "./migrations")]
async fn token_signed_with_wrong_secret_returns_401(db: PgPool) {
    let app = app_with_db(db);

    let user_id = Uuid::new_v4();
    let bad = mdhd_server::auth::jwt::create_token(user_id, "not-the-server-secret", 7)
        .expect("mint token");

    let resp = app
        .oneshot(with_auth("/api/files", &bad, "203.0.113.12"))
        .await
        .expect("oneshot");
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "./migrations")]
async fn expired_token_returns_401(db: PgPool) {
    let app = app_with_db(db);

    let user_id = Uuid::new_v4();
    let expired = mdhd_server::auth::jwt::create_token(user_id, JWT_SECRET, -1).expect("mint");

    let resp = app
        .oneshot(with_auth("/api/files", &expired, "203.0.113.13"))
        .await
        .expect("oneshot");
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "./migrations")]
async fn tampered_signature_returns_401(db: PgPool) {
    // Mint a valid token against the same pool the app is using, then flip one
    // char in its signature segment so the HMAC check fails.
    let (_, valid) = common::create_test_user(&db).await;
    let mut tampered = valid.clone();
    let last = tampered.pop().unwrap_or('A');
    tampered.push(if last == 'A' { 'B' } else { 'A' });

    let app = app_with_db(db);
    let resp = app
        .oneshot(with_auth("/api/files", &tampered, "203.0.113.14"))
        .await
        .expect("oneshot");
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "./migrations")]
async fn valid_token_reaches_handler(db: PgPool) {
    // Sanity: a valid token against the same pool should NOT be rejected at the
    // auth layer. The handler itself returns 200 with an empty file list.
    let (_, token) = common::create_test_user(&db).await;
    let app = app_with_db(db);
    let resp = app
        .oneshot(with_auth("/api/files", &token, "203.0.113.15"))
        .await
        .expect("oneshot");
    assert_eq!(resp.status(), StatusCode::OK);
}
