use aws_sdk_s3::Client;
use aws_sdk_s3::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_s3::primitives::ByteStream;

use crate::config::Config;
use crate::errors::{AppError, ResultExt};

/// Uploads an object to S3. Overwrites any existing object at the same key.
pub async fn upload_object(
    s3: &Client,
    bucket: &str,
    key: &str,
    body: Vec<u8>,
) -> Result<(), AppError> {
    s3.put_object()
        .bucket(bucket)
        .key(key)
        .content_type("text/markdown; charset=utf-8")
        .body(ByteStream::from(body))
        .send()
        .await
        .internal("S3 upload failed")?;
    Ok(())
}

/// Downloads an object from S3, returning its full body as bytes.
pub async fn download_object(s3: &Client, bucket: &str, key: &str) -> Result<Vec<u8>, AppError> {
    let output = s3
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .internal("S3 download failed")?;

    let bytes = output
        .body
        .collect()
        .await
        .internal("S3 body read failed")?
        .into_bytes()
        .to_vec();

    Ok(bytes)
}

/// Deletes an object from S3. Succeeds even if the key does not exist.
pub async fn delete_object(s3: &Client, bucket: &str, key: &str) -> Result<(), AppError> {
    s3.delete_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .internal("S3 delete failed")?;
    Ok(())
}

/// Creates an S3 client configured for Supabase Storage (or `MinIO` in local dev).
pub fn create_s3_client(config: &Config) -> Client {
    let credentials = Credentials::new(
        &config.supabase_s3_access_key,
        &config.supabase_s3_secret_key,
        None,
        None,
        "supabase",
    );

    let s3_config = aws_sdk_s3::Config::builder()
        .behavior_version(BehaviorVersion::latest())
        .region(Region::new("us-east-1")) // Supabase ignores region, but the SDK requires one
        .endpoint_url(&config.supabase_s3_endpoint)
        .credentials_provider(credentials)
        .force_path_style(true) // Required for Supabase S3 compatibility
        .build();

    Client::from_conf(s3_config)
}

#[cfg(test)]
mod tests {
    use super::*;
    use aws_sdk_s3::types::{Delete, ObjectIdentifier};
    use uuid::Uuid;

    /// Returns `true` when the integration test suite should run.
    ///
    /// Set `S3_INTEGRATION_TESTS=1` and ensure `MinIO` is running (`docker compose up minio`).
    fn integration_enabled() -> bool {
        std::env::var("S3_INTEGRATION_TESTS").is_ok()
    }

    /// Builds an S3 client pointed at the local `MinIO` instance.
    ///
    /// Reads `SUPABASE_S3_ENDPOINT`, `SUPABASE_S3_ACCESS_KEY`, and
    /// `SUPABASE_S3_SECRET_KEY` from the environment, falling back to the
    /// standard `MinIO` dev defaults if any are unset.
    fn make_test_client() -> Client {
        let endpoint = std::env::var("SUPABASE_S3_ENDPOINT")
            .unwrap_or_else(|_| "http://localhost:9000".into());
        let access_key =
            std::env::var("SUPABASE_S3_ACCESS_KEY").unwrap_or_else(|_| "minioadmin".into());
        let secret_key =
            std::env::var("SUPABASE_S3_SECRET_KEY").unwrap_or_else(|_| "minioadmin".into());

        let credentials = Credentials::new(&access_key, &secret_key, None, None, "test");
        let config = aws_sdk_s3::Config::builder()
            .behavior_version(BehaviorVersion::latest())
            .region(Region::new("us-east-1"))
            .endpoint_url(endpoint)
            .credentials_provider(credentials)
            .force_path_style(true)
            .build();

        Client::from_conf(config)
    }

    /// Creates a uniquely named bucket and returns the client + bucket name.
    ///
    /// Each call produces a `test-{uuid}` bucket so concurrent tests never collide.
    async fn setup_bucket() -> (Client, String) {
        let client = make_test_client();
        let bucket = format!("test-{}", Uuid::new_v4());
        client
            .create_bucket()
            .bucket(&bucket)
            .send()
            .await
            .expect("failed to create test bucket");
        (client, bucket)
    }

