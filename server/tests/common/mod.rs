//! Shared helpers for integration tests under `server/tests/`.
//!
//! Integration tests are compiled as separate crates, so they cannot see items gated
//! behind `#[cfg(test)]` in the library. This module provides an equivalent minimal
//! surface — `test_config`, `dummy_s3`, `test_state`, `create_test_user`, and a few
//! request helpers — built directly on the library's public API.

#![allow(dead_code)]

use axum::Router;
use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use serde_json::Value;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use mdhd_server::config::{AppEnv, Config};
use mdhd_server::state::AppState;

/// Shared JWT secret used by both [`test_config`] and [`create_test_user`].
/// Must match across the two so tokens minted by the latter validate against
/// the config mounted by the former.
pub const JWT_SECRET: &str = "integration-test-secret";

/// Builds a [`Config`] suitable for integration tests — valid CORS origin so
/// [`mdhd_server::create_app`] succeeds, other fields safe defaults.
pub fn test_config() -> Config {
    Config {
        database_url: String::new(),
        jwt_secret: JWT_SECRET.to_string(),
        google_client_id: String::new(),
        google_client_secret: String::new(),
        oauth_redirect_base: "http://localhost:8080".to_string(),
        google_token_url_override: None,
        supabase_s3_endpoint: String::new(),
        supabase_s3_access_key: String::new(),
        supabase_s3_secret_key: String::new(),
        supabase_storage_bucket: String::new(),
        port: 8080,
        cors_origin: "http://localhost:5173".to_string(),
        frontend_url: "http://localhost:5173".to_string(),
        app_env: AppEnv::Development,
        db_max_connections: 5,
        jwt_expiry_days: 7,
        import_max_size: 5 * 1024 * 1024,
        import_timeout_secs: 15,
        sync_max_files: 1000,
        sync_max_settings: 200,
        paste_max_size: 512 * 1024,
    }
}

/// Returns an S3 client configured with dummy credentials — never makes real calls.
/// Tests that exercise endpoints which upload/download must avoid hitting these paths
/// or mock them separately.
pub fn dummy_s3() -> aws_sdk_s3::Client {
    let config = aws_sdk_s3::Config::builder()
        .behavior_version_latest()
        .region(aws_sdk_s3::config::Region::new("us-east-1"))
        .credentials_provider(aws_sdk_s3::config::Credentials::new(
            "test", "test", None, None, "test",
        ))
        .build();
    aws_sdk_s3::Client::from_conf(config)
}

/// Builds an [`AppState`] from a Postgres pool, ready to mount via
/// [`mdhd_server::create_app`].
pub fn test_state(db: PgPool) -> AppState {
    AppState {
        config: test_config(),
        db,
        s3: dummy_s3(),
        http: reqwest::Client::new(),
    }
}

/// Returns `true` when the S3 integration test suite should run. Gated so that
/// `cargo test` stays hermetic by default — set `S3_INTEGRATION_TESTS=1` and run
/// `docker compose -f docker-compose.dev.yml up -d minio` to enable.
pub fn s3_integration_enabled() -> bool {
    std::env::var("S3_INTEGRATION_TESTS").is_ok()
}

/// Builds an S3 client pointed at the local `MinIO` instance. Only call when
/// [`s3_integration_enabled`] is true. Reads `SUPABASE_S3_*` from the environment,
/// falling back to the `MinIO` dev defaults baked into `docker-compose.dev.yml`.
pub fn minio_s3() -> aws_sdk_s3::Client {
    let endpoint =
        std::env::var("SUPABASE_S3_ENDPOINT").unwrap_or_else(|_| "http://localhost:9000".into());
    let access = std::env::var("SUPABASE_S3_ACCESS_KEY").unwrap_or_else(|_| "minioadmin".into());
    let secret = std::env::var("SUPABASE_S3_SECRET_KEY").unwrap_or_else(|_| "minioadmin".into());

    let conf = aws_sdk_s3::Config::builder()
        .behavior_version(aws_sdk_s3::config::BehaviorVersion::latest())
        .region(aws_sdk_s3::config::Region::new("us-east-1"))
        .endpoint_url(endpoint)
        .credentials_provider(aws_sdk_s3::config::Credentials::new(
            access, secret, None, None, "test",
        ))
        .force_path_style(true)
        .build();
    aws_sdk_s3::Client::from_conf(conf)
}

/// Creates a unique `test-<uuid>` bucket and returns its name. Each test gets its
/// own bucket so parallel runs never collide.
pub async fn create_test_bucket(s3: &aws_sdk_s3::Client) -> String {
    let bucket = format!("test-{}", Uuid::new_v4());
    s3.create_bucket()
        .bucket(&bucket)
        .send()
        .await
        .expect("create test bucket");
    bucket
}

/// Best-effort teardown: deletes every object in the bucket, then the bucket itself.
/// Swallows errors — `MinIO` is treated as ephemeral (a panicking test skips this
/// anyway, and the container is expected to be reset between dev sessions).
pub async fn purge_bucket(s3: &aws_sdk_s3::Client, bucket: &str) {
    let Ok(list) = s3.list_objects_v2().bucket(bucket).send().await else {
        let _ = s3.delete_bucket().bucket(bucket).send().await;
        return;
    };
    for obj in list.contents() {
        if let Some(key) = obj.key() {
            let _ = s3.delete_object().bucket(bucket).key(key).send().await;
        }
    }
    let _ = s3.delete_bucket().bucket(bucket).send().await;
}

