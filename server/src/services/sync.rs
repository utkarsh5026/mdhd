//! Sync reconciliation logic for bidirectional cross-device file and settings sync.
//!
//! This module is pure business logic — it takes manifests describing what the server and client
//! each have, and returns decisions with disjoint action lists. No I/O or database access happens
//! here, making the reconciliation fully unit-testable.

use crate::models::file::FileMeta;
use crate::models::setting::UserSetting;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A single file entry from the client's local manifest.
#[derive(Debug, Deserialize)]
pub struct ClientFileEntry {
    pub path: String,
    pub content_hash: String,
    pub updated_at: DateTime<Utc>,
}

/// A file the client should download.
#[derive(Debug, Serialize)]
pub struct DownloadEntry {
    pub id: uuid::Uuid,
    pub name: String,
    pub path: String,
    pub content_hash: String,
    pub updated_at: DateTime<Utc>,
}

/// The inputs to [`reconcile`]: the server's current file list, the client's manifest, and the
/// timestamp of the client's last successful sync.
pub struct SyncManifest {
    /// All files currently stored on the server for this user.
    pub server: Vec<FileMeta>,
    /// The client's full local file manifest at the time of the sync request.
    pub client: Vec<ClientFileEntry>,
    /// The `server_time` returned by the previous sync, or `None` on the very first sync.
    ///
    /// Used to distinguish between "server has a file the client deleted" (file predates last sync)
    /// and "server has a new file the client doesn't know about yet" (file postdates last sync).
    pub last_sync_at: Option<DateTime<Utc>>,
}

/// The three disjoint action lists produced by [`reconcile`].
pub struct SyncDecision {
    /// Paths the client should upload via `POST /files`.
    pub upload: Vec<String>,
    /// Files the client should download via `GET /files/:id/content`.
    pub download: Vec<DownloadEntry>,
    /// Paths the client should delete from its local store.
    pub delete: Vec<String>,
}

fn download_entry(f: &FileMeta) -> DownloadEntry {
    DownloadEntry {
        id: f.id,
        name: f.name.clone(),
        path: f.path.clone(),
        content_hash: f.content_hash.clone().unwrap_or_default(),
        updated_at: f.updated_at,
    }
}

/// Computes which files need to be uploaded, downloaded, or deleted using last-write-wins.
///
/// The algorithm works in two passes:
///
/// 1. **Client files** — for each file the client has:
///    - If the server doesn't have it → client uploads.
///    - If hashes match → no action needed.
///    - If hashes differ and client is newer (or equal timestamp) → client uploads.
///    - If hashes differ and server is newer → client downloads.
///
/// 2. **Server-only files** — for each file the server has that the client didn't mention:
///    - If `last_sync_at` is `None` (first sync) → client downloads.
///    - If the file was created after `last_sync_at` → it's new on another device → client downloads.
///    - Otherwise → the client deleted it on another device → client deletes its own copy if any.
pub fn reconcile(manifest: &SyncManifest) -> SyncDecision {
    let server_map: HashMap<&str, &FileMeta> = manifest
        .server
        .iter()
        .map(|f| (f.path.as_str(), f))
        .collect();

    let client_map: HashMap<&str, &ClientFileEntry> = manifest
        .client
        .iter()
        .map(|f| (f.path.as_str(), f))
        .collect();

    let mut upload = Vec::new();
    let mut download = Vec::new();
    let mut delete = Vec::new();

    for f in &manifest.client {
        match server_map.get(f.path.as_str()) {
            None => {
                upload.push(f.path.clone());
            }
            Some(sf) => {
                let server_hash = sf.content_hash.as_deref().unwrap_or("");
                if f.content_hash == server_hash {
                } else if f.updated_at >= sf.updated_at {
                    upload.push(f.path.clone());
                } else {
                    download.push(download_entry(sf));
                }
            }
        }
    }

    for f in &manifest.server {
        if client_map.contains_key(f.path.as_str()) {
            continue;
        }

        match manifest.last_sync_at {
            None => {
                download.push(download_entry(f));
            }
            Some(last_sync) => {
                if f.created_at > last_sync {
                    download.push(download_entry(f));
                } else {
                    delete.push(f.path.clone());
                }
            }
        }
    }

    SyncDecision {
        upload,
        download,
        delete,
    }
}

