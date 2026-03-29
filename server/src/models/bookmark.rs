use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A saved position within a user-owned file.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Bookmark {
    pub id: Uuid,
    pub user_id: Uuid,
    pub file_id: Uuid,
    pub section_index: i32,
    pub name: String,
    pub created_at: DateTime<Utc>,
}