    /// Deletes all objects in `bucket` and then deletes the bucket itself.
    ///
    /// S3 requires the bucket to be empty before it can be deleted.
    /// This helper handles pagination up to 1 000 objects — sufficient for tests.
    async fn teardown_bucket(client: &Client, bucket: &str) {
        let list = client
            .list_objects_v2()
            .bucket(bucket)
            .send()
            .await
            .expect("failed to list objects for teardown");

        if let Some(contents) = list.contents
            && !contents.is_empty()
        {
            let identifiers: Vec<ObjectIdentifier> = contents
                .into_iter()
                .filter_map(|obj| {
                    obj.key.map(|k| {
                        ObjectIdentifier::builder()
                            .key(k)
                            .build()
                            .expect("invalid object identifier")
                    })
                })
                .collect();

            let delete = Delete::builder()
                .set_objects(Some(identifiers))
                .build()
                .expect("invalid delete request");

            client
                .delete_objects()
                .bucket(bucket)
                .delete(delete)
                .send()
                .await
                .expect("failed to delete objects during teardown");
        }

        client
            .delete_bucket()
            .bucket(bucket)
            .send()
            .await
            .expect("failed to delete test bucket");
    }

    #[tokio::test]
    async fn upload_then_download_roundtrip() {
        if !integration_enabled() {
            return;
        }
        let (client, bucket) = setup_bucket().await;

        upload_object(&client, &bucket, "hello.md", b"# Hello World".to_vec())
            .await
            .unwrap();

        let bytes = download_object(&client, &bucket, "hello.md").await.unwrap();
        assert_eq!(bytes, b"# Hello World");

        teardown_bucket(&client, &bucket).await;
    }

    #[tokio::test]
    async fn upload_overwrites_existing_object() {
        if !integration_enabled() {
            return;
        }
        let (client, bucket) = setup_bucket().await;

        upload_object(&client, &bucket, "doc.md", b"version 1".to_vec())
            .await
            .unwrap();
        upload_object(&client, &bucket, "doc.md", b"version 2".to_vec())
            .await
            .unwrap();

        let bytes = download_object(&client, &bucket, "doc.md").await.unwrap();
        assert_eq!(bytes, b"version 2");

        teardown_bucket(&client, &bucket).await;
    }

    #[tokio::test]
    async fn download_nonexistent_key_returns_error() {
        if !integration_enabled() {
            return;
        }
        let (client, bucket) = setup_bucket().await;

        let result = download_object(&client, &bucket, "does-not-exist.md").await;
        assert!(result.is_err());

        teardown_bucket(&client, &bucket).await;
    }

    #[tokio::test]
    async fn delete_removes_object() {
        if !integration_enabled() {
            return;
        }
        let (client, bucket) = setup_bucket().await;

        upload_object(&client, &bucket, "temp.md", b"temporary".to_vec())
            .await
            .unwrap();
        delete_object(&client, &bucket, "temp.md").await.unwrap();

        let result = download_object(&client, &bucket, "temp.md").await;
        assert!(result.is_err());

        teardown_bucket(&client, &bucket).await;
    }

    #[tokio::test]
    async fn delete_nonexistent_key_succeeds() {
        if !integration_enabled() {
            return;
        }
        let (client, bucket) = setup_bucket().await;

        // S3 delete is idempotent — missing keys must not produce an error
        delete_object(&client, &bucket, "ghost.md").await.unwrap();

        teardown_bucket(&client, &bucket).await;
    }

    #[tokio::test]
    async fn upload_preserves_binary_content_exactly() {
        if !integration_enabled() {
            return;
        }
        let (client, bucket) = setup_bucket().await;

        // Verify that non-ASCII bytes survive the round-trip without corruption
        let content: Vec<u8> = (0u8..=255).collect();
        upload_object(&client, &bucket, "binary.bin", content.clone())
            .await
            .unwrap();

        let bytes = download_object(&client, &bucket, "binary.bin")
            .await
            .unwrap();
        assert_eq!(bytes, content);

        teardown_bucket(&client, &bucket).await;
    }
}