/// A single setting entry sent by the client.
#[derive(Debug, Clone, Deserialize)]
pub struct ClientSettingEntry {
    pub key: String,
    pub hash: String,
    pub updated_at: DateTime<Utc>,
    pub value: serde_json::Value,
}

/// A setting the client should apply (server has a newer version).
#[derive(Debug, Serialize)]
pub struct ServerSettingEntry {
    pub key: String,
    pub value: serde_json::Value,
    pub hash: String,
    pub updated_at: DateTime<Utc>,
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

/// The two disjoint action lists produced by [`reconcile_settings`].
pub struct SettingsSyncDecision {
    /// Client settings the server should persist (client wins or key is new).
    pub to_upsert: Vec<ClientSettingEntry>,
    /// Server settings the client should apply (server wins or client doesn't have them).
    pub updated: Vec<ServerSettingEntry>,
}

/// Computes which settings to upsert on the server and which to send back to the client.
///
/// Uses last-write-wins by timestamp, with hash equality as a short-circuit:
/// - Hashes match → no action.
/// - Client is newer (or key unknown to server) → `to_upsert`.
/// - Server is newer → `updated`.
/// - Server has a key the client didn't send → `updated`.
pub fn reconcile_settings(
    server: &[UserSetting],
    client: &[ClientSettingEntry],
) -> SettingsSyncDecision {
    let server_map: HashMap<&str, &UserSetting> =
        server.iter().map(|s| (s.key.as_str(), s)).collect();

    let client_keys: std::collections::HashSet<&str> =
        client.iter().map(|s| s.key.as_str()).collect();

    let mut to_upsert = Vec::new();
    let mut updated = Vec::new();

    for entry in client {
        match server_map.get(entry.key.as_str()) {
            Some(sv) if entry.hash == sv.hash => {}
            Some(sv) if entry.updated_at < sv.updated_at => {
                updated.push((*sv).into());
            }
            _ => {
                to_upsert.push(entry.clone());
            }
        }
    }

    for sv in server {
        if !client_keys.contains(sv.key.as_str()) {
            updated.push(sv.into());
        }
    }

    SettingsSyncDecision { to_upsert, updated }
}

// Fluent trait to override `created_at` on a `FileMeta` while keeping the builder
// pattern readable inside test fixtures.
#[cfg(test)]
trait SetCreatedAt {
    fn with_created(self, at: DateTime<Utc>) -> Self;
}

#[cfg(test)]
impl SetCreatedAt for FileMeta {
    fn with_created(mut self, at: DateTime<Utc>) -> Self {
        self.created_at = at;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, TimeZone, Utc};
    use uuid::Uuid;

    /// Base timestamp used across all tests.
    fn base() -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap()
    }

    /// Offset from the base timestamp by `secs` seconds.
    fn t(secs: i64) -> DateTime<Utc> {
        base() + Duration::seconds(secs)
    }

    /// Build a [`FileMeta`] with `created_at == updated_at`.
    fn file_meta(path: &str, hash: &str, updated_at: DateTime<Utc>) -> FileMeta {
        FileMeta {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            name: path.rsplit('/').next().unwrap_or(path).to_string(),
            path: path.to_string(),
            storage_key: format!("storage/{path}"),
            size_bytes: 100,
            content_hash: Some(hash.to_string()),
            share_token: None,
            created_at: updated_at,
            updated_at,
        }
    }

    /// Build a [`ClientFileEntry`].
    fn client_entry(path: &str, hash: &str, updated_at: DateTime<Utc>) -> ClientFileEntry {
        ClientFileEntry {
            path: path.to_string(),
            content_hash: hash.to_string(),
            updated_at,
        }
    }

    /// Build a server-side [`UserSetting`].
    fn server_setting(
        key: &str,
        hash: &str,
        value: serde_json::Value,
        updated_at: DateTime<Utc>,
    ) -> UserSetting {
        UserSetting {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            key: key.to_string(),
            value,
            hash: hash.to_string(),
            updated_at,
        }
    }

    /// Build a [`ClientSettingEntry`].
    fn client_setting(
        key: &str,
        hash: &str,
        value: serde_json::Value,
        updated_at: DateTime<Utc>,
    ) -> ClientSettingEntry {
        ClientSettingEntry {
            key: key.to_string(),
            hash: hash.to_string(),
            value,
            updated_at,
        }
    }

