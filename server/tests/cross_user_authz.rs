//! Integration tests for cross-user authorization on the `/api/files` resource.
//!
//! Guards against the "IDOR" (insecure direct object reference) class of bugs:
//! user A must not be able to read or delete user B's files merely by guessing
//! a file UUID.
//!
//! The handlers return `404 Not Found` (not `403 Forbidden`) on foreign access
//! — that is a deliberate choice to avoid leaking existence, and these tests
//! pin that contract.

mod common;

use axum::http::StatusCode;
use sqlx::PgPool;
use uuid::Uuid;

use common::{app_with_db, create_test_user, get_json};

/// Seeds a file directly via SQL (bypassing S3) for tests that only care about
/// metadata-level authorization. Mirrors the helper used in `routes::files` unit
/// tests.
async fn seed_file(db: &PgPool, user_id: Uuid, path: &str) -> Uuid {
    sqlx::query_scalar(
        r"
        INSERT INTO files (user_id, name, path, storage_key, size_bytes, content_text, search_content)
        VALUES ($1, $2, $3, $4, $5, $6, to_tsvector('english', $6))
        RETURNING id
        ",
    )
    .bind(user_id)
    .bind(path.rsplit('/').next().unwrap_or("f.md"))
    .bind(path)
    .bind(format!("key/{}", Uuid::new_v4()))
    .bind::<i64>(10)
    .bind("hello")
    .fetch_one(db)
    .await
    .expect("seed file")
}

#[sqlx::test(migrations = "./migrations")]
async fn list_files_does_not_leak_across_users(db: PgPool) {
    let (alice, alice_token) = create_test_user(&db).await;
    let (bob, _bob_token) = create_test_user(&db).await;

    seed_file(&db, alice, "/alice/a.md").await;
    seed_file(&db, bob, "/bob/secret.md").await;
    seed_file(&db, bob, "/bob/other.md").await;

    let app = app_with_db(db);
    let (status, body) = get_json(app, "/api/files", &alice_token).await;

    assert_eq!(status, StatusCode::OK);
    let arr = body.as_array().expect("array body");
    assert_eq!(arr.len(), 1, "alice should only see her own file");
    assert_eq!(arr[0]["path"], "/alice/a.md");
}

#[sqlx::test(migrations = "./migrations")]
async fn get_foreign_file_returns_404_not_403(db: PgPool) {
    let (alice, _alice_token) = create_test_user(&db).await;
    let (_bob, bob_token) = create_test_user(&db).await;

    let alice_file = seed_file(&db, alice, "/alice/private.md").await;

    let app = app_with_db(db);
    let (status, _) = get_json(app, &format!("/api/files/{alice_file}"), &bob_token).await;

    // Contract: 404 rather than 403 — do not confirm the file's existence to
    // an unauthorized caller.
    assert_eq!(
        status,
        StatusCode::NOT_FOUND,
        "foreign access must return 404 (existence-hiding), not 403"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn owner_can_get_their_own_file(db: PgPool) {
    let (alice, alice_token) = create_test_user(&db).await;
    let file_id = seed_file(&db, alice, "/alice/mine.md").await;

    let app = app_with_db(db);
    let (status, body) = get_json(app, &format!("/api/files/{file_id}"), &alice_token).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["id"], file_id.to_string());
    assert_eq!(body["path"], "/alice/mine.md");
    assert!(
        body.get("user_id").is_none(),
        "user_id must not be serialized in the public response"
    );
}

#[sqlx::test(migrations = "./migrations")]
async fn search_is_scoped_to_requesting_user(db: PgPool) {
    let (alice, alice_token) = create_test_user(&db).await;
    let (bob, _) = create_test_user(&db).await;

    // Both users have a file containing the same rare token.
    sqlx::query(
        r"
        INSERT INTO files (user_id, name, path, storage_key, size_bytes, content_text, search_content)
        VALUES ($1, 'a.md', '/a.md', 'k1', 5, 'xyzzy unique', to_tsvector('english', 'xyzzy unique')),
               ($2, 'b.md', '/b.md', 'k2', 5, 'xyzzy unique', to_tsvector('english', 'xyzzy unique'))
        ",
    )
    .bind(alice)
    .bind(bob)
    .execute(&db)
    .await
    .expect("seed files");

    let app = app_with_db(db);
    let (status, body) = get_json(app, "/api/files/search?q=xyzzy", &alice_token).await;

    assert_eq!(status, StatusCode::OK);
    let results = body["results"].as_array().expect("results array");
    assert_eq!(
        results.len(),
        1,
        "search must not return other users' files even when content matches"
    );
}
