//! Integration tests for the public share-token endpoint
//! (`GET /api/share/{token}`) and the revocation contract.
//!
//! Exercises the full production stack via `create_app`, so routing, the
//! no-auth exemption for the public read path, and Axum's UUID path extractor
//! are all in scope.
//!
//! Share tokens in MDHD have no expiry — a token is either live or revoked
//! (nulled on files, row-deleted for pastes). These tests pin:
//!   - random / never-issued tokens → 404
//!   - malformed (non-UUID) path segment → 4xx (not a handler panic)
//!   - revoked paste → 404 on public GET
//!   - revoked file share → 404 on public GET (ownership required to revoke)

mod common;

use axum::body::Body;
use axum::http::{Method, Request, StatusCode, header};
use serde_json::json;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use common::{DEFAULT_TEST_PEER, app_with_db, create_test_user};

async fn get_share(app: axum::Router, token: &str) -> (StatusCode, Vec<u8>) {
    let req = Request::builder()
        .method(Method::GET)
        .uri(format!("/api/share/{token}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::empty())
        .unwrap();
    let resp = app.oneshot(req).await.expect("oneshot");
    let status = resp.status();
    let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .expect("body")
        .to_vec();
    (status, bytes)
}

async fn create_paste(app: axum::Router, jwt: &str, title: &str, content: &str) -> Uuid {
    let body = json!({ "title": title, "content": content }).to_string();
    let req = Request::builder()
        .method(Method::POST)
        .uri("/api/share/paste")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::AUTHORIZATION, format!("Bearer {jwt}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::from(body))
        .unwrap();

    let resp = app.oneshot(req).await.expect("oneshot");
    assert_eq!(
        resp.status(),
        StatusCode::CREATED,
        "paste creation must succeed"
    );
    let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .expect("body");
    let v: serde_json::Value = serde_json::from_slice(&bytes).expect("json");
    v["token"]
        .as_str()
        .and_then(|s| Uuid::parse_str(s).ok())
        .expect("token uuid in response")
}

async fn delete_paste(app: axum::Router, jwt: &str, token: Uuid) -> StatusCode {
    let req = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/api/share/paste/{token}"))
        .header(header::AUTHORIZATION, format!("Bearer {jwt}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::empty())
        .unwrap();
    app.oneshot(req).await.expect("oneshot").status()
}

#[sqlx::test(migrations = "./migrations")]
async fn random_share_token_returns_404(db: PgPool) {
    let app = app_with_db(db);
    let random = Uuid::new_v4();

    let (status, _) = get_share(app, &random.to_string()).await;
    assert_eq!(
        status,
        StatusCode::NOT_FOUND,
        "a never-issued token must not leak any information"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn malformed_share_token_is_rejected(db: PgPool) {
    // Axum's Path<Uuid> extractor rejects non-UUID segments with 400. The key
    // contract is: the server does not panic, does not 500, and does not reach
    // the handler with invalid data.
    let app = app_with_db(db);

    let (status, _) = get_share(app, "not-a-uuid").await;
    assert!(
        matches!(status, StatusCode::BAD_REQUEST | StatusCode::NOT_FOUND),
        "malformed token must yield 400/404, got: {status}"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn valid_paste_share_is_publicly_readable(db: PgPool) {
    let (_, jwt) = create_test_user(&db).await;
    let app = app_with_db(db);

    let token = create_paste(app.clone(), &jwt, "Public", "# hello").await;
    let (status, bytes) = get_share(app, &token.to_string()).await;

    assert_eq!(status, StatusCode::OK);
    let v: serde_json::Value = serde_json::from_slice(&bytes).expect("json");
    assert_eq!(v["content"].as_str(), Some("# hello"));
}

#[sqlx::test(migrations = "./migrations")]
async fn revoked_paste_is_no_longer_readable(db: PgPool) {
    let (_, jwt) = create_test_user(&db).await;
    let app = app_with_db(db);

    let token = create_paste(app.clone(), &jwt, "Ephemeral", "gone soon").await;

    let del_status = delete_paste(app.clone(), &jwt, token).await;
    assert_eq!(del_status, StatusCode::NO_CONTENT);

    let (status, _) = get_share(app, &token.to_string()).await;
    assert_eq!(
        status,
        StatusCode::NOT_FOUND,
        "revoked paste must 404 on the public read endpoint"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn revoked_file_share_is_no_longer_readable(db: PgPool) {
    // Seed a file row with a share_token directly (skipping S3) so we can
    // verify that revoke → public GET returns 404. The public GET only hits
    // S3 when the share is live, so the no-S3 path is exercised anyway.
    let (user_id, jwt) = create_test_user(&db).await;
    let share_token = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO files (user_id, name, path, storage_key, share_token)
         VALUES ($1, 'note.md', $2, $3, $4)",
    )
    .bind(user_id)
    .bind(format!("/note/{}", Uuid::new_v4()))
    .bind(format!("key/{}", Uuid::new_v4()))
    .bind(share_token)
    .execute(&db)
    .await
    .expect("seed file with share token");

    let app = app_with_db(db);

    // Revoke through the real authenticated endpoint.
    let revoke = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/api/share/file/{share_token}"))
        .header(header::AUTHORIZATION, format!("Bearer {jwt}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::empty())
        .unwrap();
    let revoke_status = app.clone().oneshot(revoke).await.expect("oneshot").status();
    assert_eq!(revoke_status, StatusCode::NO_CONTENT);

    // Public GET must now 404.
    let (status, _) = get_share(app, &share_token.to_string()).await;
    assert_eq!(
        status,
        StatusCode::NOT_FOUND,
        "revoked file share must 404 on public read"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn foreign_user_cannot_revoke_file_share(db: PgPool) {
    // Belt-and-suspenders against a cross-user revoke: user B must not be able
    // to kill user A's share link by guessing the token.
    let (alice, _) = create_test_user(&db).await;
    let (_, bob_jwt) = create_test_user(&db).await;

    let share_token = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO files (user_id, name, path, storage_key, share_token)
         VALUES ($1, 'a.md', $2, $3, $4)",
    )
    .bind(alice)
    .bind(format!("/a/{}", Uuid::new_v4()))
    .bind(format!("key/{}", Uuid::new_v4()))
    .bind(share_token)
    .execute(&db)
    .await
    .expect("seed file");

    let app = app_with_db(db);

    let req = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/api/share/file/{share_token}"))
        .header(header::AUTHORIZATION, format!("Bearer {bob_jwt}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::empty())
        .unwrap();

    let resp = app.clone().oneshot(req).await.expect("oneshot");
    assert_eq!(
        resp.status(),
        StatusCode::NOT_FOUND,
        "foreign revoke must return 404 (existence-hiding)"
    );

    // And the share must still be live afterwards — a failed revoke must not
    // partially mutate state. Verify via the public read endpoint, which only
    // resolves for live tokens.
    let (public_status, _) = get_share(app, &share_token.to_string()).await;
    // The public endpoint still tries S3 on a live file share; with the dummy
    // S3 client that surfaces as 500, not 200. Either 200 or 500 is acceptable
    // — both mean the token is still live (the row wasn't nulled). The only
    // outcome we must reject is 404.
    assert_ne!(
        public_status,
        StatusCode::NOT_FOUND,
        "share must remain live after an unauthorized revoke attempt"
    );
}
