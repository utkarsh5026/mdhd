//! Centralized error handling for the MDHD API.
//!
//! All route handlers return `Result<T, AppError>`. The [`AppError`] enum maps each
//! error variant to an appropriate HTTP status code and JSON error body via [`IntoResponse`].

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

/// Application-wide error type returned by route handlers.
///
/// Each variant maps to an HTTP status code. Server-side variants ([`Database`](Self::Database),
/// [`Internal`](Self::Internal)) log the underlying cause but return a generic message to
/// the client to avoid leaking implementation details.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    /// The requested resource does not exist. Maps to `404 Not Found`.
    #[error("Not found")]
    NotFound,

    /// The request lacks valid authentication credentials. Maps to `401 Unauthorized`.
    #[error("Unauthorized")]
    Unauthorized,

    /// The request was malformed or contained invalid parameters. Maps to `400 Bad Request`.
    #[error("Bad request: {0}")]
    BadRequest(String),

    /// A database query failed. Automatically converted from [`sqlx::Error`] via `#[from]`.
    /// Maps to `500 Internal Server Error`; the raw error is logged server-side only.
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    /// A catch-all for unexpected server-side failures. Maps to `500 Internal Server Error`;
    /// the message is logged server-side only.
    #[error("Internal error: {0}")]
    Internal(String),
}

impl AppError {
    /// Wraps an arbitrary displayable value as an [`Internal`](Self::Internal) error.
    pub fn internal(msg: impl std::fmt::Display) -> Self {
        AppError::Internal(msg.to_string())
    }

    /// Wraps an arbitrary displayable value as a [`BadRequest`](Self::BadRequest) error.
    pub fn bad_request(msg: impl std::fmt::Display) -> Self {
        AppError::BadRequest(msg.to_string())
    }

    /// Returns a [`BadRequest`](Self::BadRequest) for an unrecognized OAuth provider name.
    pub fn unsupported_provider(provider: &str) -> Self {
        AppError::BadRequest(format!("Unsupported OAuth provider: {provider}"))
    }
}

/// Extension trait on `Result` to convert errors into [`AppError::Internal`] with context.
pub trait ResultExt<T> {
    fn internal(self, context: &str) -> Result<T, AppError>;
}

impl<T, E: std::fmt::Display> ResultExt<T> for Result<T, E> {
    fn internal(self, context: &str) -> Result<T, AppError> {
        self.map_err(|e| AppError::Internal(format!("{context}: {e}")))
    }
}

/// Extension trait on `Option` to convert `None` into common [`AppError`] variants.
pub trait OptionExt<T> {
    fn or_not_found(self) -> Result<T, AppError>;
    fn or_unauthorized(self) -> Result<T, AppError>;
}

impl<T> OptionExt<T> for Option<T> {
    fn or_not_found(self) -> Result<T, AppError> {
        self.ok_or(AppError::NotFound)
    }

    fn or_unauthorized(self) -> Result<T, AppError> {
        self.ok_or(AppError::Unauthorized)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, self.to_string()),
            AppError::BadRequest(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::Database(err) => {
                tracing::error!("Database error: {err:?}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
            AppError::Internal(msg) => {
                tracing::error!("Internal error: {msg}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
        };

        let body = axum::Json(json!({ "error": message }));
        (status, body).into_response()
    }
}
