use std::collections::HashMap;

use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::setting::UserSetting;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/settings/sync", post(sync_settings))
}

/// A single setting entry sent by the client.
#[derive(Debug, Deserialize)]
pub struct ClientSettingEntry {
    pub key: String,
    pub hash: String,
    pub updated_at: DateTime<Utc>,
    pub value: serde_json::Value,
}

/// Request body for POST /settings/sync.
#[derive(Debug, Deserialize)]
pub struct SettingsSyncRequest {
    pub settings: Vec<ClientSettingEntry>,
}

/// A setting the client should apply (server has a newer version).
#[derive(Debug, Serialize)]
pub struct ServerSettingEntry {
    pub key: String,
    pub value: serde_json::Value,
    pub hash: String,
    pub updated_at: DateTime<Utc>,
}

/// Response body for POST /settings/sync.
#[derive(Debug, Serialize)]
pub struct SettingsSyncResponse {
    /// Settings where the server has a newer version — client should apply these.
    pub updated: Vec<ServerSettingEntry>,
    /// Keys where the client's version was accepted by the server.
    pub accepted: Vec<String>,
    /// Current server time — store as reference for next sync.
    pub server_time: DateTime<Utc>,
}

impl From<&UserSetting> for ServerSettingEntry {
    fn from(s: &UserSetting) -> Self {
        ServerSettingEntry {
            key: s.key.clone(),
            value: s.value.clone(),
            hash: s.hash.clone(),
            updated_at: s.updated_at,
        }
    }
}

/// POST /settings/sync — bidirectional settings sync using last-write-wins.
///
/// The client sends all its settings (key + hash + timestamp + value).
/// The server compares hashes and timestamps, then:
/// - Accepts client values that are newer (upserts them).
/// - Returns server values that are newer for the client to apply.
/// - Returns server settings the client doesn't have yet (from other devices).
async fn sync_settings(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<SettingsSyncRequest>,
) -> Result<Json<SettingsSyncResponse>, AppError> {
    let server_time = Utc::now();
    let uid = auth.user_id;

    let server_settings =
        sqlx::query_as::<_, UserSetting>("SELECT * FROM user_settings WHERE user_id = $1")
            .bind(uid)
            .fetch_all(&state.db)
            .await?;

    let server_map: HashMap<&str, &UserSetting> = server_settings
        .iter()
        .map(|s| (s.key.as_str(), s))
        .collect();

    let client_map: HashMap<&str, &ClientSettingEntry> =
        body.settings.iter().map(|s| (s.key.as_str(), s)).collect();

    let mut updated: Vec<ServerSettingEntry> = Vec::new();
    let mut accepted: Vec<String> = Vec::new();

    for client_entry in &body.settings {
        match server_map.get(client_entry.key.as_str()) {
            Some(server_entry) if client_entry.hash == server_entry.hash => {}

            Some(server_entry) if client_entry.updated_at < server_entry.updated_at => {
                updated.push((*server_entry).into());
            }

            _ => {
                upsert_setting(&state, uid, client_entry, server_time).await?;
                accepted.push(client_entry.key.clone());
            }
        }
    }

    for server_entry in &server_settings {
        if !client_map.contains_key(server_entry.key.as_str()) {
            updated.push(server_entry.into());
        }
    }

    Ok(Json(SettingsSyncResponse {
        updated,
        accepted,
        server_time,
    }))
}

/// Insert or update a setting row for the given user.
async fn upsert_setting(
    state: &AppState,
    user_id: uuid::Uuid,
    entry: &ClientSettingEntry,
    server_time: DateTime<Utc>,
) -> Result<(), AppError> {
    sqlx::query(
        r"
        INSERT INTO user_settings (user_id, key, value, hash, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, key)
        DO UPDATE SET value = $3, hash = $4, updated_at = $5
        ",
    )
    .bind(user_id)
    .bind(&entry.key)
    .bind(&entry.value)
    .bind(&entry.hash)
    .bind(server_time)
    .execute(&state.db)
    .await?;

    Ok(())
}
