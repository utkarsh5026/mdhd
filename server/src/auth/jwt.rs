//! JWT token creation and validation for session authentication.
//!
//! Tokens are HS256-signed JWTs with a 7-day expiry, carrying the user's ID
//! as the `sub` claim. Used by the [`crate::middleware::auth`] layer to guard
//! authenticated routes.

use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation};
use uuid::Uuid;

use crate::errors::{AppError, ResultExt};

/// JWT claim set embedded in every issued token.
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Claims {
    /// The authenticated user's ID.
    pub sub: Uuid,
    /// Expiration timestamp (UTC, seconds since epoch).
    pub exp: i64,
    /// Issued-at timestamp (UTC, seconds since epoch).
    pub iat: i64,
}

/// Creates a signed JWT for the given user, valid for 7 days.
///
/// # Errors
///
/// Returns [`AppError::Internal`] if the token cannot be encoded.
pub fn create_token(user_id: Uuid, secret: &str) -> Result<String, AppError> {
    let now = Utc::now();
    let claims = Claims {
        sub: user_id,
        exp: (now + Duration::days(7)).timestamp(),
        iat: now.timestamp(),
    };

    jsonwebtoken::encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .internal("JWT encode error")
}

/// Decodes and validates a JWT, returning the embedded [`Claims`].
///
/// # Errors
///
/// Returns [`AppError::Unauthorized`] if the token is malformed, expired,
/// or signed with a different secret.
pub fn validate_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    jsonwebtoken::decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized)
}
