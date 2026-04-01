//! Application entry point for the MDHD server.
//!
//! Sets up tracing, builds the Axum router with all middleware layers, connects to the database
//! and S3 storage, and drives the Tokio runtime. Graceful shutdown is handled via `SIGTERM` and
//! `Ctrl+C`.

mod auth;
mod config;
mod db;
mod errors;
mod middleware;
mod models;
mod routes;
mod services;
mod state;
mod storage;
#[cfg(test)]
mod testutil;

use std::time::Duration;

use axum::Router;
use axum::extract::State;
use axum::http::{Method, StatusCode, header};
use axum::routing::get;
use tower_http::compression::CompressionLayer;
use tower_http::cors::CorsLayer;
use tower_http::request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::{DefaultOnResponse, TraceLayer};
use tracing::Level;
use tracing_subscriber::{Layer, layer::SubscriberExt, util::SubscriberInitExt};

use config::{AppEnv, Config};
use state::AppState;

/// Initialises the global tracing subscriber based on the runtime environment.
///
/// In **development** the subscriber emits human-readable, coloured output with target and line
/// numbers included. In **production** it emits structured JSON (no ANSI codes) suitable for
/// log aggregation pipelines.
///
/// The log level filter is read from the `RUST_LOG` environment variable when set; otherwise a
/// sensible default is used (`info` for the application and `warn` for `SQLx` in production,
/// `debug` for both in development).
///
/// # Panics
///
/// Panics if a global subscriber has already been installed — this should only be called once
/// during process startup.
fn init_tracing(env: &AppEnv) {
    let env_filter =
        tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| match env {
            AppEnv::Production => "mdhd_server=info,tower_http=info,sqlx=warn".into(),
            AppEnv::Development => "mdhd_server=debug,tower_http=debug,sqlx=warn".into(),
        });

    let fmt_layer: Box<dyn Layer<_> + Send + Sync> = match env {
        AppEnv::Production => Box::new(tracing_subscriber::fmt::layer().json().with_ansi(false)),

        AppEnv::Development => Box::new(
            tracing_subscriber::fmt::layer()
                .with_target(true)
                .with_line_number(true),
        ),
    };

    tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt_layer)
        .init();
}

/// Assembles the fully-configured Axum [`Router`] with all middleware and route handlers.
///
/// The router is composed with the following middleware stack (outermost → innermost):
///
/// - **Request ID** — stamps every request with a UUID via the `x-request-id` header.
/// - **Tracing** — logs response status and latency at `INFO` level.
/// - **Security headers** — sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and
///   `Referrer-Policy: strict-origin-when-cross-origin` on responses that don't already have them.
/// - **Compression** — gzip/deflate/brotli response compression.
/// - **CORS** — restricts origins, methods, and headers based on [`Config::cors_origin`].
/// - **Timeout** — returns `408 Request Timeout` for requests that exceed 30 seconds.
/// - **Body limit** — rejects request bodies larger than 10 MiB.
///
/// # Errors
///
/// Returns an error if `config.cors_origin` cannot be parsed as a valid HTTP header value.
fn create_app(config: &Config, state: AppState) -> Result<Router, Box<dyn std::error::Error>> {
    let cors_header = config
        .cors_origin
        .parse::<axum::http::HeaderValue>()
        .map_err(|e| format!("Invalid CORS_ORIGIN '{}': {e}", config.cors_origin))?;

    let cors = CorsLayer::new()
        .allow_origin(cors_header)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let app = Router::new()
        .route("/api/health", get(health))
        .merge(routes::create_router())
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
            TraceLayer::new_for_http().on_response(
                DefaultOnResponse::new()
                    .level(Level::INFO)
                    .latency_unit(tower_http::LatencyUnit::Millis),
            ),
        )
        .layer(PropagateRequestIdLayer::x_request_id())
        .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid));

    Ok(app)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let env = std::env::var("RUN_ENV").unwrap_or_else(|_| "development".into());
    dotenvy::from_filename(format!(".env.{env}")).ok();
    dotenvy::dotenv().ok();

    let config = Config::from_env()?;

    init_tracing(&config.app_env);

    let port = config.port;

    let db = db::create_pool(&config.database_url).await?;
    let s3 = storage::create_s3_client(&config);
    let http = reqwest::Client::new();
    let state = AppState {
        config: config.clone(),
        db,
        s3,
        http,
    };

    let app = create_app(&config, state)?;
    let addr = format!("0.0.0.0:{port}");
    tracing::info!("Starting server on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

/// Health-check endpoint (`GET /api/health`).
///
/// Executes a trivial `SELECT 1` against the database to verify connectivity. Returns
/// `200 OK` when the database is reachable, or `503 Service Unavailable` if the query fails.
/// Intended for use by load-balancers and uptime monitors.
async fn health(State(state): State<AppState>) -> StatusCode {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}

/// Resolves once the process receives a graceful-shutdown signal.
///
/// Waits for either `SIGTERM` (Unix only) or `Ctrl+C` (`SIGINT`). When either arrives the future
/// resolves, allowing [`axum::serve`] to stop accepting new connections and drain in-flight
/// requests before the process exits.
async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(e) = tokio::signal::ctrl_c().await {
            tracing::error!("Failed to install Ctrl+C handler: {e}");
        }
    };

    #[cfg(unix)]
    let sigterm = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let sigterm = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {},
        () = sigterm => {},
    }

    tracing::info!("Shutdown signal received, draining connections...");
}
