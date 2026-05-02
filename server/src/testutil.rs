use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use serde_json::Value;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use crate::config::{AppEnv, Config};
use crate::state::AppState;

/// Returns a [`Config`] with empty/default values suitable for most tests.
/// Override individual fields after calling if a test needs specific values.
#[must_use]
pub fn test_config() -> Config {
    Config {
        database_url: String::new(),
        migration_database_url: String::new(),
        jwt_secret: "test-secret".to_string(),
        google_client_id: String::new(),
        google_client_secret: String::new(),
        oauth_redirect_base: "http://localhost:8080".to_string(),
        google_token_url_override: None,
        supabase_s3_endpoint: String::new(),
        supabase_s3_access_key: String::new(),
        supabase_s3_secret_key: String::new(),
        supabase_storage_bucket: String::new(),
        port: 8080,
        cors_origins: Vec::new(),
        frontend_url: String::new(),
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

/// Returns a dummy S3 client that won't make real requests.
#[must_use]
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

/// Builds an [`AppState`] from a database pool using test defaults.
#[must_use]
pub fn test_state(db: PgPool) -> AppState {
    AppState {
        config: test_config(),
        db,
        s3: dummy_s3(),
        http: reqwest::Client::new(),
    }
}

/// Inserts a test user and returns `(user_id, jwt_token)`.
///
/// # Panics
///
/// Panics if the `INSERT` / `RETURNING` query fails or if minting the JWT fails
/// (test-only `unwrap` paths).
pub async fn create_test_user(db: &PgPool) -> (Uuid, String) {
    let user_id: Uuid = sqlx::query_scalar(
        "INSERT INTO users (email, oauth_provider, oauth_id) VALUES ($1, 'test', $2) RETURNING id",
    )
    .bind(format!("test-{}@example.com", Uuid::new_v4()))
    .bind(Uuid::new_v4().to_string())
    .fetch_one(db)
    .await
    .unwrap();

    let token = crate::auth::jwt::create_token(user_id, "test-secret", 7).unwrap();
    (user_id, token)
}

/// Sends a GET request with a Bearer token and returns `(status, body)`.
///
/// # Panics
///
/// Panics if building the request, the `oneshot` call, or reading the response body fails
/// (test-only `unwrap` paths).
pub async fn get_json(app: axum::Router, uri: &str, token: &str) -> (StatusCode, Value) {
    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(uri)
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let status = response.status();
    let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, json)
}

/// Sends a DELETE request with a Bearer token and returns the status code.
///
/// # Panics
///
/// Panics if building the request or the `oneshot` call fails (test-only `unwrap` paths).
pub async fn delete_req(app: axum::Router, uri: &str, token: &str) -> StatusCode {
    app.oneshot(
        Request::builder()
            .method("DELETE")
            .uri(uri)
            .header(header::AUTHORIZATION, format!("Bearer {token}"))
            .body(Body::empty())
            .unwrap(),
    )
    .await
    .unwrap()
    .status()
}

/// Sends a JSON POST request with a Bearer token and returns `(status, body)`.
///
/// # Panics
///
/// Panics if building the request, the `oneshot` call, or reading the response body fails
/// (test-only `unwrap` paths).
pub async fn post_json(
    app: axum::Router,
    uri: &str,
    token: &str,
    body: Value,
) -> (StatusCode, Value) {
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    let status = response.status();
    let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, json)
}