    /// Client has a file the server doesn't know about → upload.
    #[test]
    fn client_only_file_triggers_upload() {
        let manifest = SyncManifest {
            server: vec![],
            client: vec![client_entry("/notes.md", "abc", t(0))],
            last_sync_at: None,
        };
        let d = reconcile(&manifest);

        assert_eq!(d.upload, vec!["/notes.md"]);
        assert!(d.download.is_empty());
        assert!(d.delete.is_empty());
    }

    /// Hashes match → no action, regardless of timestamps.
    #[test]
    fn matching_hashes_produce_no_action() {
        let manifest = SyncManifest {
            server: vec![file_meta("/notes.md", "abc", t(10))],
            client: vec![client_entry("/notes.md", "abc", t(0))],
            last_sync_at: Some(t(-100)),
        };
        let d = reconcile(&manifest);

        assert!(d.upload.is_empty(), "must not upload when hashes match");
        assert!(d.download.is_empty(), "must not download when hashes match");
        assert!(d.delete.is_empty());
    }

    /// Client timestamp is strictly newer and hash differs → client uploads.
    #[test]
    fn client_newer_triggers_upload() {
        let manifest = SyncManifest {
            server: vec![file_meta("/notes.md", "old", t(0))],
            client: vec![client_entry("/notes.md", "new", t(100))],
            last_sync_at: Some(t(-100)),
        };
        let d = reconcile(&manifest);

        assert_eq!(d.upload, vec!["/notes.md"]);
        assert!(d.download.is_empty());
    }

    /// Equal timestamps with different hashes → client wins (upload).
    #[test]
    fn equal_timestamps_different_hashes_client_wins() {
        let ts = t(50);
        let manifest = SyncManifest {
            server: vec![file_meta("/clash.md", "server-hash", ts)],
            client: vec![client_entry("/clash.md", "client-hash", ts)],
            last_sync_at: Some(t(0)),
        };
        let d = reconcile(&manifest);

        assert_eq!(d.upload, vec!["/clash.md"]);
        assert!(d.download.is_empty());
    }

    /// Server is strictly newer → client should download the server version.
    #[test]
    fn server_newer_triggers_download() {
        let manifest = SyncManifest {
            server: vec![file_meta("/doc.md", "server-new", t(100))],
            client: vec![client_entry("/doc.md", "client-old", t(0))],
            last_sync_at: Some(t(-100)),
        };
        let d = reconcile(&manifest);

        assert!(d.upload.is_empty());
        assert_eq!(d.download.len(), 1);
        assert_eq!(d.download[0].path, "/doc.md");
        assert_eq!(d.download[0].content_hash, "server-new");
    }

    /// Very first sync (`last_sync_at` == None): any server-only file → download.
    #[test]
    fn first_sync_server_only_file_downloads() {
        let manifest = SyncManifest {
            server: vec![file_meta("/readme.md", "hash1", t(0))],
            client: vec![],
            last_sync_at: None,
        };
        let d = reconcile(&manifest);

        assert!(d.upload.is_empty());
        assert_eq!(d.download.len(), 1);
        assert_eq!(d.download[0].path, "/readme.md");
        assert!(d.delete.is_empty());
    }

    /// Server file created *after* last sync → new file from another device → download.
    #[test]
    fn server_file_newer_than_last_sync_downloads() {
        let last_sync = t(0);
        // created_at = t(50) > last_sync = t(0)
        let f = file_meta("/new-device.md", "h", t(50)).with_created(t(50));
        let manifest = SyncManifest {
            server: vec![f],
            client: vec![],
            last_sync_at: Some(last_sync),
        };
        let d = reconcile(&manifest);

        assert_eq!(d.download.len(), 1);
        assert_eq!(d.download[0].path, "/new-device.md");
        assert!(d.delete.is_empty());
    }

    /// Server file predates last sync and client doesn't have it → client deleted it →
    /// tell the client to delete any stale local copy.
    #[test]
    fn server_file_older_than_last_sync_triggers_delete() {
        let last_sync = t(100);
        // created_at = t(0) < last_sync = t(100)
        let f = file_meta("/old.md", "h", t(10)).with_created(t(0));
        let manifest = SyncManifest {
            server: vec![f],
            client: vec![],
            last_sync_at: Some(last_sync),
        };
        let d = reconcile(&manifest);

        assert!(d.download.is_empty());
        assert_eq!(d.delete, vec!["/old.md"]);
    }

