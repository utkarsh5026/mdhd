//! Environment-based configuration for the MDHD server.
//!
//! Loads all settings from environment variables at startup, distinguishing between
//! required variables (which return an error if missing) and optional ones (with sensible defaults).

use std::env;

/// Deployment environment, derived from the `APP_ENV` environment variable.
///
/// Defaults to [`Development`](AppEnv::Development) if unset or unrecognized.
///
/// `Stage` is a deployed-but-non-production environment used for PR previews.
/// It opts in to looser rules (e.g. regex-based CORS / OAuth return URLs) that
/// production never enables, so ephemeral preview URLs work without a redeploy
/// per PR.
#[derive(Debug, Clone, PartialEq)]
pub enum AppEnv {
    Production,
    Stage,
    Development,
}

impl AppEnv {
    /// Reads `APP_ENV` from the environment.
    #[must_use]
    pub fn from_env_var() -> Self {
        Self::from_source(&|k| env::var(k).ok())
    }

    /// Like [`Self::from_env_var`] but reads via an injected source — used by tests
    /// to avoid mutating process-wide env (which races with `#[sqlx::test]` in other modules).
    fn from_source(get: &dyn Fn(&str) -> Option<String>) -> Self {
        match get("APP_ENV").as_deref() {
            Some("production") => Self::Production,
            Some("stage" | "staging") => Self::Stage,
            _ => Self::Development,
        }
    }
}

/// Errors that can occur while loading server configuration.
#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("required environment variable {0} is not set")]
    Missing(String),
    #[error("{0}")]
    Invalid(String),
}

