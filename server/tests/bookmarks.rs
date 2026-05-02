//! Integration tests for `/api/files/:id/bookmarks` through the full app stack.
//!
//! The inline `#[sqlx::test]` suite in `routes::bookmarks` already covers handler
//! behavior (validation, upsert, per-handler IDOR). These tests intentionally do
//! NOT duplicate that — they mount the full app via [`common::app_with_db`] and
//! pin the things that only break end-to-end:
//!
//! 1. The `/api` nest prefix + global JWT auth layer are wired correctly.
//! 2. Cross-user 404 (not 403) contract holds under the full middleware stack.
//! 3. The composite uniqueness key is `(user_id, file_id, section_index)` — not
//!    `(user_id, section_index)` — so the same index can be bookmarked across two
//!    files.
//! 4. `ON DELETE CASCADE` on `bookmarks.file_id` removes bookmarks when the
//!    parent file is deleted.

mod common;

use axum::http::StatusCode;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use common::{app_with_db, create_test_user, delete_req, get_json, post_json};

/// Seeds a file owned by `user_id`. Mirrors the helper in `cross_user_authz.rs`
/// so these tests stay metadata-only (no S3 traffic).
async fn seed_file(db: &PgPool, user_id: Uuid) -> Uuid {
    sqlx::query_scalar(
        r"
        INSERT INTO files (user_id, name, path, storage_key, size_bytes, content_text, search_content)
        VALUES ($1, $2, $3, $4, $5, $6, to_tsvector('english', $6))
        RETURNING id
        ",
    )
    .bind(user_id)
    .bind("test.md")
    .bind(format!("/test/{}", Uuid::new_v4()))
    .bind(format!("key/{}", Uuid::new_v4()))
    .bind::<i64>(10)
    .bind("hello")
    .fetch_one(db)
    .await
    .expect("seed file")
}

/// Full CRUD loop against the mounted `/api` prefix. Proves the nest in
/// `routes::mod` and the global auth layer in `lib.rs` are both wired.
#[sqlx::test(migrations = "./migrations")]
async fn full_crud_roundtrip_through_api_prefix(db: PgPool) {
    let (user_id, token) = create_test_user(&db).await;
    let file_id = seed_file(&db, user_id).await;
    let app = app_with_db(db);

    let (status, created) = post_json(
        app.clone(),
        &format!("/api/files/{file_id}/bookmarks"),
        &token,
        json!({ "section_index": 4, "name": "Intro" }),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let bookmark_id = created["id"].as_str().expect("id in response");

    let (status, list) = get_json(
        app.clone(),
        &format!("/api/files/{file_id}/bookmarks"),
        &token,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list.as_array().unwrap().len(), 1);
    assert_eq!(list[0]["name"], "Intro");

    let status = delete_req(
        app.clone(),
        &format!("/api/files/{file_id}/bookmarks/{bookmark_id}"),
        &token,
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, list) = get_json(app, &format!("/api/files/{file_id}/bookmarks"), &token).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list.as_array().unwrap().len(), 0);
}

/// All three verbs return 404 (not 403) when the caller does not own the file.
/// Pins the existence-hiding contract through the full middleware stack.
#[sqlx::test(migrations = "./migrations")]
async fn foreign_user_gets_404_on_all_verbs(db: PgPool) {
    let (alice, alice_token) = create_test_user(&db).await;
    let (_bob, bob_token) = create_test_user(&db).await;
    let alice_file = seed_file(&db, alice).await;
    let app = app_with_db(db);

    let (_, created) = post_json(
        app.clone(),
        &format!("/api/files/{alice_file}/bookmarks"),
        &alice_token,
        json!({ "section_index": 0, "name": "mine" }),
    )
    .await;
    let alice_bookmark = created["id"].as_str().unwrap().to_string();

    let (status, _) = get_json(
        app.clone(),
        &format!("/api/files/{alice_file}/bookmarks"),
        &bob_token,
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND, "list should 404 for Bob");

    let (status, _) = post_json(
        app.clone(),
        &format!("/api/files/{alice_file}/bookmarks"),
        &bob_token,
        json!({ "section_index": 1, "name": "pwn" }),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND, "create should 404 for Bob");

    let status = delete_req(
        app,
        &format!("/api/files/{alice_file}/bookmarks/{alice_bookmark}"),
        &bob_token,
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND, "delete should 404 for Bob");
}

/// The unique constraint is composite on `(user_id, file_id, section_index)`.
/// Two files owned by the same user must each accept a bookmark at index 0.
#[sqlx::test(migrations = "./migrations")]
async fn same_section_index_across_two_files_is_allowed(db: PgPool) {
    let (user_id, token) = create_test_user(&db).await;
    let file_a = seed_file(&db, user_id).await;
    let file_b = seed_file(&db, user_id).await;
    let app = app_with_db(db);

    let (status_a, _) = post_json(
        app.clone(),
        &format!("/api/files/{file_a}/bookmarks"),
        &token,
        json!({ "section_index": 0, "name": "A" }),
    )
    .await;
    let (status_b, _) = post_json(
        app,
        &format!("/api/files/{file_b}/bookmarks"),
        &token,
        json!({ "section_index": 0, "name": "B" }),
    )
    .await;

    assert_eq!(status_a, StatusCode::CREATED);
    assert_eq!(status_b, StatusCode::CREATED);
}

/// `ON DELETE CASCADE` on `bookmarks.file_id`: removing the parent file row
/// must remove its bookmarks. Exercises the migration contract — uses raw SQL
/// for the delete to avoid the S3 call in `DELETE /api/files/:id` (dummy credentials).
#[sqlx::test(migrations = "./migrations")]
async fn deleting_file_cascades_to_bookmarks(db: PgPool) {
    let (user_id, token) = create_test_user(&db).await;
    let file_id = seed_file(&db, user_id).await;
    let app = app_with_db(db.clone());

    post_json(
        app,
        &format!("/api/files/{file_id}/bookmarks"),
        &token,
        json!({ "section_index": 0, "name": "doomed" }),
    )
    .await;

    let before: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM bookmarks WHERE file_id = $1")
        .bind(file_id)
        .fetch_one(&db)
        .await
        .unwrap();
    assert_eq!(before, 1);

    sqlx::query("DELETE FROM files WHERE id = $1")
        .bind(file_id)
        .execute(&db)
        .await
        .unwrap();

    let after: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM bookmarks WHERE file_id = $1")
        .bind(file_id)
        .fetch_one(&db)
        .await
        .unwrap();
    assert_eq!(after, 0, "ON DELETE CASCADE should have removed bookmarks");
}