    /// Both manifests empty → all three lists are empty.
    #[test]
    fn both_empty_manifests_produce_empty_decision() {
        let manifest = SyncManifest {
            server: vec![],
            client: vec![],
            last_sync_at: Some(t(0)),
        };
        let d = reconcile(&manifest);

        assert!(d.upload.is_empty());
        assert!(d.download.is_empty());
        assert!(d.delete.is_empty());
    }

    /// Mix of all four outcomes (upload, download, delete, no-op) in one call.
    #[test]
    fn mixed_files_produce_correct_decisions() {
        let last_sync = t(100);
        let manifest = SyncManifest {
            server: vec![
                file_meta("/server-newer.md", "sn", t(200)), // server newer → download
                file_meta("/old-deleted.md", "h", t(10)).with_created(t(5)), // predates sync → delete
                file_meta("/same.md", "identical", t(50)),                   // hash match → no-op
            ],
            client: vec![
                client_entry("/client-only.md", "cn", t(150)), // client only → upload
                client_entry("/server-newer.md", "co", t(10)), // client older → download
                client_entry("/same.md", "identical", t(50)),  // hash match → no-op
            ],
            last_sync_at: Some(last_sync),
        };
        let d = reconcile(&manifest);

        assert_eq!(d.upload, vec!["/client-only.md"]);
        assert_eq!(d.download.len(), 1);
        assert_eq!(d.download[0].path, "/server-newer.md");
        assert_eq!(d.delete, vec!["/old-deleted.md"]);
    }

    /// `download_entry` copies id, name, path, `content_hash`, an`updated_at` faithfully.
    #[test]
    fn download_entry_copies_all_fields() {
        let id = Uuid::new_v4();
        let mut fm = file_meta("/test.md", "myhash", t(42));
        fm.id = id;
        fm.name = "test.md".to_string();

        let manifest = SyncManifest {
            server: vec![fm],
            client: vec![],
            last_sync_at: None,
        };
        let d = reconcile(&manifest);

        assert_eq!(d.download.len(), 1);
        let de = &d.download[0];
        assert_eq!(de.id, id);
        assert_eq!(de.name, "test.md");
        assert_eq!(de.path, "/test.md");
        assert_eq!(de.content_hash, "myhash");
        assert_eq!(de.updated_at, t(42));
    }

    /// Server file with `content_hash == None` is treated as `""` (empty string).
    /// A client that also sends `""` should produce no action.
    #[test]
    fn server_null_hash_treated_as_empty_string() {
        let mut fm = file_meta("/no-hash.md", "", t(0));
        fm.content_hash = None;

        let manifest = SyncManifest {
            server: vec![fm],
            client: vec![client_entry("/no-hash.md", "", t(0))],
            last_sync_at: Some(t(-10)),
        };
        let d = reconcile(&manifest);

        assert!(
            d.upload.is_empty(),
            "None hash should compare equal to \"\""
        );
        assert!(d.download.is_empty());
    }

    /// Empty inputs → empty outputs.
    #[test]
    fn settings_empty_inputs_produce_empty_outputs() {
        let r = reconcile_settings(&[], &[]);
        assert!(r.to_upsert.is_empty());
        assert!(r.updated.is_empty());
    }

    /// Hashes match → no action for that key.
    #[test]
    fn settings_matching_hash_no_action() {
        let sv = server_setting("theme", "h1", serde_json::json!("dark"), t(0));
        let ce = client_setting("theme", "h1", serde_json::json!("dark"), t(0));

        let r = reconcile_settings(&[sv], &[ce]);
        assert!(r.to_upsert.is_empty(), "matching hash → no upsert");
        assert!(r.updated.is_empty(), "matching hash → no update");
    }

    /// Key exists only on the client → go into `to_upsert`.
    #[test]
    fn client_only_setting_goes_to_upsert() {
        let ce = client_setting("font-size", "h2", serde_json::json!(14), t(0));

        let r = reconcile_settings(&[], &[ce]);
        assert_eq!(r.to_upsert.len(), 1);
        assert_eq!(r.to_upsert[0].key, "font-size");
        assert!(r.updated.is_empty());
    }

