mod auth;
mod config;
mod db;
mod errors;
mod middleware;
mod models;
mod routes;
mod state;
mod storage;
#[cfg(test)]
mod testutil;

use std::time::Duration;

use axum::Router;
use axum::extract::State;
use axum::http::{Method, StatusCode, header};
use axum::routing::get;
use tower_http::cors::CorsLayer;
use tower_http::request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::{DefaultOnResponse, TraceLayer};
use tracing::Level;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;
use state::AppState;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let env = std::env::var("RUN_ENV").unwrap_or_else(|_| "development".into());
    dotenvy::from_filename(format!(".env.{env}")).ok();
    dotenvy::dotenv().ok();

    let env_filter = tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        if env == "production" {
            "mdhd_server=info,tower_http=info,sqlx=warn".into()
        } else {
            "mdhd_server=debug,tower_http=debug,sqlx=warn".into()
        }
    });

    let registry = tracing_subscriber::registry().with(env_filter);
    if env == "production" {
        registry
            .with(tracing_subscriber::fmt::layer().json())
            .init();
    } else {
        registry.with(tracing_subscriber::fmt::layer()).init();
    }

    let config = Config::from_env()?;
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

    let cors_header = config
        .cors_origin
        .parse::<axum::http::HeaderValue>()
        .map_err(|e| format!("Invalid CORS_ORIGIN '{}': {e}", config.cors_origin))?;

    let cors = CorsLayer::new()
        .allow_origin(cors_header)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let app = Router::new()
        .route("/health", get(health))
        .merge(routes::create_router())
        .with_state(state)
        .layer(axum::extract::DefaultBodyLimit::max(10 * 1024 * 1024))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(30),
        ))
        .layer(cors)
        .layer(
            TraceLayer::new_for_http().on_response(
                DefaultOnResponse::new()
                    .level(Level::INFO)
                    .latency_unit(tower_http::LatencyUnit::Millis),
            ),
        )
        .layer(PropagateRequestIdLayer::x_request_id())
        .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid));

    let addr = format!("0.0.0.0:{port}");
    tracing::info!("Starting server on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn health(State(state): State<AppState>) -> StatusCode {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::SERVICE_UNAVAILABLE,
    }
}

async fn shutdown_signal() {
    if let Err(e) = tokio::signal::ctrl_c().await {
        tracing::error!("Failed to install Ctrl+C handler: {e}");
    }
    tracing::info!("Shutdown signal received, draining connections...");
}
