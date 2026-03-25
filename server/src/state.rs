use aws_sdk_s3::Client as S3Client;
use sqlx::PgPool;

use crate::config::Config;

/// Shared application state available to all route handlers.
#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub db: PgPool,
    pub s3: S3Client,
}