/// Generates `pub fn $field(&self) -> String` clone-getters for each listed field.
/// Accepts optional doc comments per field.
macro_rules! clone_getters {
    ($($(#[$meta:meta])* $field:ident),* $(,)?) => {
        $(
            $(#[$meta])*
            pub fn $field(&self) -> String { self.$field.clone() }
        )*
    };
}

/// Server configuration loaded from environment variables.
///
/// Required variables (`DATABASE_URL`, `JWT_SECRET`) return an error at startup if missing,
/// ensuring fast failure before any connections are established. All other fields fall back
/// to development-friendly defaults (see [`Config::from_env`]).
#[derive(Debug, Clone)]
pub struct Config {
    /// Deployment environment (production vs development).
    pub app_env: AppEnv,
    pub database_url: String,
    /// Direct (non-pooled) Postgres URL used only to run migrations at startup.
    /// Supabase's transaction-mode pooler doesn't support advisory locks reliably,
    /// so migrations should connect to port 5432 directly. Falls back to
    /// `database_url` when unset.
    pub migration_database_url: String,
    /// Secret used to sign and verify JWT session tokens. **Required.**
    pub jwt_secret: String,
    pub google_client_id: String,
    pub google_client_secret: String,
    /// Base URL prepended to `/auth/{provider}/callback` when building OAuth redirect URIs.
    /// Defaults to `http://localhost:8080`.
    pub oauth_redirect_base: String,
    /// Optional override for Google's `OAuth2` token-exchange endpoint. Only set in
    /// integration tests that point the flow at a local mock server. `None` in
    /// production — the real Google URL is used.
    pub google_token_url_override: Option<String>,
    /// Supabase S3-compatible storage endpoint URL.
    pub supabase_s3_endpoint: String,
    pub supabase_s3_access_key: String,
    pub supabase_s3_secret_key: String,
    /// S3 bucket name for file storage. Defaults to `"files"`.
    pub supabase_storage_bucket: String,
    /// TCP port the server listens on. Defaults to `8080`.
    pub port: u16,
    /// Allowed CORS origins for the frontend. Defaults to `["http://localhost:5173"]`.
    /// Parsed from a comma-separated `CORS_ORIGIN` env var so multiple origins
    /// (e.g. production + Vercel preview deployments) can be allowed at once.
    pub cors_origins: Vec<String>,
    /// Optional regex matched against the request `Origin` header. Used to allow
    /// dynamic preview URLs (e.g. Vercel PR previews) without redeploying for
    /// every new URL. Combined with `cors_origins` via OR — a request is
    /// allowed if it matches the explicit list OR the regex.
    pub cors_origin_regex: Option<String>,
    /// Frontend URL used for post-auth redirects. Defaults to `http://localhost:5173`.
    pub frontend_url: String,
    /// Maximum database connections in the pool. Defaults to `10`.
    pub db_max_connections: u32,
    /// JWT token expiry in days. Defaults to `7`.
    pub jwt_expiry_days: i64,
    /// Maximum file import size in bytes. Defaults to `5242880` (5 MB).
    pub import_max_size: usize,
    /// URL import timeout in seconds. Defaults to `15`.
    pub import_timeout_secs: u64,
    /// Maximum number of files in a single sync request. Defaults to `1000`.
    pub sync_max_files: usize,
    /// Maximum number of settings in a single sync request. Defaults to `200`.
    pub sync_max_settings: usize,
    /// Maximum paste content size in bytes. Defaults to `524288` (512 KB).
    pub paste_max_size: usize,
}

impl Config {
    clone_getters!(
        /// Google `OAuth2` client ID.
        google_client_id,
        /// Google `OAuth2` client secret.
        google_client_secret,
        /// JWT signing secret.
        #[allow(dead_code)]
        jwt_secret,
        /// Frontend URL for redirects.
        #[allow(dead_code)]
        frontend_url,
    );

    /// Returns the OAuth redirect URL for the given provider.
    #[must_use]
    pub fn oauth_redirect_url(&self, provider: &str) -> String {
        format!("{}/auth/{}/callback", self.oauth_redirect_base, provider)
    }

    /// Builds a [`Config`] by reading process environment variables.
    ///
    /// # Errors
    ///
    /// Returns [`ConfigError::Missing`] if `DATABASE_URL` or `JWT_SECRET` are not set,
    /// or [`ConfigError::Invalid`] if `PORT` cannot be parsed as a `u16`.
    pub fn from_env() -> Result<Self, ConfigError> {
        Self::from_source(&|k| env::var(k).ok())
    }

    /// Builds a [`Config`] from an arbitrary source — `get(key)` returns `Some(value)`
    /// when set, `None` when unset. Used by tests to inject a per-test map instead of
    /// mutating the process-wide environment, which would race with `#[sqlx::test]`
    /// invocations in other modules that read `DATABASE_URL`.
    fn from_source(get: &dyn Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let jwt_secret = required(get, "JWT_SECRET")?;
        if jwt_secret.len() < 32 {
            return Err(ConfigError::Invalid(
                "JWT_SECRET must be at least 32 characters for HS256 security".into(),
            ));
        }

        let database_url = required(get, "DATABASE_URL")?;
        let migration_database_url = optional_or(get, "MIGRATION_DATABASE_URL", &database_url);

        Ok(Self {
            app_env: AppEnv::from_source(get),
            database_url,
            migration_database_url,
            jwt_secret,
            google_client_id: optional(get, "GOOGLE_CLIENT_ID"),
            google_client_secret: optional(get, "GOOGLE_CLIENT_SECRET"),
            oauth_redirect_base: optional_or(get, "OAUTH_REDIRECT_BASE", "http://localhost:8080"),
            google_token_url_override: None,
            supabase_s3_endpoint: optional(get, "SUPABASE_S3_ENDPOINT"),
            supabase_s3_access_key: optional(get, "SUPABASE_S3_ACCESS_KEY"),
            supabase_s3_secret_key: optional(get, "SUPABASE_S3_SECRET_KEY"),
            supabase_storage_bucket: optional_or(get, "SUPABASE_STORAGE_BUCKET", "files"),
            port: optional_or(get, "PORT", "8080").parse().map_err(|_| {
                ConfigError::Invalid("PORT must be a valid port number (0-65535)".into())
            })?,
            cors_origins: parse_csv(get, "CORS_ORIGIN", "http://localhost:5173"),
            cors_origin_regex: {
                let raw = get("CORS_ORIGIN_REGEX").unwrap_or_default();
                if raw.is_empty() {
                    None
                } else {
                    regex::Regex::new(&raw).map_err(|e| {
                        ConfigError::Invalid(format!("CORS_ORIGIN_REGEX is not a valid regex: {e}"))
                    })?;
                    Some(raw)
                }
            },
            frontend_url: optional_or(get, "FRONTEND_URL", "http://localhost:5173"),
            db_max_connections: optional_or(get, "DB_MAX_CONNECTIONS", "10")
                .parse()
                .map_err(|_| ConfigError::Invalid("DB_MAX_CONNECTIONS must be a u32".into()))?,
            jwt_expiry_days: optional_or(get, "JWT_EXPIRY_DAYS", "7")
                .parse()
                .map_err(|_| {
                    ConfigError::Invalid("JWT_EXPIRY_DAYS must be a positive i64".into())
                })?,
            import_max_size: optional_or(get, "IMPORT_MAX_SIZE", "5242880")
                .parse()
                .map_err(|_| ConfigError::Invalid("IMPORT_MAX_SIZE must be a usize".into()))?,
            import_timeout_secs: optional_or(get, "IMPORT_TIMEOUT_SECS", "15")
                .parse()
                .map_err(|_| ConfigError::Invalid("IMPORT_TIMEOUT_SECS must be a u64".into()))?,
            sync_max_files: optional_or(get, "SYNC_MAX_FILES", "1000")
                .parse()
                .map_err(|_| ConfigError::Invalid("SYNC_MAX_FILES must be a usize".into()))?,
            sync_max_settings: optional_or(get, "SYNC_MAX_SETTINGS", "200")
                .parse()
                .map_err(|_| ConfigError::Invalid("SYNC_MAX_SETTINGS must be a usize".into()))?,
            paste_max_size: optional_or(get, "PASTE_MAX_SIZE", "524288")
                .parse()
                .map_err(|_| ConfigError::Invalid("PASTE_MAX_SIZE must be a usize".into()))?,
        })
    }
}

/// Reads a variable via `get`, returning [`ConfigError::Missing`] if unset or empty.
fn required(get: &dyn Fn(&str) -> Option<String>, key: &str) -> Result<String, ConfigError> {
    get(key)
        .filter(|v| !v.is_empty())
        .ok_or_else(|| ConfigError::Missing(key.to_string()))
}

/// Reads a variable via `get`, returning an empty string if unset.
fn optional(get: &dyn Fn(&str) -> Option<String>, key: &str) -> String {
    get(key).unwrap_or_default()
}

/// Reads a variable via `get`, falling back to `default` if unset or empty.
fn optional_or(get: &dyn Fn(&str) -> Option<String>, key: &str, default: &str) -> String {
    get(key)
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| default.to_string())
}

/// Reads a comma-separated variable via `get` into a list of trimmed, non-empty
/// values. Falls back to a single-element list containing `default` when unset
/// or empty after trimming.
fn parse_csv(get: &dyn Fn(&str) -> Option<String>, key: &str, default: &str) -> Vec<String> {
    let raw = get(key).unwrap_or_default();
    let parsed: Vec<String> = raw
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .collect();
    if parsed.is_empty() {
        vec![default.to_string()]
    } else {
        parsed
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    /// Builds a `get` closure backed by an in-memory map. Tests use this instead of
    /// `env::set_var` / `env::remove_var` so they don't mutate process-wide env —
    /// otherwise a config test's `remove_var("DATABASE_URL")` races against
    /// `#[sqlx::test]` invocations in other modules that read `DATABASE_URL` via
    /// `dotenvy::var`, causing flaky `EnvVar(NotPresent)` panics under parallel
    /// `cargo test`.
    fn map_source(pairs: &[(&str, &str)]) -> HashMap<String, String> {
        pairs
            .iter()
            .map(|(k, v)| ((*k).to_string(), (*v).to_string()))
            .collect()
    }

    fn get_from(map: &HashMap<String, String>) -> impl Fn(&str) -> Option<String> + '_ {
        |k: &str| map.get(k).cloned()
    }

    const VALID_JWT: &str = "this-is-a-test-secret-that-is-at-least-32-chars";

    #[test]
    fn required_returns_value_when_set() {
        let map = map_source(&[("KEY", "my_value")]);
        assert_eq!(required(&get_from(&map), "KEY").unwrap(), "my_value");
    }

    #[test]
    fn required_errors_when_unset() {
        let map = map_source(&[]);
        let err = required(&get_from(&map), "MISSING").unwrap_err();
        assert!(err.to_string().contains("MISSING"));
    }

    #[test]
    fn optional_returns_empty_string_when_unset() {
        let map = map_source(&[]);
        assert_eq!(optional(&get_from(&map), "KEY"), "");
    }

    #[test]
    fn optional_returns_value_when_set() {
        let map = map_source(&[("KEY", "some_value")]);
        assert_eq!(optional(&get_from(&map), "KEY"), "some_value");
    }

    #[test]
    fn optional_or_returns_default_when_unset() {
        let map = map_source(&[]);
        assert_eq!(optional_or(&get_from(&map), "KEY", "fallback"), "fallback");
    }

    #[test]
    fn optional_or_returns_env_value_over_default() {
        let map = map_source(&[("KEY", "override")]);
        assert_eq!(optional_or(&get_from(&map), "KEY", "fallback"), "override");
    }

    #[test]
    fn config_from_env_builds_with_required_vars() {
        let map = map_source(&[
            ("DATABASE_URL", "postgres://localhost/test"),
            ("JWT_SECRET", VALID_JWT),
        ]);
        let config = Config::from_source(&get_from(&map)).unwrap();

        assert_eq!(config.database_url, "postgres://localhost/test");
        assert_eq!(config.jwt_secret, VALID_JWT);
        assert_eq!(config.port, 8080);
        assert_eq!(
            config.cors_origins,
            vec!["http://localhost:5173".to_string()]
        );
        assert_eq!(config.frontend_url, "http://localhost:5173");
        assert_eq!(config.oauth_redirect_base, "http://localhost:8080");
        assert_eq!(config.supabase_storage_bucket, "files");
        assert_eq!(config.google_client_id, "");
    }

    #[test]
    fn config_from_env_respects_optional_overrides() {
        let map = map_source(&[
            ("DATABASE_URL", "postgres://localhost/test"),
            ("JWT_SECRET", VALID_JWT),
            ("PORT", "9090"),
            ("CORS_ORIGIN", "https://example.com"),
            ("FRONTEND_URL", "https://example.com"),
            ("SUPABASE_STORAGE_BUCKET", "my-bucket"),
        ]);
        let config = Config::from_source(&get_from(&map)).unwrap();

        assert_eq!(config.port, 9090);
        assert_eq!(config.cors_origins, vec!["https://example.com".to_string()]);
        assert_eq!(config.frontend_url, "https://example.com");
        assert_eq!(config.supabase_storage_bucket, "my-bucket");
    }

    #[test]
    fn config_parses_comma_separated_cors_origins() {
        let map = map_source(&[
            ("DATABASE_URL", "postgres://localhost/test"),
            ("JWT_SECRET", VALID_JWT),
            (
                "CORS_ORIGIN",
                "https://app.vercel.app, https://preview.vercel.app ,http://localhost:5173",
            ),
        ]);
        let config = Config::from_source(&get_from(&map)).unwrap();

        assert_eq!(
            config.cors_origins,
            vec![
                "https://app.vercel.app".to_string(),
                "https://preview.vercel.app".to_string(),
                "http://localhost:5173".to_string(),
            ]
        );
    }

    #[test]
    fn config_from_env_errors_without_database_url() {
        let map = map_source(&[("JWT_SECRET", VALID_JWT)]);
        let err = Config::from_source(&get_from(&map)).unwrap_err();
        assert!(err.to_string().contains("DATABASE_URL"));
    }

    #[test]
    fn config_from_env_errors_without_jwt_secret() {
        let map = map_source(&[("DATABASE_URL", "postgres://localhost/test")]);
        let err = Config::from_source(&get_from(&map)).unwrap_err();
        assert!(err.to_string().contains("JWT_SECRET"));
    }

    #[test]
    fn config_from_env_errors_on_short_jwt_secret() {
        let map = map_source(&[
            ("DATABASE_URL", "postgres://localhost/test"),
            ("JWT_SECRET", "too-short"),
        ]);
        let err = Config::from_source(&get_from(&map)).unwrap_err();
        assert!(err.to_string().contains("32 characters"));
    }

    #[test]
    fn config_from_env_errors_on_invalid_port() {
        let map = map_source(&[
            ("DATABASE_URL", "postgres://localhost/test"),
            ("JWT_SECRET", VALID_JWT),
            ("PORT", "not_a_number"),
        ]);
        let err = Config::from_source(&get_from(&map)).unwrap_err();
        assert!(err.to_string().contains("PORT"));
    }
}
