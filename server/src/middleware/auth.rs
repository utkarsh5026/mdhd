//! JWT-based authentication extractor for Axum route handlers.
//!
//! Implements [`FromRequestParts`] for [`AuthUser`], so protected route handlers
//! simply declare it as a parameter — no middleware layer or `Extension` required:
//!
//! ```rust,ignore
//! async fn my_handler(auth: AuthUser) -> impl IntoResponse {
//!     format!("hello {}", auth.user_id)
//! }
//! ```
//!
//! Returns `401 Unauthorized` if the `Authorization: Bearer <token>` header is
//! absent, malformed, or carries an invalid / expired JWT.

use axum::extract::FromRequestParts;
use axum::http::header::AUTHORIZATION;
use axum::http::request::Parts;

use crate::errors::{AppError, OptionExt};
use crate::state::AppState;

/// The authenticated user identity extracted from a valid Bearer token.
///
/// Obtained by declaring `AuthUser` as a parameter in any route handler. Axum
/// calls [`FromRequestParts`] automatically; the handler is never reached if
/// authentication fails.
#[derive(Debug, Clone)]
pub struct AuthUser {
    /// The unique ID of the authenticated user.
    pub user_id: uuid::Uuid,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .or_unauthorized()?;

        let claims = crate::auth::jwt::validate_token(token, &state.config.jwt_secret)?;

        Ok(AuthUser {
            user_id: claims.sub,
        })
    }
}
