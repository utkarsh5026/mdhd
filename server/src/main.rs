//! Application entry point for the MDHD server.
//!
//! Sets up tracing, connects to the database and S3 storage, builds the Axum router via
//! [`mdhd_server::create_app`], and drives the Tokio runtime. Graceful shutdown is handled
//! via `SIGTERM` and `Ctrl+C`.

use std::net::SocketAddr;
use std::time::Duration;

use tracing_subscriber::{Layer, layer::SubscriberExt, util::SubscriberInitExt};

use mdhd_server::config::{AppEnv, Config};
use mdhd_server::state::AppState;
use mdhd_server::{create_app, db, storage};

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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let env = std::env::var("RUN_ENV").unwrap_or_else(|_| "development".into());
    dotenvy::from_filename(format!(".env.{env}")).ok();
    dotenvy::dotenv().ok();

    let config = Config::from_env()?;
    init_tracing(&config.app_env);

    tracing::info!("Running database migrations");
    db::run_migrations(&config).await?;

    let db = db::create_pool(&config).await?;

    let s3 = storage::create_s3_client(&config);
    let http = reqwest::Client::builder()
        .timeout(Duration::from_secs(config.import_timeout_secs))
        .redirect(reqwest::redirect::Policy::none())
        .build()?;
    let state = AppState {
        config: config.clone(),
        db,
        s3,
        http,
    };

    let app = create_app(&config, state)?;
    let addr = format!("0.0.0.0:{}", config.port);
    tracing::info!("Starting server on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(e) = tokio::signal::ctrl_c().await {
            tracing::error!("Failed to install Ctrl+C handler: {e}");
        }
    };

    #[cfg(unix)]
    let sigterm = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut stream) => {
                stream.recv().await;
            }
            Err(e) => {
                tracing::error!("Failed to install SIGTERM handler: {e}");
            }
        }
    };

    #[cfg(not(unix))]
    let sigterm = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {},
        () = sigterm => {},
    }

    tracing::info!("Shutdown signal received, draining connections...");
}
