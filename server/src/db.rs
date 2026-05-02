use std::time::Duration;

use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;

use crate::config::Config;

/// Creates a Postgres connection pool from `config.database_url` and pool limits.
///
/// # Errors
///
/// Returns [`sqlx::Error`] when the driver cannot establish a connection (for example
/// invalid URL, TLS failure, authentication, or the server is unreachable).
pub async fn create_pool(config: &Config) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(config.db_max_connections)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .test_before_acquire(true)
        .connect(&config.database_url)
        .await
}