/// Like [`app_with_db`] but wires a real S3 client and bucket into [`AppState`],
/// so HTTP-level tests can exercise the full upload / download / delete path.
pub fn app_with_s3(db: PgPool, s3: aws_sdk_s3::Client, bucket: String) -> Router {
    let mut config = test_config();
    config.supabase_storage_bucket = bucket;
    let state = AppState {
        config: config.clone(),
        db,
        s3,
        http: reqwest::Client::new(),
    };
    mdhd_server::create_app(&config, state).expect("build app")
}

/// Inserts a fresh user row and returns `(user_id, bearer_jwt)`.
///
/// The JWT is signed with [`JWT_SECRET`] so it validates against a router built
/// from [`test_config`].
pub async fn create_test_user(db: &PgPool) -> (Uuid, String) {
    let user_id: Uuid = sqlx::query_scalar(
        "INSERT INTO users (email, oauth_provider, oauth_id) VALUES ($1, 'test', $2) RETURNING id",
    )
    .bind(format!("it-{}@example.com", Uuid::new_v4()))
    .bind(Uuid::new_v4().to_string())
    .fetch_one(db)
    .await
    .expect("insert test user");

    let token =
        mdhd_server::auth::jwt::create_token(user_id, JWT_SECRET, 7).expect("mint test JWT");
    (user_id, token)
}

/// Mounts the full production middleware stack (via [`mdhd_server::create_app`])
/// against the given pool. This is what integration tests should use when they want
/// to exercise real security headers, CORS, timeouts, body limits, and rate limiting.
pub fn app_with_db(db: PgPool) -> Router {
    let state = test_state(db);
    mdhd_server::create_app(&state.config.clone(), state).expect("build app")
}

/// Fires a single request through a router via `tower::ServiceExt::oneshot` and
/// returns `(status, body_bytes)`. Does not parse JSON — the caller decides.
pub async fn send(app: Router, req: Request<Body>) -> (StatusCode, Vec<u8>) {
    let resp = app.oneshot(req).await.expect("oneshot");
    let status = resp.status();
    let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .expect("read body");
    (status, bytes.to_vec())
}

/// Default peer IP stamped on helper-built requests so the rate-limit middleware's
/// `SmartIpKeyExtractor` can derive a key — `oneshot` does not populate
/// `ConnectInfo`, so without an `X-Forwarded-For` header the extractor fails and
/// the request is rejected before reaching the handler.
pub const DEFAULT_TEST_PEER: &str = "203.0.113.250";

/// Convenience helper: `GET <uri>` with a bearer token, returns `(status, json)`.
/// Automatically injects a default `X-Forwarded-For` so the full production stack
/// (including rate limiting) can process the request.
pub async fn get_json(app: Router, uri: &str, token: &str) -> (StatusCode, Value) {
    let req = Request::builder()
        .method("GET")
        .uri(uri)
        .header(header::AUTHORIZATION, format!("Bearer {token}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::empty())
        .unwrap();
    let (status, bytes) = send(app, req).await;
    let json = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, json)
}

/// Builds a plain `GET <uri>` request targeted at `/api/health` (the one endpoint
/// mounted outside the rate-limit layer, so no forwarded-IP header is required).
/// For any other endpoint use [`get_with_peer`] so the rate-limit key extractor
/// can derive an IP.
pub fn bare_get(uri: &str) -> Request<Body> {
    Request::builder()
        .method("GET")
        .uri(uri)
        .body(Body::empty())
        .unwrap()
}

/// Builds a `GET <uri>` request with an `X-Forwarded-For: <peer>` header.
/// Required for rate-limit tests because `SmartIpKeyExtractor` needs a key source
/// and `oneshot` does not populate `ConnectInfo`.
pub fn get_with_peer(uri: &str, peer: &str) -> Request<Body> {
    Request::builder()
        .method("GET")
        .uri(uri)
        .header("X-Forwarded-For", peer)
        .body(Body::empty())
        .unwrap()
}

/// Convenience helper: `DELETE <uri>` with a bearer token, returns the status.
/// Mirrors [`get_json`] / [`post_json`] — injects the default forwarded-IP
/// header so the full production stack can process the request.
pub async fn delete_req(app: Router, uri: &str, token: &str) -> StatusCode {
    let req = Request::builder()
        .method("DELETE")
        .uri(uri)
        .header(header::AUTHORIZATION, format!("Bearer {token}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::empty())
        .unwrap();
    let (status, _bytes) = send(app, req).await;
    status
}

/// Convenience helper: `POST <uri>` with a JSON body and bearer token, returns
/// `(status, json)`. Injects the default forwarded-IP header so the full
/// production stack (rate limiting + auth) can process the request.
pub async fn post_json(app: Router, uri: &str, token: &str, body: Value) -> (StatusCode, Value) {
    let req = Request::builder()
        .method("POST")
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::AUTHORIZATION, format!("Bearer {token}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .body(Body::from(body.to_string()))
        .unwrap();
    let (status, bytes) = send(app, req).await;
    let json = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, json)
}
