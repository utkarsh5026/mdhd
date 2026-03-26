//! JWT-based authentication middleware for Axum route handlers.
//!
//! Provides [`require_auth`] — an Axum middleware function that validates a Bearer token from the
//! `Authorization` header and injects an [`AuthUser`] into request extensions. Protected routes
//! retrieve the authenticated identity via `Extension<AuthUser>`.

use axum::extract::Request;
use axum::http::header::AUTHORIZATION;
use axum::middleware::Next;
use axum::response::Response;
use uuid::Uuid;

use crate::config::Config;
use crate::errors::{AppError, OptionExt};
use crate::state::AppState;

/// The authenticated user identity injected into request extensions by [`require_auth`].
///
/// Route handlers access this via `Extension<AuthUser>` after the middleware has run.
#[derive(Debug, Clone)]
pub struct AuthUser {
    /// The unique ID of the authenticated user.
    pub user_id: Uuid,
}

/// Axum middleware that rejects unauthenticated requests with `401 Unauthorized`.
///
/// Validates the `Authorization: Bearer <token>` header, then injects an [`AuthUser`] into the
/// request extensions so downstream handlers can identify the caller without re-parsing the token.
///
/// # Errors
///
/// Returns [`AppError::Unauthorized`] if the header is absent, malformed, or carries an invalid
/// or expired JWT. See [`extract_auth_user`] for the full extraction logic.
pub async fn require_auth(
    state: axum::extract::State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_user = extract_auth_user(&req, &state.config)?;
    req.extensions_mut().insert(auth_user);
    Ok(next.run(req).await)
}

/// Extracts and validates the Bearer token from a request, returning the authenticated caller.
///
/// Reads the `Authorization` header, strips the `"Bearer "` prefix, then delegates to
/// [`crate::auth::jwt::validate_token`] to verify the signature and expiry. The resulting
/// [`Claims::sub`](crate::auth::jwt::Claims) is mapped to an [`AuthUser`].
///
/// Separated from [`require_auth`] so it can be reused in non-middleware contexts (e.g. tests
/// or WebSocket upgrade handlers) without requiring a full Axum middleware stack.
///
/// # Errors
///
/// - [`AppError::Unauthorized`] — `Authorization` header is missing, not valid UTF-8, lacks the
///   `"Bearer "` prefix, or the token fails JWT validation (bad signature, expired, malformed).
pub fn extract_auth_user(req: &Request, config: &Config) -> Result<AuthUser, AppError> {
    let token = req
        .headers()
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .or_unauthorized()?;

    let claims = crate::auth::jwt::validate_token(token, &config.jwt_secret)?;

    Ok(AuthUser {
        user_id: claims.sub,
    })
}
