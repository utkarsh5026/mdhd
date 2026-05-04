//! MDHD server library crate.
//!
//! Exposes the module tree and the [`create_app`] router factory so integration tests
//! under `server/tests/` can mount the exact production middleware stack that
//! `main.rs` runs in production.

pub mod auth;
pub mod config;
pub mod db;
pub mod errors;
pub mod middleware;
pub mod models;
pub mod routes;
pub mod services;
pub mod state;
pub mod storage;

#[cfg(test)]
pub mod testutil;

use std::time::Duration;

use axum::Router;
use axum::body::Body;
use axum::extract::State;
use axum::http::{Method, Request, StatusCode, header};
use axum::routing::get;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::request_id::{
    MakeRequestUuid, PropagateRequestIdLayer, RequestId, SetRequestIdLayer,
};
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::{DefaultOnResponse, TraceLayer};
use tracing::{Level, instrument};

use config::Config;
use state::AppState;

/// Path for the health-check endpoint.
///  Handlers mounted at this path are exempt from rate-limiting middleware, so they can be safely used by uptime monitoring services without risk of false positives due to traffic spikes.
pub const HEALTH_API_PATH: &str = "/api/health";

/// Assembles the fully-configured Axum [`Router`] with all middleware and route handlers.
///
/// Middleware stack (outermost → innermost): request ID, tracing, security headers,
/// compression, CORS, timeout, body limit, rate limit (application routes only —
/// `/api/health` is exempt).
///
/// # Errors
///
/// Returns an error if any entry in `config.cors_origins` cannot be parsed as a valid HTTP header value.
pub fn create_app(config: &Config, state: AppState) -> Result<Router, Box<dyn std::error::Error>> {
    let cors_headers = config
        .cors_origins
        .iter()
        .map(|origin| {
            origin
                .parse::<axum::http::HeaderValue>()
                .map_err(|e| format!("Invalid CORS_ORIGIN entry '{origin}': {e}"))
        })
        .collect::<Result<Vec<_>, _>>()?;

    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(cors_headers))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let rate_limited = routes::create_router().layer(middleware::rate_limit::layer());

    let app = Router::new()
        .route(HEALTH_API_PATH, get(health))
        .merge(rate_limited)
        .with_state(state)
        .layer(axum::extract::DefaultBodyLimit::max(10 * 1024 * 1024))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(30),
        ))
        .layer(cors)
        .layer(CompressionLayer::new())
        .layer(SetResponseHeaderLayer::if_not_present(
            header::X_CONTENT_TYPE_OPTIONS,
            axum::http::HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::if_not_present(
            header::X_FRAME_OPTIONS,
            axum::http::HeaderValue::from_static("DENY"),
        ))
        .layer(SetResponseHeaderLayer::if_not_present(
            header::REFERRER_POLICY,
            axum::http::HeaderValue::from_static("strict-origin-when-cross-origin"),
        ))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|request: &Request<Body>| {
                    let request_id = request
                        .extensions()
                        .get::<RequestId>()
                        .and_then(|id| id.header_value().to_str().ok())
                        .unwrap_or("-");

                    tracing::info_span!(
                        "http_request",
                        method = %request.method(),
                        path = %request.uri().path(),
                        request_id = %request_id,
                    )
                })
                .on_response(
                    DefaultOnResponse::new()
                        .level(Level::INFO)
                        .latency_unit(tower_http::LatencyUnit::Millis),
                ),
        )
        .layer(PropagateRequestIdLayer::x_request_id())
        .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid));

    Ok(app)
}

/// Health-check endpoint (`GET /api/health`).
///
/// Executes a trivial `SELECT 1` against the database to verify connectivity.
#[instrument(skip(state))]
async fn health(State(state): State<AppState>) -> StatusCode {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}
