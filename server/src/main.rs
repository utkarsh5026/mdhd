mod auth;
mod config;
mod db;
mod errors;
mod middleware;
mod models;
mod routes;
mod state;
mod storage;

use axum::Router;
use axum::routing::get;
use tower_http::cors::{AllowHeaders, AllowMethods, CorsLayer};
use tower_http::trace::TraceLayer;

use config::Config;
use state::AppState;

#[tokio::main]
async fn main() {
    // Load environment-specific .env file first (values set here win),
    // then fall back to .env for shared defaults.
    let env = std::env::var("RUN_ENV").unwrap_or_else(|_| "development".into());
    dotenvy::from_filename(format!(".env.{env}")).ok();
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = Config::from_env();
    let port = config.port;

    let db = db::create_pool(&config.database_url).await;
    let s3 = storage::create_s3_client(&config);
    let state = AppState {
        config: config.clone(),
        db,
        s3,
    };

    let cors = CorsLayer::new()
        .allow_origin(
            config
                .cors_origin
                .parse::<axum::http::HeaderValue>()
                .expect("Invalid CORS_ORIGIN"),
        )
        .allow_methods(AllowMethods::any())
        .allow_headers(AllowHeaders::any());

    let app = Router::new()
        .route("/health", get(health))
        .merge(routes::create_router(state.clone()))
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = format!("0.0.0.0:{port}");
    tracing::info!("Starting server on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health() -> &'static str {
    "ok"
}
