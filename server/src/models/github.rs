use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct GitHubRepo {
    pub id: Uuid,
    pub user_id: Uuid,
    pub github_id: i64,
    pub owner: String,
    pub name: String,
    pub full_name: String,
    pub default_branch: String,
    pub webhook_id: Option<i64>,
    pub webhook_secret: Option<String>,
    pub last_synced_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct GitHubFile {
    pub id: Uuid,
    pub repo_id: Uuid,
    pub user_id: Uuid,
    pub path: String,
    pub sha: String,
    pub storage_key: String,
    pub size_bytes: i64,
    pub last_synced_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
