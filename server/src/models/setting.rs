use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A single user-settings row from the `user_settings` table.
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserSetting {
    pub id: Uuid,
    pub user_id: Uuid,
    pub key: String,
    pub value: serde_json::Value,
    pub hash: String,
    pub updated_at: DateTime<Utc>,
}
