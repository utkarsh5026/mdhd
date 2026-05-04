use std::str::FromStr;
use std::time::Duration;

use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::{Connection, PgConnection, PgPool};

use crate::config::Config;

/// Safe with transaction poolers (PgBouncer): disable client-side prepared statement cache.
const PG_STATEMENT_CACHE_CAPACITY: usize = 0;

const POOL_MIN_CONNECTIONS: u32 = 1;
const POOL_ACQUIRE_TIMEOUT: Duration = Duration::from_secs(5);
const POOL_IDLE_TIMEOUT: Duration = Duration::from_secs(600);
const POOL_MAX_LIFETIME: Duration = Duration::from_secs(1800);

/// Creates a Postgres connection pool from `config.database_url` and pool limits.
///
/// # Errors
///
/// Returns [`sqlx::Error`] when the driver cannot establish a connection (for example
/// invalid URL, TLS failure, authentication, or the server is unreachable).
pub async fn create_pool(config: &Config) -> Result<PgPool, sqlx::Error> {
    let connect_options = PgConnectOptions::from_str(&config.database_url)?
        .statement_cache_capacity(PG_STATEMENT_CACHE_CAPACITY);

    PgPoolOptions::new()
        .max_connections(config.db_max_connections)
        .min_connections(POOL_MIN_CONNECTIONS)
        .acquire_timeout(POOL_ACQUIRE_TIMEOUT)
        .idle_timeout(POOL_IDLE_TIMEOUT)
        .max_lifetime(POOL_MAX_LIFETIME)
        .test_before_acquire(true)
        .connect_with(connect_options)
        .await
}

/// Runs pending migrations against `config.migration_database_url` on a single
/// short-lived connection that's closed before the app pool is created.
///
/// Migrations should target a direct Postgres connection (port 5432), not the
/// transaction-mode pooler — `sqlx::migrate!` uses advisory locks that misbehave
/// through `PgBouncer`.
///
/// # Errors
///
/// Returns [`sqlx::Error`] when connecting fails, or
/// [`sqlx::migrate::MigrateError`] when a migration fails to apply.
pub async fn run_migrations(config: &Config) -> Result<(), sqlx::migrate::MigrateError> {
    let connect_options = PgConnectOptions::from_str(&config.migration_database_url)?
        .statement_cache_capacity(PG_STATEMENT_CACHE_CAPACITY);

    let mut conn = PgConnection::connect_with(&connect_options).await?;
    sqlx::migrate!("./migrations").run(&mut conn).await?;
    conn.close().await?;
    Ok(())
}
