use std::collections::HashSet;

use chrono::{DateTime, Duration, Utc};
use tracing::{info, warn};
use uuid::Uuid;

use crate::config::Config;
use crate::db;
use crate::errors::AppError;
use crate::storage;

#[derive(Debug, Clone)]
pub struct StorageGcArgs {
    pub grace_days: i64,
    pub dry_run: bool,
}

#[derive(Debug, Default)]
struct StorageGcStats {
    scanned: u64,
    skipped_non_mdhd_shape: u64,
    skipped_missing_last_modified: u64,
    claimed: u64,
    eligible_by_age: u64,
    deleted: u64,
    delete_errors: u64,
}

fn is_mdhd_storage_key(key: &str) -> bool {
    let Some((prefix, rest)) = key.split_once('/') else {
        return false;
    };
    if !rest.starts_with('/') {
        return false;
    }
    Uuid::parse_str(prefix).is_ok()
}

/// Collects MDHD-shaped storage objects from the given S3 object list, updating GC stats.
///
/// # DCO:
/// All contributions to this function are made under the Developer Certificate of Origin requirement.
///
/// This function iterates through all S3 objects, filtering for objects whose key matches
/// the MDHD storage shape (UUID prefix, correct path structure). It updates the provided
/// stats struct with counts for skipped objects (due to non-MDHD key shape or missing `last_modified`).
/// It returns a vector of tuples containing the storage key and its (optional) last modified date.
///
/// # Arguments
/// * `objects` - List of S3 objects
/// * `stats` - Mutable reference to GC statistics struct
///
/// # Returns
/// * `Vec<(String, Option<DateTime<Utc>>)>` - List of (`storage_key`, `last_modified`)
fn collect_mdhd_objects(
    objects: Vec<aws_sdk_s3::types::Object>,
    stats: &mut StorageGcStats,
) -> Vec<(String, Option<DateTime<Utc>>)> {
    objects
        .into_iter()
        .filter_map(|obj| {
            let key = obj.key?;
            if !is_mdhd_storage_key(&key) {
                stats.skipped_non_mdhd_shape += 1;
                return None;
            }

            let last_modified = obj.last_modified.and_then(|d| {
                let secs = d.secs();
                let nanos = d.subsec_nanos();
                DateTime::<Utc>::from_timestamp(secs, nanos)
            });
            if last_modified.is_none() {
                stats.skipped_missing_last_modified += 1;
            }

            Some((key, last_modified))
        })
        .collect()
}

/// Returns the subset of the given S3 storage keys that are referenced by file records in the database.
///
/// Used during storage GC to determine which Supabase S3 objects are "claimed" (referenced) by a
/// row in the `files` table, and thus should not be deleted as orphans.
///
/// # Arguments
///
/// * `db_pool` - A reference to the database connection pool.
/// * `keys` - A vector of S3 object storage keys (`String`). Typically, all MDHD-shaped keys found in the bucket.
///
/// # Returns
///
/// A `Result` containing a `HashSet<String>` of keys present in the database, or a `SQLx` error.
///
/// # Errors
///
/// Returns a `SQLx` error if the query fails.
///
/// # Example
///
/// ```ignore
/// let claimed =
///     fetch_claimed_storage_keys(&db_pool, &vec!["foo/bar".into(), "baz/qux".into()]).await?;
/// ```
async fn fetch_claimed_storage_keys(
    db_pool: &sqlx::PgPool,
    keys: &[String],
) -> Result<HashSet<String>, sqlx::Error> {
    if keys.is_empty() {
        return Ok(HashSet::new());
    }

    let rows: Vec<String> =
        sqlx::query_scalar("SELECT storage_key FROM files WHERE storage_key = ANY($1)")
            .bind(keys)
            .fetch_all(db_pool)
            .await?;

    Ok(rows.into_iter().collect())
}

/// Fetches a page of S3 objects from the specified bucket, optionally using a continuation token.
///
/// Used during storage garbage collection to iterate through all objects in the storage bucket,
/// in a paginated fashion. Returns the listed objects, truncation status, and a continuation token
/// (if more objects remain).
///
/// # Arguments
///
/// * `s3` - Reference to the AWS S3 client.
/// * `bucket` - The name of the bucket to list objects from.
/// * `continuation_token` - An optional continuation token for paginated listing. Use `None` on first call; pass the returned token from prior calls to fetch additional pages.
///
/// # Returns
///
/// On success, returns a tuple:
///   - `Vec<Object>`: the listed S3 objects for this page.
///   - `bool`: whether the results are truncated (true if more objects are available).
///   - `Option<String>`: the next continuation token, if any; pass this on next call.
///
/// # Errors
///
/// Returns an [`AppError`] if the S3 list operation fails.
///
/// # Example
///
/// ```ignore
/// let (objects, is_truncated, next_token) = list_storage_objects(&s3, bucket, None).await?;
/// ```
async fn list_storage_objects(
    s3: &aws_sdk_s3::Client,
    bucket: &str,
    continuation_token: Option<&str>,
) -> Result<(Vec<aws_sdk_s3::types::Object>, bool, Option<String>), AppError> {
    let mut req = s3.list_objects_v2().bucket(bucket);
    if let Some(token) = continuation_token {
        req = req.continuation_token(token);
    }

    let resp = req
        .send()
        .await
        .map_err(|e| AppError::internal(format!("S3 list failed: {e}")))?;

    Ok((
        resp.contents.unwrap_or_default(),
        resp.is_truncated.unwrap_or(false),
        resp.next_continuation_token,
    ))
}

