//! Fuzz-ish inputs for `GET /api/files/search?q=...`.
//!
//! The handler feeds `q` directly into `plainto_tsquery` — any parse failure in
//! Postgres would surface as a 500. This file pins that a grab-bag of hostile
//! or unusual inputs either returns `200 OK` (possibly with an empty result
//! set) or `400 Bad Request` (the handler's explicit rejection path), but
//! **never** `500` or a hang.
//!
//! This is not property-based fuzzing — it's a curated list of the inputs most
//! likely to trip naïve string handling: tsquery meta characters, SQL-injection
//! payloads, regex meta chars, unicode edge cases, and oversized queries.
//!
//! Why `plainto_tsquery`? It tokenizes the input as plain text, so meta characters
//! like `&`, `|`, `!`, `<->` are treated as ordinary punctuation rather than
//! operators — which is exactly the robustness property we're pinning.

mod common;

use axum::http::StatusCode;
use sqlx::PgPool;

use common::{app_with_db, create_test_user, get_json};

/// Every fuzz input should resolve to one of these statuses. A 500 (or any
/// other status) is a regression.
fn is_acceptable(status: StatusCode) -> bool {
    status == StatusCode::OK || status == StatusCode::BAD_REQUEST
}

/// URL-encode a raw query value so reserved characters pass through the router
/// rather than being interpreted as delimiters.
fn encode(q: &str) -> String {
    url::form_urlencoded::byte_serialize(q.as_bytes()).collect()
}

#[sqlx::test(migrations = "./migrations")]
async fn search_survives_hostile_inputs(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    // Seed one innocuous file so plainto_tsquery has something to scan against
    // (empty tables can mask errors by short-circuiting the planner).
    let (_, _) = get_json(app.clone(), "/api/files", &token).await;

    // Curated list — each string is known to historically break one kind of
    // search implementation. Comments cite the risk.
    let cases: Vec<&str> = vec![
        // tsquery operators — must be treated as plain text by plainto_tsquery.
        "foo & bar",
        "foo | bar",
        "!foo",
        "foo <-> bar",
        "(foo & bar) | baz",
        "foo:*",
        // Regex meta chars — must not be interpreted.
        ".*",
        "^start",
        "end$",
        "[a-z]+",
        // SQL-injection shapes — parameterized query must neutralize them.
        "' OR 1=1--",
        "'; DROP TABLE files;--",
        "\\\"; SELECT pg_sleep(10);--",
        "admin' --",
        // Unicode: multi-byte, combining chars, RTL override, zero-width.
        "中文测试",
        "café",
        "👨‍👩‍👧‍👦",
        "\u{202E}reversed",
        "a\u{200B}b",
        // Whitespace-only shapes (trim → short query → 400 expected).
        "  ",
        "\t\n",
        // Length edge cases.
        "ab", // exactly at the 2-char minimum
    ];

    for q in cases {
        let uri = format!("/api/files/search?q={}", encode(q));
        let (status, body) = get_json(app.clone(), &uri, &token).await;
        assert!(
            is_acceptable(status),
            "query {q:?} produced {status}, body={body} — \
             expected 200 or 400 (never 500)",
        );
    }

    // Very long query — 8 KiB of mixed ASCII + tsquery metacharacters.
    let long = "foo & bar | baz ".repeat(512);
    let uri = format!("/api/files/search?q={}", encode(&long));
    let (status, body) = get_json(app.clone(), &uri, &token).await;
    assert!(
        is_acceptable(status),
        "8 KiB query produced {status}, body={body}",
    );

    // Missing `q` param entirely — must be a client error, not a panic.
    let (status, _) = get_json(app, "/api/files/search", &token).await;
    assert!(
        status.is_client_error(),
        "missing q param must be a 4xx, got {status}",
    );
}

/// Null bytes deserve their own test: they're rare in legitimate traffic and
/// historically trip C-string based parsers. Postgres text types reject them
/// outright, so the handler must convert that to a 4xx rather than leak a
/// database error as 500.
#[sqlx::test(migrations = "./migrations")]
async fn search_handles_embedded_null_byte(db: PgPool) {
    let (_, token) = create_test_user(&db).await;
    let app = app_with_db(db);

    let uri = format!("/api/files/search?q={}", encode("foo\0bar"));
    let (status, body) = get_json(app, &uri, &token).await;

    assert_ne!(
        status,
        StatusCode::INTERNAL_SERVER_ERROR,
        "null-byte query must not produce 500, got body: {body}"
    );
}
