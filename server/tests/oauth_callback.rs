//! Integration tests for `GET /auth/google/callback`.
//!
//! Covers two classes of failure that the per-route unit tests don't fully
//! exercise through the mounted app:
//!
//! 1. **CSRF state verification** — missing cookie, missing query param, and
//!    mismatched values must each return `400` *before* any outbound request.
//! 2. **Code-exchange failure** — when Google's token endpoint rejects the
//!    authorization code, the handler must surface a `500` without leaking
//!    provider details into the response body.
//!
//! The code-exchange test uses [`wiremock`] to stand in for Google's token
//! endpoint. The production URL is hardcoded in `auth::oauth`, but
//! `Config::google_token_url_override` (set `None` in prod) lets tests redirect
//! the `exchange_code` call to a local mock server.

mod common;

use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use sqlx::PgPool;
use tower::ServiceExt;
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

use common::{JWT_SECRET, test_config};
use mdhd_server::state::AppState;

/// Builds a router against `create_app` with Google creds populated and
/// `google_token_url_override` pointed at `token_url`. Lets each test drive the
/// exchange step against its own wiremock instance without hitting real Google.
fn app_with_google_token_url(db: PgPool, token_url: Option<String>) -> axum::Router {
    let mut config = test_config();
    config.database_url = String::new();
    config.jwt_secret = JWT_SECRET.to_string();
    config.google_client_id = "test-client-id".into();
    config.google_client_secret = "test-client-secret".into();
    config.google_token_url_override = token_url;

    let state = AppState {
        config: config.clone(),
        db,
        s3: common::dummy_s3(),
        http: reqwest::Client::new(),
    };
    mdhd_server::create_app(&config, state).expect("build app")
}

/// Fires `GET /auth/google/callback` with the given query string and (optional)
/// CSRF cookie, including the default forwarded-IP header so the rate-limit
/// layer doesn't short-circuit the request before the handler runs.
async fn callback(
    app: axum::Router,
    query: &str,
    cookie: Option<&str>,
) -> axum::http::Response<Body> {
    let mut builder = Request::builder()
        .method("GET")
        .uri(format!("/auth/google/callback?{query}"))
        .header("X-Forwarded-For", common::DEFAULT_TEST_PEER);
    if let Some(c) = cookie {
        builder = builder.header(header::COOKIE, c);
    }
    app.oneshot(builder.body(Body::empty()).unwrap())
        .await
        .unwrap()
}

// ── CSRF state verification ───────────────────────────────────────────────

#[sqlx::test(migrations = "./migrations")]
async fn callback_without_csrf_cookie_returns_400(db: PgPool) {
    let app = app_with_google_token_url(db, None);
    let resp = callback(app, "code=abc&state=xyz", None).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "./migrations")]
async fn callback_without_state_param_returns_400(db: PgPool) {
    let app = app_with_google_token_url(db, None);
    let resp = callback(app, "code=abc", Some("oauth_csrf=xyz")).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "./migrations")]
async fn callback_with_mismatched_csrf_returns_400(db: PgPool) {
    let app = app_with_google_token_url(db, None);
    let resp = callback(
        app,
        "code=abc&state=client-val",
        Some("oauth_csrf=server-val"),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

/// Sanity check: the rejection must happen *before* any outbound HTTP call. We
/// prove this by pointing the token URL at an address nothing listens on — if
/// the handler had attempted exchange, the request would stall or 500; with a
/// correct CSRF rejection it must short-circuit to 400 instantly.
#[sqlx::test(migrations = "./migrations")]
async fn csrf_check_runs_before_token_exchange(db: PgPool) {
    // Port 1 is unassigned and nothing listens on it — any connect attempt
    // fails quickly. A CSRF mismatch must return 400 without ever trying to
    // connect here.
    let app = app_with_google_token_url(db, Some("http://127.0.0.1:1/token".into()));
    let resp = callback(app, "code=abc&state=nope", Some("oauth_csrf=different")).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

// ── Code-exchange failure ─────────────────────────────────────────────────

#[sqlx::test(migrations = "./migrations")]
async fn callback_returns_500_when_token_endpoint_rejects_code(db: PgPool) {
    // Simulate Google responding `400 invalid_grant` — the oauth2 crate's
    // `request_async` call surfaces that as an error, which our handler wraps
    // into AppError::Internal → 500.
    let mock = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/token"))
        .respond_with(ResponseTemplate::new(400).set_body_json(serde_json::json!({
            "error": "invalid_grant",
            "error_description": "Malformed auth code"
        })))
        .mount(&mock)
        .await;

    let token_url = format!("{}/token", mock.uri());
    let app = app_with_google_token_url(db, Some(token_url));

    // Matching CSRF cookie + state so we reach the exchange step.
    let resp = callback(
        app,
        "code=bogus-code&state=csrf-val",
        Some("oauth_csrf=csrf-val"),
    )
    .await;

    let status = resp.status();
    let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: serde_json::Value = serde_json::from_slice(&bytes).unwrap_or(serde_json::Value::Null);

    assert_eq!(
        status,
        StatusCode::INTERNAL_SERVER_ERROR,
        "failed code-exchange must map to 500, got body: {body}"
    );

    // Response must not leak provider-specific details. AppError::Internal
    // renders as a generic message — verify we don't accidentally expose
    // the upstream error text.
    if let Some(err) = body.get("error").and_then(|v| v.as_str()) {
        assert!(
            !err.to_lowercase().contains("invalid_grant"),
            "500 body must not leak upstream error strings, got: {err}"
        );
    }
}

#[sqlx::test(migrations = "./migrations")]
async fn callback_returns_500_when_token_endpoint_unreachable(db: PgPool) {
    // Pointing at an unused port simulates the token endpoint being down or
    // unreachable. The handler must degrade gracefully to 500, not hang or
    // panic. (Request-timeout layer is 30 s — this dials a refused port and
    // fails fast, well under that.)
    let app = app_with_google_token_url(db, Some("http://127.0.0.1:1/token".into()));

    let resp = callback(
        app,
        "code=bogus-code&state=csrf-val",
        Some("oauth_csrf=csrf-val"),
    )
    .await;

    assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
}

// The two positive unit tests at `src/routes/auth.rs` already pin that an
// unconfigured client returns 400 and that unknown providers are rejected —
// not duplicated here.
