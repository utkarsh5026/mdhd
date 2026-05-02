//! Integration tests for the CORS layer configured in `create_app`.
//!
//! Goal: pin the contract that only `config.cors_origin` (mounted as
//! `http://localhost:5173` in [`common::test_config`]) receives
//! `Access-Control-Allow-*` headers. A preflight from a different origin must
//! still respond (browsers don't speak to the server otherwise) but must not
//! carry an ACAO header matching the attacker origin.

mod common;

use axum::body::Body;
use axum::http::{Method, Request, header};
use sqlx::PgPool;
use tower::ServiceExt;

use common::app_with_db;

const ALLOWED_ORIGIN: &str = "http://localhost:5173";
const FORBIDDEN_ORIGIN: &str = "https://evil.example.com";

fn preflight(uri: &str, origin: &str, method: &Method) -> Request<Body> {
    Request::builder()
        .method(Method::OPTIONS)
        .uri(uri)
        .header(header::ORIGIN, origin)
        .header(header::ACCESS_CONTROL_REQUEST_METHOD, method.as_str())
        .header(
            header::ACCESS_CONTROL_REQUEST_HEADERS,
            "authorization,content-type",
        )
        .body(Body::empty())
        .unwrap()
}

#[sqlx::test(migrations = "./migrations")]
async fn preflight_from_allowed_origin_carries_acao(db: PgPool) {
    let app = app_with_db(db);

    let resp = app
        .oneshot(preflight("/api/files", ALLOWED_ORIGIN, &Method::GET))
        .await
        .expect("oneshot");

    // tower-http short-circuits valid preflight with 200 OK.
    assert!(
        resp.status().is_success(),
        "preflight must succeed, got: {}",
        resp.status()
    );

    let acao = resp
        .headers()
        .get(header::ACCESS_CONTROL_ALLOW_ORIGIN)
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);

    assert_eq!(
        acao.as_deref(),
        Some(ALLOWED_ORIGIN),
        "allowed origin must be echoed back in Access-Control-Allow-Origin"
    );

    // Methods header must include what we asked for.
    let methods = resp
        .headers()
        .get(header::ACCESS_CONTROL_ALLOW_METHODS)
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned)
        .unwrap_or_default();
    assert!(
        methods.contains("GET"),
        "Access-Control-Allow-Methods should list GET, got: {methods:?}"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn preflight_from_disallowed_origin_omits_acao(db: PgPool) {
    let app = app_with_db(db);

    let resp = app
        .oneshot(preflight("/api/files", FORBIDDEN_ORIGIN, &Method::POST))
        .await
        .expect("oneshot");

    // The server may answer 200 or 403 — what matters is that the attacker's
    // origin is NOT reflected in an Access-Control-Allow-Origin header.
    let acao = resp
        .headers()
        .get(header::ACCESS_CONTROL_ALLOW_ORIGIN)
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);

    assert_ne!(
        acao.as_deref(),
        Some(FORBIDDEN_ORIGIN),
        "disallowed origin must NOT be reflected in Access-Control-Allow-Origin"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn simple_request_from_disallowed_origin_lacks_acao(db: PgPool) {
    // Even for a non-preflight "simple" request, the server must not emit an
    // ACAO header matching an untrusted origin — otherwise the browser would
    // let the caller read the response.
    let app = app_with_db(db);

    let req = Request::builder()
        .method(Method::GET)
        .uri("/api/health")
        .header(header::ORIGIN, FORBIDDEN_ORIGIN)
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.expect("oneshot");

    let acao = resp
        .headers()
        .get(header::ACCESS_CONTROL_ALLOW_ORIGIN)
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);

    assert_ne!(
        acao.as_deref(),
        Some(FORBIDDEN_ORIGIN),
        "simple-request response must not carry ACAO for untrusted origin"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn preflight_allows_authorization_header(db: PgPool) {
    // Most /api endpoints need Authorization — the preflight must advertise it
    // via Access-Control-Allow-Headers or the browser will strip the header
    // on the real request.
    let app = app_with_db(db);

    let resp = app
        .oneshot(preflight("/api/files", ALLOWED_ORIGIN, &Method::GET))
        .await
        .expect("oneshot");

    let allow_headers = resp
        .headers()
        .get(header::ACCESS_CONTROL_ALLOW_HEADERS)
        .and_then(|v| v.to_str().ok())
        .map(str::to_ascii_lowercase)
        .unwrap_or_default();

    assert!(
        allow_headers.contains("authorization"),
        "preflight must advertise the Authorization header, got: {allow_headers:?}"
    );
}
