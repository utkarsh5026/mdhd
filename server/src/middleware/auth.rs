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
use axum::http::request::Parts;
use axum_extra::TypedHeader;
use axum_extra::headers::{Authorization, authorization::Bearer};
use tracing::warn;

use crate::errors::AppError;
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
        let TypedHeader(Authorization(bearer)) =
            TypedHeader::<Authorization<Bearer>>::from_request_parts(parts, state)
                .await
                .map_err(|_| {
                    warn!("missing or malformed Authorization header");
                    AppError::Unauthorized
                })?;

        let claims =
            match crate::auth::jwt::validate_token(bearer.token(), &state.config.jwt_secret) {
                Ok(c) => c,
                Err(e) => {
                    warn!("JWT validation failed: {e}");
                    return Err(e);
                }
            };

        Ok(AuthUser {
            user_id: claims.sub,
        })
    }
}
