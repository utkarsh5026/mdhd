//! Integration tests for the SSRF guard on `POST /api/files/import-url`.
//!
//! `import_url` fetches arbitrary remote markdown on behalf of the caller. That
//! makes it a prime SSRF target: an attacker could try to reach the cloud
//! metadata endpoint (`169.254.169.254`), internal services (`127.0.0.1`,
//! RFC1918), or hosts whose DNS resolves into private space.
//!
//! These tests walk the full production middleware stack (`create_app`) and
//! assert the handler rejects malicious URLs **before** any outbound network
//! call. All test hostname are chosen so that the guard rejects them without
//! requiring real DNS resolution — keeps the suite hermetic.

mod common;

use axum::body::Body;
use axum::http::{Method, Request, StatusCode, header};
use serde_json::json;
use sqlx::PgPool;
use tower::ServiceExt;

use common::{DEFAULT_TEST_PEER, app_with_db, create_test_user};

async fn post_import_url(app: axum::Router, token: &str, url: &str) -> (StatusCode, Vec<u8>) {
    let body = json!({ "url": url }).to_string();
    let req = Request::builder()
        .method(Method::POST)
        .uri("/api/files/import-url")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::AUTHORIZATION, format!("Bearer {token}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::from(body))
        .unwrap();

    let resp = app.oneshot(req).await.expect("oneshot");
    let status = resp.status();
    let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .expect("body")
        .to_vec();
    (status, bytes)
}

#[sqlx::test(migrations = "./migrations")]
async fn import_url_rejects_localhost(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, _) = post_import_url(app, &token, "http://localhost/foo.md").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "./migrations")]
async fn import_url_rejects_loopback_ipv4(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, _) = post_import_url(app, &token, "http://127.0.0.1/foo.md").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "./migrations")]
async fn import_url_rejects_loopback_ipv6(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, _) = post_import_url(app, &token, "http://[::1]/foo.md").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "./migrations")]
async fn import_url_rejects_aws_metadata_endpoint(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, _) = post_import_url(
        app,
        &token,
        "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "./migrations")]
async fn import_url_rejects_rfc1918_ranges(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    for host in [
        "http://10.0.0.1/",
        "http://172.16.0.1/",
        "http://192.168.1.1/",
    ] {
        let (status, _) = post_import_url(app.clone(), &token, host).await;
        assert_eq!(
            status,
            StatusCode::BAD_REQUEST,
            "RFC1918 host {host} must be rejected"
        );
    }
}

#[sqlx::test(migrations = "./migrations")]
async fn import_url_rejects_cgnat_range(db: PgPool) {
    // 100.64.0.0/10 (RFC6598) — carrier-grade NAT, often routable internally
    // on misconfigured networks. The SSRF guard rejects it explicitly.
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, _) = post_import_url(app, &token, "http://100.64.0.1/").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "./migrations")]
async fn import_url_rejects_non_http_schemes(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    for bad in [
        "file:///etc/passwd",
        "gopher://example.com/",
        "ftp://example.com/",
        "javascript:alert(1)",
    ] {
        let (status, _) = post_import_url(app.clone(), &token, bad).await;
        assert_eq!(
            status,
            StatusCode::BAD_REQUEST,
            "non-http scheme {bad} must be rejected"
        );
    }
}

#[sqlx::test(migrations = "./migrations")]
async fn import_url_rejects_malformed_url(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let (status, _) = post_import_url(app, &token, "not a url at all").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "./migrations")]
async fn import_url_requires_auth(db: PgPool) {
    let app = app_with_db(db);

    let req = Request::builder()
        .method(Method::POST)
        .uri("/api/files/import-url")
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::from(
            json!({ "url": "https://example.com" }).to_string(),
        ))
        .unwrap();

    let resp = app.oneshot(req).await.expect("oneshot");
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}
