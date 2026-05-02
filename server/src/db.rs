use std::str::FromStr;
use std::time::Duration;

use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::{Connection, PgConnection, PgPool};

use crate::config::Config;

/// Creates a Postgres connection pool from `config.database_url` and pool limits.
///
/// # Errors
///
/// Returns [`sqlx::Error`] when the driver cannot establish a connection (for example
/// invalid URL, TLS failure, authentication, or the server is unreachable).
pub async fn create_pool(config: &Config) -> Result<PgPool, sqlx::Error> {
    let connect_options =
        PgConnectOptions::from_str(&config.database_url)?.statement_cache_capacity(0);

    PgPoolOptions::new()
        .max_connections(config.db_max_connections)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .test_before_acquire(true)
        .connect_with(connect_options)
        .await
}

/// Runs pending migrations against `config.migration_database_url` on a single
/// short-lived connection that's closed before the app pool is created.
///
/// Migrations should target a direct Postgres connection (port 5432), not the
/// transaction-mode pooler — `sqlx::migrate!` uses advisory locks that misbehave
/// through PgBouncer.
///
/// # Errors
///
/// Returns [`sqlx::Error`] when connecting fails, or
/// [`sqlx::migrate::MigrateError`] when a migration fails to apply.
pub async fn run_migrations(config: &Config) -> Result<(), sqlx::migrate::MigrateError> {
    let mut conn = PgConnection::connect(&config.migration_database_url).await?;
    sqlx::migrate!("./migrations").run(&mut conn).await?;
    conn.close().await?;
    Ok(())
}
