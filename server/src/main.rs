//! Application entry point for the MDHD server.
//!
//! Sets up tracing, connects to the database and S3 storage, builds the Axum router via
//! [`mdhd_server::create_app`], and drives the Tokio runtime. Graceful shutdown is handled
//! via `SIGTERM` and `Ctrl+C`.

use std::net::SocketAddr;
use std::time::Duration;

use mdhd_server::config::Config;
use mdhd_server::jobs::storage_gc::{StorageGcArgs, run_storage_gc};
use mdhd_server::state::AppState;
use mdhd_server::{create_app, db, init_tracing, storage};

fn print_gc_help() {
    eprintln!(
        r"mdhd-server gc-orphaned-storage [--grace-days N] [--dry-run]

Deletes orphaned objects from the Supabase S3 bucket: objects whose key is not
referenced by any row in `files.storage_key`.

Options:
  --grace-days N   Only delete objects older than N days (default: 7)
  --dry-run        Do not delete; only log what would be deleted
  -h, --help       Show this help
"
    );
}

fn parse_gc_args(args: &[String]) -> Result<StorageGcArgs, String> {
    let mut grace_days: i64 = 7;
    let mut dry_run = false;

    let mut i = 0usize;
    while i < args.len() {
        match args[i].as_str() {
            "--dry-run" => {
                dry_run = true;
                i += 1;
            }
            "--grace-days" => {
                let v = args
                    .get(i + 1)
                    .ok_or_else(|| "--grace-days requires a value".to_string())?;
                grace_days = v
                    .parse::<i64>()
                    .map_err(|_| "--grace-days must be an integer".to_string())?;
                if grace_days < 0 {
                    return Err("--grace-days must be >= 0".to_string());
                }
                i += 2;
            }
            "-h" | "--help" => return Err("help".to_string()),
            other => return Err(format!("unknown argument: {other}")),
        }
    }

    Ok(StorageGcArgs {
        grace_days,
        dry_run,
    })
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let env = std::env::var("RUN_ENV").unwrap_or_else(|_| "development".into());
    dotenvy::from_filename(format!(".env.{env}")).ok();
    dotenvy::dotenv().ok();

    let argv: Vec<String> = std::env::args().collect();
    let cmd = argv.get(1).map(String::as_str);

    let config = Config::from_env()?;
    init_tracing(&config.app_env);

    if matches!(cmd, Some("gc-orphaned-storage")) {
        let rest: Vec<String> = argv.into_iter().skip(2).collect();
        let parsed = parse_gc_args(&rest).map_err(|e| {
            if e == "help" {
                print_gc_help();
                std::process::exit(0);
            }
            e
        })?;

        run_storage_gc(&config, parsed).await?;
        return Ok(());
    }

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
