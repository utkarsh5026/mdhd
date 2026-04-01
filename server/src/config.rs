//! Environment-based configuration for the MDHD server.
//!
//! Loads all settings from environment variables at startup, distinguishing between
//! required variables (which return an error if missing) and optional ones (with sensible defaults).

use std::env;

/// Deployment environment, derived from the `APP_ENV` environment variable.
///
/// Defaults to [`Development`](AppEnv::Development) if unset or unrecognized.
#[derive(Debug, Clone, PartialEq)]
pub enum AppEnv {
    Production,
    Development,
}

impl AppEnv {
    /// Reads `APP_ENV` from the environment.
    pub fn from_env_var() -> Self {
        match env::var("APP_ENV").as_deref() {
            Ok("production") => Self::Production,
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
    /// Secret used to sign and verify JWT session tokens. **Required.**
    pub jwt_secret: String,
    pub google_client_id: String,
    pub google_client_secret: String,
    /// Base URL prepended to `/auth/{provider}/callback` when building OAuth redirect URIs.
    /// Defaults to `http://localhost:8080`.
    pub oauth_redirect_base: String,
    /// Supabase S3-compatible storage endpoint URL.
    pub supabase_s3_endpoint: String,
    pub supabase_s3_access_key: String,
    pub supabase_s3_secret_key: String,
    /// S3 bucket name for file storage. Defaults to `"files"`.
    pub supabase_storage_bucket: String,
    /// TCP port the server listens on. Defaults to `8080`.
    pub port: u16,
    /// Allowed CORS origin for the frontend. Defaults to `http://localhost:5173`.
    pub cors_origin: String,
    /// Frontend URL used for post-auth redirects. Defaults to `http://localhost:5173`.
    pub frontend_url: String,
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
    pub fn oauth_redirect_url(&self, provider: &str) -> String {
        format!("{}/auth/{}/callback", self.oauth_redirect_base, provider)
    }

    /// Builds a [`Config`] by reading environment variables.
    ///
    /// # Errors
    ///
    /// Returns [`ConfigError::Missing`] if `DATABASE_URL` or `JWT_SECRET` are not set,
    /// or [`ConfigError::Invalid`] if `PORT` cannot be parsed as a `u16`.
    pub fn from_env() -> Result<Self, ConfigError> {
        Ok(Self {
            app_env: AppEnv::from_env_var(),
            database_url: required("DATABASE_URL")?,
            jwt_secret: required("JWT_SECRET")?,
            google_client_id: optional("GOOGLE_CLIENT_ID"),
            google_client_secret: optional("GOOGLE_CLIENT_SECRET"),
            oauth_redirect_base: optional_or("OAUTH_REDIRECT_BASE", "http://localhost:8080"),
            supabase_s3_endpoint: optional("SUPABASE_S3_ENDPOINT"),
            supabase_s3_access_key: optional("SUPABASE_S3_ACCESS_KEY"),
            supabase_s3_secret_key: optional("SUPABASE_S3_SECRET_KEY"),
            supabase_storage_bucket: optional_or("SUPABASE_STORAGE_BUCKET", "files"),
            port: optional_or("PORT", "8080").parse().map_err(|_| {
                ConfigError::Invalid("PORT must be a valid port number (0-65535)".into())
            })?,
            cors_origin: optional_or("CORS_ORIGIN", "http://localhost:5173"),
            frontend_url: optional_or("FRONTEND_URL", "http://localhost:5173"),
        })
    }
}

/// Reads an environment variable, returning [`ConfigError::Missing`] if unset.
fn required(key: &str) -> Result<String, ConfigError> {
    env::var(key).map_err(|_| ConfigError::Missing(key.to_string()))
}

/// Reads an environment variable, returning an empty string if unset.
fn optional(key: &str) -> String {
    env::var(key).unwrap_or_default()
}

/// Reads an environment variable, falling back to `default` if unset.
fn optional_or(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    /// Serializes all tests that touch environment variables, since env is global process state.
    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn lock_env() -> std::sync::MutexGuard<'static, ()> {
        ENV_LOCK
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    #[test]
    fn required_returns_value_when_set() {
        let _g = lock_env();
        unsafe { env::set_var("_TEST_REQUIRED", "my_value") };
        let result = required("_TEST_REQUIRED").unwrap();
        unsafe { env::remove_var("_TEST_REQUIRED") };
        assert_eq!(result, "my_value");
    }

    #[test]
    fn required_errors_when_unset() {
        let _g = lock_env();
        unsafe { env::remove_var("_TEST_REQUIRED_MISSING") };
        let err = required("_TEST_REQUIRED_MISSING").unwrap_err();
        assert!(err.to_string().contains("_TEST_REQUIRED_MISSING"));
    }

    #[test]
    fn optional_returns_empty_string_when_unset() {
        let _g = lock_env();
        unsafe { env::remove_var("_TEST_OPTIONAL") };
        assert_eq!(optional("_TEST_OPTIONAL"), "");
    }

    #[test]
    fn optional_returns_value_when_set() {
        let _g = lock_env();
        unsafe { env::set_var("_TEST_OPTIONAL", "some_value") };
        let result = optional("_TEST_OPTIONAL");
        unsafe { env::remove_var("_TEST_OPTIONAL") };
        assert_eq!(result, "some_value");
    }

    #[test]
    fn optional_or_returns_default_when_unset() {
        let _g = lock_env();
        unsafe { env::remove_var("_TEST_OPTIONAL_OR") };
        assert_eq!(optional_or("_TEST_OPTIONAL_OR", "fallback"), "fallback");
    }

    #[test]
    fn optional_or_returns_env_value_over_default() {
        let _g = lock_env();
        unsafe { env::set_var("_TEST_OPTIONAL_OR", "override") };
        let result = optional_or("_TEST_OPTIONAL_OR", "fallback");
        unsafe { env::remove_var("_TEST_OPTIONAL_OR") };
        assert_eq!(result, "override");
    }

    #[test]
    fn config_from_env_builds_with_required_vars() {
        let _g = lock_env();
        unsafe {
            env::set_var("DATABASE_URL", "postgres://localhost/test");
            env::set_var("JWT_SECRET", "super_secret");
            // Remove optionals so we exercise their defaults
            for key in &[
                "GOOGLE_CLIENT_ID",
                "GOOGLE_CLIENT_SECRET",
                "OAUTH_REDIRECT_BASE",
                "SUPABASE_S3_ENDPOINT",
                "SUPABASE_S3_ACCESS_KEY",
                "SUPABASE_S3_SECRET_KEY",
                "SUPABASE_STORAGE_BUCKET",
                "PORT",
                "CORS_ORIGIN",
                "FRONTEND_URL",
            ] {
                env::remove_var(key);
            }
        }
        let config = Config::from_env().unwrap();
        unsafe {
            env::remove_var("DATABASE_URL");
            env::remove_var("JWT_SECRET");
        }

        assert_eq!(config.database_url, "postgres://localhost/test");
        assert_eq!(config.jwt_secret, "super_secret");
        assert_eq!(config.port, 8080);
        assert_eq!(config.cors_origin, "http://localhost:5173");
        assert_eq!(config.frontend_url, "http://localhost:5173");
        assert_eq!(config.oauth_redirect_base, "http://localhost:8080");
        assert_eq!(config.supabase_storage_bucket, "files");
        assert_eq!(config.google_client_id, "");
    }

    #[test]
    fn config_from_env_respects_optional_overrides() {
        let _g = lock_env();
        unsafe {
            env::set_var("DATABASE_URL", "postgres://localhost/test");
            env::set_var("JWT_SECRET", "secret");
            env::set_var("PORT", "9090");
            env::set_var("CORS_ORIGIN", "https://example.com");
            env::set_var("FRONTEND_URL", "https://example.com");
            env::set_var("SUPABASE_STORAGE_BUCKET", "my-bucket");
        }
        let config = Config::from_env().unwrap();
        unsafe {
            for key in &[
                "DATABASE_URL",
                "JWT_SECRET",
                "PORT",
                "CORS_ORIGIN",
                "FRONTEND_URL",
                "SUPABASE_STORAGE_BUCKET",
            ] {
                env::remove_var(key);
            }
        }

        assert_eq!(config.port, 9090);
        assert_eq!(config.cors_origin, "https://example.com");
        assert_eq!(config.frontend_url, "https://example.com");
        assert_eq!(config.supabase_storage_bucket, "my-bucket");
    }

    #[test]
    fn config_from_env_errors_without_database_url() {
        let _g = lock_env();
        unsafe {
            env::remove_var("DATABASE_URL");
            env::set_var("JWT_SECRET", "secret");
        }
        let err = Config::from_env().unwrap_err();
        assert!(err.to_string().contains("DATABASE_URL"));
    }

    #[test]
    fn config_from_env_errors_without_jwt_secret() {
        let _g = lock_env();
        unsafe {
            env::set_var("DATABASE_URL", "postgres://localhost/test");
            env::remove_var("JWT_SECRET");
        }
        let err = Config::from_env().unwrap_err();
        assert!(err.to_string().contains("JWT_SECRET"));
    }

    #[test]
    fn config_from_env_errors_on_invalid_port() {
        let _g = lock_env();
        unsafe {
            env::set_var("DATABASE_URL", "postgres://localhost/test");
            env::set_var("JWT_SECRET", "secret");
            env::set_var("PORT", "not_a_number");
        }
        let err = Config::from_env().unwrap_err();
        assert!(err.to_string().contains("PORT"));
    }
}
