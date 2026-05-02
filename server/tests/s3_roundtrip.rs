//! End-to-end S3 tests for the `storage` module and the `/api/files` handlers.
//!
//! Every test in this file is gated on `S3_INTEGRATION_TESTS=1` so the default
//! `cargo test` run remains hermetic. When the var is unset, each test early-returns
//! with no assertions.
//!
//! ## Running
//!
//! ```bash
//! docker compose -f docker-compose.dev.yml up -d minio
//! S3_INTEGRATION_TESTS=1 cargo test --test s3_roundtrip
//! ```
//!
//! ## Cleanup
//!
//! Each test creates a unique `test-<uuid>` bucket and best-effort purges it at the
//! end. A panicking test will leak its bucket — treat `MinIO` as ephemeral and reset
//! the container when needed (`docker compose down -v`).

mod common;

use axum::body::Body;
use axum::http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use sqlx::PgPool;
use uuid::Uuid;

use common::{
    DEFAULT_TEST_PEER, app_with_s3, create_test_bucket, create_test_user, minio_s3, purge_bucket,
    s3_integration_enabled, send,
};
use mdhd_server::storage::{delete_object, download_object, upload_object};

// ---------------------------------------------------------------------------
// Layer 1 — direct storage module roundtrip.
// Catches regressions in the `storage` functions themselves (wrong content-type,
// body encoding, error mapping) without going through the HTTP stack.
// ---------------------------------------------------------------------------

#[tokio::test]
async fn storage_module_upload_download_delete_roundtrip() {
    if !s3_integration_enabled() {
        return;
    }

    let s3 = minio_s3();
    let bucket = create_test_bucket(&s3).await;
    let key = format!("roundtrip/{}", Uuid::new_v4());
    let payload = b"# hello\n\nbody bytes".to_vec();

    upload_object(&s3, &bucket, &key, payload.clone())
        .await
        .expect("upload");

    let got = download_object(&s3, &bucket, &key).await.expect("download");
    assert_eq!(got, payload, "downloaded bytes must match uploaded bytes");

    delete_object(&s3, &bucket, &key).await.expect("delete");

    let after = download_object(&s3, &bucket, &key).await;
    assert!(
        after.is_err(),
        "download after delete must fail, got Ok({:?} bytes)",
        after.map(|b| b.len())
    );

    purge_bucket(&s3, &bucket).await;
}

#[tokio::test]
async fn storage_module_upload_overwrites_existing_key() {
    if !s3_integration_enabled() {
        return;
    }

    let s3 = minio_s3();
    let bucket = create_test_bucket(&s3).await;
    let key = format!("overwrite/{}", Uuid::new_v4());

    upload_object(&s3, &bucket, &key, b"first".to_vec())
        .await
        .expect("first upload");
    upload_object(&s3, &bucket, &key, b"second".to_vec())
        .await
        .expect("overwrite");

    let got = download_object(&s3, &bucket, &key).await.expect("download");
    assert_eq!(got, b"second", "second upload must overwrite the first");

    purge_bucket(&s3, &bucket).await;
}

// ---------------------------------------------------------------------------
// Layer 2 — HTTP handler roundtrip.
// Catches regressions in the wiring between the `/api/files` handlers and the
// storage module (wrong bucket, wrong key derivation, missing delete call).
// ---------------------------------------------------------------------------

/// Builds an authorized request with the default forwarded-IP header so the
/// production rate-limit middleware can derive a key.
fn authed(method: Method, uri: &str, token: &str, body: Body) -> Request<Body> {
    Request::builder()
        .method(method)
        .uri(uri)
        .header(header::AUTHORIZATION, format!("Bearer {token}"))
        .header("X-Forwarded-For", DEFAULT_TEST_PEER)
        .header(header::CONTENT_TYPE, "application/json")
        .body(body)
        .unwrap()
}

#[sqlx::test(migrations = "./migrations")]
async fn post_files_uploads_to_s3_and_content_endpoint_reads_it_back(db: PgPool) {
    if !s3_integration_enabled() {
        return;
    }

    let s3 = minio_s3();
    let bucket = create_test_bucket(&s3).await;
    let (_uid, token) = create_test_user(&db).await;
    let app = app_with_s3(db, s3.clone(), bucket.clone());

    let content = "# integration\n\nround-trip body";
    let body = json!({ "name": "r.md", "path": "/r.md", "content": content });

    let (post_status, post_bytes) = send(
        app.clone(),
        authed(
            Method::POST,
            "/api/files",
            &token,
            Body::from(body.to_string()),
        ),
    )
    .await;
    assert_eq!(
        post_status,
        StatusCode::CREATED,
        "POST /api/files should 201"
    );

    let file_id = serde_json::from_slice::<Value>(&post_bytes).expect("json")["id"]
        .as_str()
        .expect("id field")
        .to_string();

    let (get_status, get_bytes) = send(
        app.clone(),
        authed(
            Method::GET,
            &format!("/api/files/{file_id}/content"),
            &token,
            Body::empty(),
        ),
    )
    .await;
    assert_eq!(get_status, StatusCode::OK, "GET content should succeed");
    assert_eq!(
        get_bytes,
        content.as_bytes(),
        "content endpoint must return what was uploaded",
    );

    purge_bucket(&s3, &bucket).await;
}

#[sqlx::test(migrations = "./migrations")]
async fn delete_file_removes_object_from_s3(db: PgPool) {
    if !s3_integration_enabled() {
        return;
    }

    let s3 = minio_s3();
    let bucket = create_test_bucket(&s3).await;
    let (_uid, token) = create_test_user(&db).await;
    let app = app_with_s3(db.clone(), s3.clone(), bucket.clone());

    let body = json!({ "name": "d.md", "path": "/d.md", "content": "# delete me" });
    let (post_status, post_bytes) = send(
        app.clone(),
        authed(
            Method::POST,
            "/api/files",
            &token,
            Body::from(body.to_string()),
        ),
    )
    .await;
    assert_eq!(post_status, StatusCode::CREATED);
    let parsed: Value = serde_json::from_slice(&post_bytes).expect("json");
    let file_id: Uuid = parsed["id"].as_str().expect("id").parse().expect("uuid");

    // `storage_key` is not serialized in the public response (internal detail),
    // so look it up via the DB to verify the S3 side-effect.
    let storage_key: String = sqlx::query_scalar("SELECT storage_key FROM files WHERE id = $1")
        .bind(file_id)
        .fetch_one(&db)
        .await
        .expect("fetch storage_key");

    // Sanity: the object really exists in S3 before the delete.
    download_object(&s3, &bucket, &storage_key)
        .await
        .expect("object should exist before DELETE");

    let (del_status, _) = send(
        app.clone(),
        authed(
            Method::DELETE,
            &format!("/api/files/{file_id}"),
            &token,
            Body::empty(),
        ),
    )
    .await;
    assert_eq!(del_status, StatusCode::NO_CONTENT, "DELETE should 204");

    // The object must be gone from S3 — this is the assertion that would have
    // caught a handler that deleted the DB row but forgot the S3 call.
    let after = download_object(&s3, &bucket, &storage_key).await;
    assert!(
        after.is_err(),
        "S3 object must be deleted after DELETE /api/files/:id",
    );

    purge_bucket(&s3, &bucket).await;
}
