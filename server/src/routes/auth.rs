//! OAuth authentication routes.
//!
//! Handles the full OAuth flow: redirecting users to the provider's consent screen,
//! processing the callback to exchange codes for tokens, and returning the
//! authenticated user's profile. Currently supports Google as an OAuth provider.

use axum::Router;
use axum::extract::{Path, Query, State};
use axum::response::Redirect;
use axum::routing::get;
use oauth2::{AuthorizationCode, CsrfToken, Scope, TokenResponse};
use serde::Deserialize;

use crate::auth::jwt::create_token;
use crate::auth::oauth::{fetch_google_user_info, google_client};
use crate::errors::{AppError, OptionExt, ResultExt};
use crate::state::AppState;

/// Mounts all OAuth-related routes under `/auth`.
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/{provider}", get(start_oauth))
        .route("/auth/{provider}/callback", get(oauth_callback))
        .route("/auth/me", get(get_current_user))
}

/// Redirects the user to the OAuth provider's consent screen.
///
/// Builds the authorization URL with `openid`, `email`, and `profile` scopes,
/// then returns a temporary redirect. Returns [`AppError::BadRequest`] if the
/// provider's client credentials are not configured.
async fn start_oauth(
    State(state): State<AppState>,
    Path(provider): Path<String>,
) -> Result<Redirect, AppError> {
    match provider.as_str() {
        "google" => {
            if state.config.google_client_id.is_empty()
                || state.config.google_client_secret.is_empty()
            {
                return Err(AppError::bad_request(
                    "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
                ));
            }

            let client = google_client(&state.config)?;

            let (auth_url, _csrf_token) = client
                .authorize_url(CsrfToken::new_random)
                .add_scope(Scope::new("openid".to_string()))
                .add_scope(Scope::new("email".to_string()))
                .add_scope(Scope::new("profile".to_string()))
                .url();

            Ok(Redirect::temporary(auth_url.as_str()))
        }
        _ => Err(AppError::unsupported_provider(&provider)),
    }
}

/// Query parameters returned by the OAuth provider on the callback redirect.
#[derive(Deserialize)]
struct CallbackParams {
    /// The authorization code to exchange for an access token.
    code: String,
    /// The CSRF state parameter. Currently unused but accepted to avoid deserialization errors.
    #[allow(dead_code)]
    state: Option<String>,
}

/// Handles the OAuth callback after the user consents.
///
/// Exchanges the authorization `code` for an access token, fetches the user's
/// profile from the provider, upserts the user in the database, and redirects
/// back to the frontend with a JWT in the query string.
async fn oauth_callback(
    State(state): State<AppState>,
    Path(provider): Path<String>,
    Query(params): Query<CallbackParams>,
) -> Result<Redirect, AppError> {
    match provider.as_str() {
        "google" => {
            let client = google_client(&state.config)?;
            let token_response = client
                .exchange_code(AuthorizationCode::new(params.code))
                .request_async(&reqwest::Client::new())
                .await
                .internal("Token exchange failed")?;

            let access_token = token_response.access_token().secret();

            // Fetch user profile from Google
            let user_info = fetch_google_user_info(access_token).await?;

            // Upsert user in database
            let user = sqlx::query_as::<_, crate::models::user::User>(
                r"
                INSERT INTO users (email, name, avatar_url, oauth_provider, oauth_id)
                VALUES ($1, $2, $3, 'google', $4)
                ON CONFLICT (oauth_provider, oauth_id) DO UPDATE
                SET email = EXCLUDED.email,
                    name = EXCLUDED.name,
                    avatar_url = EXCLUDED.avatar_url,
                    updated_at = now()
                RETURNING *
                ",
            )
            .bind(&user_info.email)
            .bind(&user_info.name)
            .bind(&user_info.picture)
            .bind(&user_info.sub)
            .fetch_one(&state.db)
            .await?;

            let token = create_token(user.id, &state.config.jwt_secret)?;
            let redirect_url = format!("{}?token={}", state.config.frontend_url, token);
            Ok(Redirect::temporary(&redirect_url))
        }
        _ => Err(AppError::unsupported_provider(&provider)),
    }
}

/// Returns the current authenticated user's profile as JSON.
///
/// Extracts the JWT from the request, looks up the corresponding user,
/// and returns their `id`, `email`, `name`, and `avatar_url`.
async fn get_current_user(
    State(state): State<AppState>,
    req: axum::extract::Request,
) -> Result<axum::Json<serde_json::Value>, AppError> {
    let auth_user = crate::middleware::auth::extract_auth_user(&req, &state.config)?;

    let user = sqlx::query_as::<_, crate::models::user::User>("SELECT * FROM users WHERE id = $1")
        .bind(auth_user.user_id)
        .fetch_optional(&state.db)
        .await?
        .or_not_found()?;

    Ok(axum::Json(serde_json::json!({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
    })))
}