/// Removes unclaimed MDHD-shaped objects from Supabase storage after the grace period.
///
/// # Errors
///
/// Returns an error if the database connection, database query, or S3 object listing fails.
pub async fn run_storage_gc(config: &Config, args: StorageGcArgs) -> Result<(), AppError> {
    let StorageGcArgs {
        grace_days,
        dry_run,
    } = args;
    let cutoff = Utc::now() - Duration::days(grace_days);
    info!(
        grace_days = grace_days,
        dry_run = dry_run,
        cutoff = %cutoff,
        bucket = %config.supabase_storage_bucket,
        "starting orphaned storage GC"
    );

    let db_pool = db::create_pool(config)
        .await
        .map_err(|e| AppError::internal(format!("DB connect failed: {e}")))?;

    let s3 = storage::create_s3_client(config);
    let bucket = &config.supabase_storage_bucket;

    let mut stats = StorageGcStats::default();
    let mut continuation_token: Option<String> = None;

    loop {
        let (objects, is_truncated, next_continuation_token) =
            list_storage_objects(&s3, bucket, continuation_token.as_deref()).await?;

        if objects.is_empty() && continuation_token.is_none() && !is_truncated {
            info!("bucket is empty (no objects listed)");
        }

        stats.scanned += objects.len() as u64;

        let mdhd_objects = collect_mdhd_objects(objects, &mut stats);
        let mdhd_keys = mdhd_objects
            .iter()
            .map(|(key, _)| key.clone())
            .collect::<Vec<String>>();

        let claimed = fetch_claimed_storage_keys(&db_pool, &mdhd_keys)
            .await
            .map_err(|e| AppError::internal(format!("DB query failed: {e}")))?;

        delete_objects(
            &s3,
            bucket,
            &mut stats,
            mdhd_objects,
            &claimed,
            cutoff,
            dry_run,
        )
        .await?;

        continuation_token = next_continuation_token;
        if !is_truncated {
            break;
        }
        if continuation_token.is_none() {
            break;
        }
    }

    info!(
        scanned = stats.scanned,
        skipped_non_mdhd_shape = stats.skipped_non_mdhd_shape,
        skipped_missing_last_modified = stats.skipped_missing_last_modified,
        claimed = stats.claimed,
        eligible_by_age = stats.eligible_by_age,
        deleted = stats.deleted,
        delete_errors = stats.delete_errors,
        "orphaned storage GC finished"
    );

    Ok(())
}

/// Deletes eligible orphaned MDHD storage objects, or logs them when running as a dry run.
///
/// Objects are skipped when their key is already claimed by the database, when they have no
/// usable `last_modified` timestamp, or when they are newer than the configured cutoff. The
/// function updates `stats` for claimed objects, age-eligible objects, successful deletes, and
/// delete failures.
///
/// # Errors
///
/// This function currently does not return an error. Individual S3 delete failures are logged and
/// counted in `stats.delete_errors` so the GC job can continue processing the remaining objects.
async fn delete_objects(
    s3: &aws_sdk_s3::Client,
    bucket: &str,
    stats: &mut StorageGcStats,
    mdhd_objects: Vec<(String, Option<DateTime<Utc>>)>,
    claimed: &HashSet<String>,
    cutoff: DateTime<Utc>,
    dry_run: bool,
) -> Result<(), AppError> {
    let eligible_objects = mdhd_objects.into_iter().filter_map(|(key, last_modified)| {
        if claimed.contains(&key) {
            stats.claimed += 1;
            return None;
        }

        let lm = last_modified?;
        if lm >= cutoff {
            return None;
        }

        stats.eligible_by_age += 1;

        if dry_run {
            info!(storage_key = %key, last_modified = %lm, "dry-run: would delete orphaned object");
            return None;
        }

        Some(key)
    });

    for key in eligible_objects {
        match storage::delete_object(s3, bucket, &key).await {
            Ok(()) => {
                stats.deleted += 1;
                info!(storage_key = %key, "deleted orphaned object");
            }
            Err(e) => {
                stats.delete_errors += 1;
                warn!(storage_key = %key, error = %e, "failed to delete orphaned object");
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use aws_sdk_s3::primitives::DateTime as S3DateTime;
    use aws_sdk_s3::types::Object;

    #[test]
    fn is_mdhd_storage_key_requires_uuid_prefix_and_double_slash_path() {
        let uuid = Uuid::new_v4();
        assert!(is_mdhd_storage_key(&format!("{uuid}//a.md")));

        assert!(!is_mdhd_storage_key(&format!("{uuid}/a.md"))); // rest must start with '/'
        assert!(!is_mdhd_storage_key("//a.md")); // missing uuid
        assert!(!is_mdhd_storage_key("not-a-uuid//a.md"));
        assert!(!is_mdhd_storage_key(&format!("{uuid}"))); // no slash separator
    }

    #[test]
    fn collect_mdhd_objects_filters_non_mdhd_and_updates_missing_last_modified_stat() {
        let uuid = Uuid::new_v4();
        let good_key = format!("{uuid}//good.md");
        let bad_key = "not-a-uuid//bad.md".to_string();

        let objects = vec![
            Object::builder()
                .key(good_key.clone())
                .last_modified(S3DateTime::from_secs(1))
                .build(),
            Object::builder().key(format!("{uuid}//no-lm.md")).build(),
            Object::builder().key(bad_key).build(),
        ];

        let mut stats = StorageGcStats::default();
        let mdhd = collect_mdhd_objects(objects, &mut stats);

        assert_eq!(mdhd.len(), 2);
        assert!(mdhd.iter().any(|(k, lm)| k == &good_key && lm.is_some()));

        assert_eq!(stats.skipped_non_mdhd_shape, 1);
        assert_eq!(stats.skipped_missing_last_modified, 1);
    }
}
