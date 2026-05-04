//! Reading progress and stats endpoints.
//!
//! Persists per-file reading position and accumulated time so the experience
//! can resume across devices. Also exposes daily roll-ups used to compute
//! streaks and the stats dashboard.
//!
//! | Method | Path | Handler |
//! |--------|------|---------|
//! | POST | `/progress` | [`post_progress`] — batched upsert of progress entries |
//! | GET | `/progress` | [`list_progress`] — all progress rows for the user |
//! | GET | `/progress/:file_id` | [`get_progress`] — single file (used by resume banner) |
//! | GET | `/stats/summary` | [`stats_summary`] — totals, streaks, last-7-days, recent files |

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{DateTime, Duration, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use tracing::instrument;
use uuid::Uuid;

use crate::errors::{AppError, OptionExt};
use crate::middleware::auth::AuthUser;
use crate::models::progress::ReadingProgress;
use crate::state::AppState;

/// Maximum seconds a single batch entry can contribute. Defends against runaway
/// client clocks if a tab is left open with broken visibility detection.
const MAX_SECONDS_PER_ENTRY: i32 = 600;

/// Maximum number of entries accepted in a single `POST /progress` batch.
const MAX_BATCH_ENTRIES: usize = 100;

/// Caps on anchor payload sizes — match the CHECK constraints in migration 016.
const MAX_ANCHOR_PATH_DEPTH: usize = 8;
const MAX_ANCHOR_SLUG_LEN: usize = 80;
const MAX_ANCHOR_TAG_LEN: usize = 16;
const MAX_ANCHOR_HASH_LEN: usize = 16;

#[derive(Debug, Serialize)]
pub struct ProgressResponse {
    pub file_id: Uuid,
    pub section_index: i32,
    pub scroll_pct: f32,
    pub seconds_spent: i32,
    pub completed_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
    pub anchor_heading_path: Option<Vec<String>>,
    pub anchor_block_offset: Option<i32>,
    pub anchor_block_tag: Option<String>,
    pub anchor_block_hash: Option<String>,
}

impl From<ReadingProgress> for ProgressResponse {
    fn from(p: ReadingProgress) -> Self {
        ProgressResponse {
            file_id: p.file_id,
            section_index: p.section_index,
            scroll_pct: p.scroll_pct,
            seconds_spent: p.seconds_spent,
            completed_at: p.completed_at,
            updated_at: p.updated_at,
            anchor_heading_path: p.anchor_heading_path,
            anchor_block_offset: p.anchor_block_offset,
            anchor_block_tag: p.anchor_block_tag,
            anchor_block_hash: p.anchor_block_hash,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct ProgressEntry {
    pub file_id: Uuid,
    pub section_index: i32,
    pub scroll_pct: f32,
    /// Active seconds elapsed since the previous flush for this file. Added to
    /// the running `seconds_spent` for the row and to today's session rollup.
    pub seconds_delta: i32,
    /// When `Some(true)`, sets `completed_at` to `now()` if not already set.
    #[serde(default)]
    pub completed: Option<bool>,
    /// Optional sub-section anchor for precise cross-device resume. All four
    /// fields are written together — when any is present, the others should be
    /// too (an empty path is allowed and means "no sub-heading").
    #[serde(default)]
    pub anchor_heading_path: Option<Vec<String>>,
    #[serde(default)]
    pub anchor_block_offset: Option<i32>,
    #[serde(default)]
    pub anchor_block_tag: Option<String>,
    #[serde(default)]
    pub anchor_block_hash: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PostProgressRequest {
    pub entries: Vec<ProgressEntry>,
}

#[derive(Debug, Serialize)]
pub struct DayBucket {
    pub day: NaiveDate,
    pub seconds_spent: i32,
}

#[derive(Debug, Serialize)]
pub struct RecentFile {
    pub file_id: Uuid,
    pub name: String,
    pub section_index: i32,
    pub scroll_pct: f32,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct StatsSummary {
    pub total_seconds: i64,
    pub files_completed: i64,
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_7_days: Vec<DayBucket>,
    pub recent_files: Vec<RecentFile>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/progress", post(post_progress).get(list_progress))
        .route("/progress/{file_id}", get(get_progress))
        .route("/stats/summary", get(stats_summary))
}

async fn verify_file_owner(
    db: &sqlx::PgPool,
    file_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let owner = sqlx::query_scalar!("SELECT user_id FROM files WHERE id = $1", file_id)
        .fetch_optional(db)
        .await?
        .or_not_found()?;

    if owner != user_id {
        return Err(AppError::NotFound);
    }
    Ok(())
}

fn validate_entry(e: &ProgressEntry) -> Result<(), AppError> {
    if e.section_index < 0 {
        return Err(AppError::bad_request("section_index must be non-negative"));
    }
    if !(0.0..=1.0).contains(&e.scroll_pct) || !e.scroll_pct.is_finite() {
        return Err(AppError::bad_request("scroll_pct must be between 0 and 1"));
    }
    if e.seconds_delta < 0 {
        return Err(AppError::bad_request("seconds_delta must be non-negative"));
    }
    if e.seconds_delta > MAX_SECONDS_PER_ENTRY {
        return Err(AppError::bad_request(format!(
            "seconds_delta exceeds {MAX_SECONDS_PER_ENTRY} per entry"
        )));
    }
    if let Some(path) = &e.anchor_heading_path {
        if path.len() > MAX_ANCHOR_PATH_DEPTH {
            return Err(AppError::bad_request(format!(
                "anchor_heading_path exceeds {MAX_ANCHOR_PATH_DEPTH} segments"
            )));
        }
        if path.iter().any(|s| s.len() > MAX_ANCHOR_SLUG_LEN) {
            return Err(AppError::bad_request(format!(
                "anchor_heading_path slug exceeds {MAX_ANCHOR_SLUG_LEN} chars"
            )));
        }
    }
    if let Some(off) = e.anchor_block_offset
        && off < 0
    {
        return Err(AppError::bad_request(
            "anchor_block_offset must be non-negative",
        ));
    }
    if let Some(tag) = &e.anchor_block_tag
        && (tag.is_empty() || tag.len() > MAX_ANCHOR_TAG_LEN)
    {
        return Err(AppError::bad_request(format!(
            "anchor_block_tag must be 1..={MAX_ANCHOR_TAG_LEN} chars"
        )));
    }
    if let Some(hash) = &e.anchor_block_hash
        && (hash.is_empty() || hash.len() > MAX_ANCHOR_HASH_LEN)
    {
        return Err(AppError::bad_request(format!(
            "anchor_block_hash must be 1..={MAX_ANCHOR_HASH_LEN} chars"
        )));
    }
    Ok(())
}

/// `POST /progress` — batched upsert.
///
/// Each entry upserts its `reading_progress` row (last-write-wins on position;
/// `seconds_spent` accumulates) and adds `seconds_delta` to today's
/// `reading_sessions` rollup. All writes happen in a single transaction so a
/// partial failure rolls back cleanly.
#[instrument(skip(state, body), fields(user_id = %auth.user_id, entries = body.entries.len()))]
async fn post_progress(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<PostProgressRequest>,
) -> Result<StatusCode, AppError> {
    if body.entries.is_empty() {
        return Ok(StatusCode::NO_CONTENT);
    }
    if body.entries.len() > MAX_BATCH_ENTRIES {
        return Err(AppError::bad_request(format!(
            "batch exceeds {MAX_BATCH_ENTRIES} entries"
        )));
    }
    for e in &body.entries {
        validate_entry(e)?;
    }

    let unique_files: std::collections::HashSet<Uuid> =
        body.entries.iter().map(|e| e.file_id).collect();
    for fid in &unique_files {
        verify_file_owner(&state.db, *fid, auth.user_id).await?;
    }

    let mut tx = state.db.begin().await?;
    let today = Utc::now().date_naive();
    let mut total_seconds_today: i32 = 0;
    let mut touched_today: std::collections::HashSet<Uuid> = std::collections::HashSet::new();

    for e in &body.entries {
        let mark_complete = e.completed.unwrap_or(false);
        // Anchor: write only when a tag is present (the trio path/offset/tag is
        // captured together by the client). Hash is independent and may be null
        // for non-text blocks. Empty path slice represents "no sub-heading".
        let has_anchor = e.anchor_block_tag.is_some();
        let path_slice: Option<&[String]> = if has_anchor {
            Some(e.anchor_heading_path.as_deref().unwrap_or(&[]))
        } else {
            None
        };
        sqlx::query!(
            r"
            INSERT INTO reading_progress
                (user_id, file_id, section_index, scroll_pct, seconds_spent, completed_at, updated_at,
                 anchor_heading_path, anchor_block_offset, anchor_block_tag, anchor_block_hash)
            VALUES ($1, $2, $3, $4, $5, CASE WHEN $6 THEN now() ELSE NULL END, now(),
                    $7, $8, $9, $10)
            ON CONFLICT (user_id, file_id) DO UPDATE SET
                section_index = EXCLUDED.section_index,
                scroll_pct = EXCLUDED.scroll_pct,
                seconds_spent = reading_progress.seconds_spent + $5,
                completed_at = COALESCE(reading_progress.completed_at,
                    CASE WHEN $6 THEN now() ELSE NULL END),
                updated_at = now(),
                anchor_heading_path = COALESCE(EXCLUDED.anchor_heading_path, reading_progress.anchor_heading_path),
                anchor_block_offset = COALESCE(EXCLUDED.anchor_block_offset, reading_progress.anchor_block_offset),
                anchor_block_tag    = COALESCE(EXCLUDED.anchor_block_tag,    reading_progress.anchor_block_tag),
                anchor_block_hash   = COALESCE(EXCLUDED.anchor_block_hash,   reading_progress.anchor_block_hash)
            ",
            auth.user_id,
            e.file_id,
            e.section_index,
            e.scroll_pct,
            e.seconds_delta,
            mark_complete,
            path_slice as Option<&[String]>,
            e.anchor_block_offset,
            e.anchor_block_tag.as_deref(),
            e.anchor_block_hash.as_deref(),
        )
        .execute(&mut *tx)
        .await?;

        total_seconds_today += e.seconds_delta;
        if e.seconds_delta > 0 {
            touched_today.insert(e.file_id);
        }
    }

    if total_seconds_today > 0 {
        sqlx::query!(
            r"
            INSERT INTO reading_sessions (user_id, day, seconds_spent, files_touched, updated_at)
            VALUES ($1, $2, $3, $4, now())
            ON CONFLICT (user_id, day) DO UPDATE SET
                seconds_spent = reading_sessions.seconds_spent + EXCLUDED.seconds_spent,
                files_touched = GREATEST(reading_sessions.files_touched, EXCLUDED.files_touched),
                updated_at = now()
            ",
            auth.user_id,
            today,
            total_seconds_today,
            i32::try_from(touched_today.len()).unwrap_or(i32::MAX),
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

/// `GET /progress` — all progress rows for the authenticated user.
#[instrument(skip(state), fields(user_id = %auth.user_id))]
async fn list_progress(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<ProgressResponse>>, AppError> {
    let rows = sqlx::query_as!(
        ReadingProgress,
        "SELECT * FROM reading_progress WHERE user_id = $1 ORDER BY updated_at DESC",
        auth.user_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows.into_iter().map(ProgressResponse::from).collect()))
}

/// `GET /progress/:file_id` — progress for a single file (404 if none).
#[instrument(skip(state), fields(user_id = %auth.user_id, file_id = %file_id))]
async fn get_progress(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(file_id): Path<Uuid>,
) -> Result<Json<ProgressResponse>, AppError> {
    verify_file_owner(&state.db, file_id, auth.user_id).await?;

    let row = sqlx::query_as!(
        ReadingProgress,
        "SELECT * FROM reading_progress WHERE user_id = $1 AND file_id = $2",
        auth.user_id,
        file_id,
    )
    .fetch_optional(&state.db)
    .await?
    .or_not_found()?;

    Ok(Json(ProgressResponse::from(row)))
}

/// `GET /stats/summary` — aggregate stats for the dashboard.
#[instrument(skip(state), fields(user_id = %auth.user_id))]
async fn stats_summary(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<StatsSummary>, AppError> {
    let total_seconds: i64 = sqlx::query_scalar!(
        "SELECT COALESCE(SUM(seconds_spent)::BIGINT, 0) AS \"v!\" FROM reading_sessions WHERE user_id = $1",
        auth.user_id
    )
    .fetch_one(&state.db)
    .await?;

    let files_completed: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*)::BIGINT AS \"v!\" FROM reading_progress WHERE user_id = $1 AND completed_at IS NOT NULL",
        auth.user_id
    )
    .fetch_one(&state.db)
    .await?;

    let today = Utc::now().date_naive();
    let seven_days_ago = today - Duration::days(6);

    let day_rows = sqlx::query!(
        "SELECT day, seconds_spent FROM reading_sessions WHERE user_id = $1 AND day >= $2 ORDER BY day ASC",
        auth.user_id,
        seven_days_ago,
    )
    .fetch_all(&state.db)
    .await?;

    let mut last_7_days: Vec<DayBucket> = (0..7)
        .map(|offset| DayBucket {
            day: seven_days_ago + Duration::days(offset),
            seconds_spent: 0,
        })
        .collect();
    for r in day_rows {
        if let Some(bucket) = last_7_days.iter_mut().find(|b| b.day == r.day) {
            bucket.seconds_spent = r.seconds_spent;
        }
    }

    let all_days: Vec<NaiveDate> = sqlx::query_scalar!(
        "SELECT day FROM reading_sessions WHERE user_id = $1 AND seconds_spent > 0 ORDER BY day DESC",
        auth.user_id
    )
    .fetch_all(&state.db)
    .await?;

    let (current_streak, longest_streak) = compute_streaks(&all_days, today);

    let recent_files: Vec<RecentFile> = sqlx::query_as!(
        RecentFile,
        r#"
        SELECT
            rp.file_id AS "file_id!",
            f.name AS "name!",
            rp.section_index AS "section_index!",
            rp.scroll_pct AS "scroll_pct!",
            rp.updated_at AS "updated_at!"
        FROM reading_progress rp
        JOIN files f ON f.id = rp.file_id
        WHERE rp.user_id = $1
        ORDER BY rp.updated_at DESC
        LIMIT 10
        "#,
        auth.user_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(StatsSummary {
        total_seconds,
        files_completed,
        current_streak,
        longest_streak,
        last_7_days,
        recent_files,
    }))
}

/// Compute (current, longest) streaks from a set of days that had reading activity.
///
/// `days` must be sorted descending. The current streak counts consecutive days
/// ending today or yesterday (a one-day grace so the streak doesn't break before
/// the user reads on the new day).
fn compute_streaks(days: &[NaiveDate], today: NaiveDate) -> (i32, i32) {
    if days.is_empty() {
        return (0, 0);
    }

    let yesterday = today - Duration::days(1);
    let mut current = 0i32;
    if days[0] == today || days[0] == yesterday {
        current = 1;
        let mut prev = days[0];
        for &d in &days[1..] {
            if d == prev - Duration::days(1) {
                current += 1;
                prev = d;
            } else {
                break;
            }
        }
    }

    let mut longest = 1i32;
    let mut run = 1i32;
    for w in days.windows(2) {
        if w[0] == w[1] + Duration::days(1) {
            run += 1;
            if run > longest {
                longest = run;
            }
        } else {
            run = 1;
        }
    }

    (current, longest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use chrono::NaiveDate;
    use serde_json::{Value, json};
    use sqlx::PgPool;
    use tower::ServiceExt;
    use uuid::Uuid;

    use crate::testutil::{create_test_user, get_json, post_json, test_state};

    async fn seed_file(db: &PgPool, user_id: Uuid, name: &str) -> Uuid {
        sqlx::query_scalar!(
            "INSERT INTO files (user_id, name, path, storage_key) VALUES ($1, $2, $3, $4) RETURNING id",
            user_id,
            name,
            format!("/test/{}", Uuid::new_v4()),
            format!("key/{}", Uuid::new_v4()),
        )
        .fetch_one(db)
        .await
        .unwrap()
    }

    #[test]
    fn streaks_empty_returns_zero() {
        let today = NaiveDate::from_ymd_opt(2026, 1, 10).unwrap();
        assert_eq!(compute_streaks(&[], today), (0, 0));
    }

    #[test]
    fn streaks_today_counts_one() {
        let today = NaiveDate::from_ymd_opt(2026, 1, 10).unwrap();
        assert_eq!(compute_streaks(&[today], today), (1, 1));
    }

    #[test]
    fn streaks_yesterday_only_grace_period() {
        let today = NaiveDate::from_ymd_opt(2026, 1, 10).unwrap();
        let yesterday = today - Duration::days(1);
        assert_eq!(compute_streaks(&[yesterday], today), (1, 1));
    }

    #[test]
    fn streaks_three_consecutive_ending_today() {
        let today = NaiveDate::from_ymd_opt(2026, 1, 10).unwrap();
        let days = vec![today, today - Duration::days(1), today - Duration::days(2)];
        assert_eq!(compute_streaks(&days, today), (3, 3));
    }

    #[test]
    fn streaks_broken_current_zero_but_longest_preserved() {
        let today = NaiveDate::from_ymd_opt(2026, 1, 10).unwrap();
        // Last activity was 5 days ago; before that, 3 consecutive days.
        let days = vec![
            today - Duration::days(5),
            today - Duration::days(6),
            today - Duration::days(7),
        ];
        let (cur, longest) = compute_streaks(&days, today);
        assert_eq!(cur, 0);
        assert_eq!(longest, 3);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn post_without_token_returns_401(db: PgPool) {
        let app = super::router().with_state(test_state(db));

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/progress")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(json!({"entries": []}).to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn post_empty_batch_returns_204(db: PgPool) {
        let (_user_id, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let (status, _) = post_json(app, "/progress", &token, json!({ "entries": [] })).await;
        assert_eq!(status, StatusCode::NO_CONTENT);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn post_invalid_scroll_pct_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "a.md").await;
        let app = super::router().with_state(test_state(db));

        let body = json!({
            "entries": [{
                "file_id": file_id,
                "section_index": 0,
                "scroll_pct": 1.5,
                "seconds_delta": 5
            }]
        });
        let (status, _) = post_json(app, "/progress", &token, body).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn post_negative_seconds_returns_400(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "a.md").await;
        let app = super::router().with_state(test_state(db));

        let body = json!({
            "entries": [{
                "file_id": file_id,
                "section_index": 0,
                "scroll_pct": 0.5,
                "seconds_delta": -1
            }]
        });
        let (status, _) = post_json(app, "/progress", &token, body).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn post_foreign_file_returns_404(db: PgPool) {
        let (user_id, _) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "a.md").await;
        let (_other, other_token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let body = json!({
            "entries": [{
                "file_id": file_id,
                "section_index": 0,
                "scroll_pct": 0.0,
                "seconds_delta": 5
            }]
        });
        let (status, _) = post_json(app, "/progress", &other_token, body).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn post_then_get_returns_accumulated_progress(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "a.md").await;
        let app = super::router().with_state(test_state(db.clone()));

        let body = json!({
            "entries": [{
                "file_id": file_id,
                "section_index": 2,
                "scroll_pct": 0.4,
                "seconds_delta": 30
            }]
        });
        let (s1, _) = post_json(app.clone(), "/progress", &token, body).await;
        assert_eq!(s1, StatusCode::NO_CONTENT);

        let body2 = json!({
            "entries": [{
                "file_id": file_id,
                "section_index": 5,
                "scroll_pct": 0.1,
                "seconds_delta": 20
            }]
        });
        let (s2, _) = post_json(app.clone(), "/progress", &token, body2).await;
        assert_eq!(s2, StatusCode::NO_CONTENT);

        let (status, body): (StatusCode, Value) =
            get_json(app, &format!("/progress/{file_id}"), &token).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["section_index"], 5);
        assert_eq!(body["seconds_spent"], 50);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn anchor_round_trips_through_get(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "a.md").await;
        let app = super::router().with_state(test_state(db.clone()));

        let body = json!({
            "entries": [{
                "file_id": file_id,
                "section_index": 1,
                "scroll_pct": 0.42,
                "seconds_delta": 3,
                "anchor_heading_path": ["setup", "database"],
                "anchor_block_offset": 2,
                "anchor_block_tag": "p",
                "anchor_block_hash": "deadbeef"
            }]
        });
        let (s, _) = post_json(app.clone(), "/progress", &token, body).await;
        assert_eq!(s, StatusCode::NO_CONTENT);

        let (status, body): (StatusCode, Value) =
            get_json(app, &format!("/progress/{file_id}"), &token).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["anchor_heading_path"][0], "setup");
        assert_eq!(body["anchor_heading_path"][1], "database");
        assert_eq!(body["anchor_block_offset"], 2);
        assert_eq!(body["anchor_block_tag"], "p");
        assert_eq!(body["anchor_block_hash"], "deadbeef");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn anchor_persists_across_card_mode_flush(db: PgPool) {
        // Card-mode entries omit anchor fields; the previously-saved anchor must
        // survive (COALESCE on update) so a round-trip back to scroll mode resumes
        // at the right block, not the section start.
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "a.md").await;
        let app = super::router().with_state(test_state(db.clone()));

        post_json(
            app.clone(),
            "/progress",
            &token,
            json!({
                "entries": [{
                    "file_id": file_id,
                    "section_index": 1,
                    "scroll_pct": 0.42,
                    "seconds_delta": 1,
                    "anchor_heading_path": ["intro"],
                    "anchor_block_offset": 4,
                    "anchor_block_tag": "p",
                    "anchor_block_hash": "abc12345"
                }]
            }),
        )
        .await;

        // Card-mode-style flush — no anchor fields.
        post_json(
            app.clone(),
            "/progress",
            &token,
            json!({
                "entries": [{
                    "file_id": file_id,
                    "section_index": 2,
                    "scroll_pct": 0.0,
                    "seconds_delta": 1
                }]
            }),
        )
        .await;

        let (_, body): (StatusCode, Value) =
            get_json(app, &format!("/progress/{file_id}"), &token).await;
        assert_eq!(body["anchor_block_offset"], 4);
        assert_eq!(body["anchor_block_hash"], "abc12345");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn completed_flag_sets_completed_at(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let file_id = seed_file(&db, user_id, "a.md").await;
        let app = super::router().with_state(test_state(db.clone()));

        let body = json!({
            "entries": [{
                "file_id": file_id,
                "section_index": 9,
                "scroll_pct": 1.0,
                "seconds_delta": 10,
                "completed": true
            }]
        });
        let (s, _) = post_json(app.clone(), "/progress", &token, body).await;
        assert_eq!(s, StatusCode::NO_CONTENT);

        let (_, body): (StatusCode, Value) =
            get_json(app, &format!("/progress/{file_id}"), &token).await;
        assert!(
            body["completed_at"].is_string(),
            "completed_at should be set"
        );
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn list_progress_returns_user_rows_only(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "one.md").await;
        let f2 = seed_file(&db, user_id, "two.md").await;
        let (other, _other_token) = create_test_user(&db).await;
        let f_other = seed_file(&db, other, "other.md").await;

        let app = super::router().with_state(test_state(db.clone()));
        let body = json!({
            "entries": [
                {"file_id": f1, "section_index": 0, "scroll_pct": 0.0, "seconds_delta": 5},
                {"file_id": f2, "section_index": 1, "scroll_pct": 0.5, "seconds_delta": 7}
            ]
        });
        post_json(app.clone(), "/progress", &token, body).await;

        // Other user writes to their own file (not visible to us).
        let (_, other_token) = (
            other,
            crate::auth::jwt::create_token(other, "test-secret", 7).unwrap(),
        );
        let body_other = json!({
            "entries": [{"file_id": f_other, "section_index": 0, "scroll_pct": 0.0, "seconds_delta": 5}]
        });
        post_json(app.clone(), "/progress", &other_token, body_other).await;

        let (status, body): (StatusCode, Value) = get_json(app, "/progress", &token).await;
        assert_eq!(status, StatusCode::OK);
        let arr = body.as_array().unwrap();
        assert_eq!(arr.len(), 2);
        let ids: Vec<String> = arr
            .iter()
            .map(|v| v["file_id"].as_str().unwrap().to_string())
            .collect();
        assert!(ids.contains(&f1.to_string()));
        assert!(ids.contains(&f2.to_string()));
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn get_progress_for_unknown_file_returns_404(db: PgPool) {
        let (_user_id, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let missing = Uuid::new_v4();
        let (status, _) = get_json(app, &format!("/progress/{missing}"), &token).await;
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn stats_summary_shape_with_no_data(db: PgPool) {
        let (_user_id, token) = create_test_user(&db).await;
        let app = super::router().with_state(test_state(db));

        let (status, body): (StatusCode, Value) = get_json(app, "/stats/summary", &token).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["total_seconds"], 0);
        assert_eq!(body["files_completed"], 0);
        assert_eq!(body["current_streak"], 0);
        assert_eq!(body["longest_streak"], 0);
        assert_eq!(body["last_7_days"].as_array().unwrap().len(), 7);
        assert_eq!(body["recent_files"].as_array().unwrap().len(), 0);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn stats_summary_aggregates_seconds_and_recent_files(db: PgPool) {
        let (user_id, token) = create_test_user(&db).await;
        let f1 = seed_file(&db, user_id, "one.md").await;
        let app = super::router().with_state(test_state(db));

        let body = json!({
            "entries": [{
                "file_id": f1,
                "section_index": 3,
                "scroll_pct": 0.2,
                "seconds_delta": 45,
                "completed": true
            }]
        });
        post_json(app.clone(), "/progress", &token, body).await;

        let (status, body): (StatusCode, Value) = get_json(app, "/stats/summary", &token).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["total_seconds"], 45);
        assert_eq!(body["files_completed"], 1);
        assert_eq!(body["current_streak"], 1);
        let recent = body["recent_files"].as_array().unwrap();
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0]["name"], "one.md");
        assert_eq!(recent[0]["section_index"], 3);
    }
}