    /// Client is strictly newer (different hash, `client_updated_at` > `server_updated_at`) → upsert.
    #[test]
    fn client_newer_setting_goes_to_upsert() {
        let sv = server_setting("theme", "old-hash", serde_json::json!("light"), t(0));
        let ce = client_setting("theme", "new-hash", serde_json::json!("dark"), t(100));

        let r = reconcile_settings(&[sv], &[ce]);
        assert_eq!(r.to_upsert.len(), 1);
        assert_eq!(r.to_upsert[0].key, "theme");
        assert_eq!(r.to_upsert[0].hash, "new-hash");
        assert!(r.updated.is_empty());
    }

    /// Equal timestamps, different hashes → falls through to `_` → client wins (upsert).
    #[test]
    fn equal_timestamp_different_hash_client_wins_for_settings() {
        let ts = t(50);
        let sv = server_setting("val", "server-hash", serde_json::json!(1), ts);
        let ce = client_setting("val", "client-hash", serde_json::json!(2), ts);

        let r = reconcile_settings(&[sv], &[ce]);
        assert_eq!(r.to_upsert.len(), 1);
        assert!(r.updated.is_empty());
    }

    /// Server is strictly newer → push into `updated` so the client can apply it.
    #[test]
    fn server_newer_setting_goes_to_updated() {
        let sv = server_setting("lang", "server-hash", serde_json::json!("en"), t(200));
        let ce = client_setting("lang", "client-hash", serde_json::json!("fr"), t(0));

        let r = reconcile_settings(&[sv], &[ce]);
        assert!(r.to_upsert.is_empty());
        assert_eq!(r.updated.len(), 1);
        assert_eq!(r.updated[0].key, "lang");
        assert_eq!(r.updated[0].hash, "server-hash");
    }

    /// Key exists only on the server → always push to `updated`.
    #[test]
    fn server_only_setting_goes_to_updated() {
        let sv = server_setting("auto-save", "h3", serde_json::json!(true), t(0));

        let r = reconcile_settings(&[sv], &[]);
        assert!(r.to_upsert.is_empty());
        assert_eq!(r.updated.len(), 1);
        assert_eq!(r.updated[0].key, "auto-save");
    }

    /// `From<&UserSetting> for ServerSettingEntry` copies all four fields.
    #[test]
    fn server_setting_entry_from_user_setting_copies_all_fields() {
        let val = serde_json::json!({"nested": true});
        let ts = t(123);
        let sv = UserSetting {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            key: "complex".to_string(),
            value: val.clone(),
            hash: "complex-hash".to_string(),
            updated_at: ts,
        };

        let entry: ServerSettingEntry = (&sv).into();
        assert_eq!(entry.key, "complex");
        assert_eq!(entry.value, val);
        assert_eq!(entry.hash, "complex-hash");
        assert_eq!(entry.updated_at, ts);
    }

    /// Comprehensive mix: upsert + updated + no-ops in the same call.
    #[test]
    fn settings_mixed_scenario_is_correct() {
        let server = vec![
            server_setting("a", "ha", serde_json::json!(1), t(200)), // server newer → updated
            server_setting("b", "hb", serde_json::json!(2), t(0)),   // hash match → no-op
            server_setting("c", "hc", serde_json::json!(3), t(0)),   // server only → updated
        ];
        let client = vec![
            client_setting("a", "ha-old", serde_json::json!(10), t(0)), // server newer
            client_setting("b", "hb", serde_json::json!(2), t(0)),      // hash match
            client_setting("d", "hd", serde_json::json!(99), t(500)),   // client only → upsert
        ];

        let r = reconcile_settings(&server, &client);

        assert_eq!(r.to_upsert.len(), 1, "only 'd' should be upserts");
        assert_eq!(r.to_upsert[0].key, "d");

        assert_eq!(r.updated.len(), 2, "'a' and 'c' should be updated");
        let updated_keys: Vec<&str> = r.updated.iter().map(|e| e.key.as_str()).collect();
        assert!(updated_keys.contains(&"a"));
        assert!(updated_keys.contains(&"c"));
    }
}
