//! OAuth authentication routes.
//!
//! Handles the full OAuth flow: redirecting users to the provider's consent screen,
//! processing the callback to exchange codes for tokens, and returning the
//! authenticated user's profile. Currently supports Google as an OAuth provider.
//!
//! CSRF protection: the `state` parameter is stored in a short-lived, `HttpOnly`
//! cookie during the redirect and verified on callback.

use axum::Router;
use axum::extract::{FromRequestParts, Path, Query, State};
use axum::http::{HeaderValue, header, request::Parts};
use axum::response::{IntoResponse, Redirect, Response};
use axum::routing::get;
use oauth2::{AuthorizationCode, CsrfToken, Scope, TokenResponse};
use serde::Deserialize;

use crate::auth::jwt::create_token;
use crate::auth::oauth::{fetch_google_user_info, google_client};
use crate::errors::{AppError, OptionExt, ResultExt};
use crate::state::AppState;

const CSRF_COOKIE_NAME: &str = "oauth_csrf";

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
/// stores the CSRF token in an `HttpOnly` cookie, then returns a temporary redirect.
/// Returns [`AppError::BadRequest`] if the provider's client credentials are not configured.
async fn start_oauth(
    State(state): State<AppState>,
    Path(provider): Path<String>,
) -> Result<Response, AppError> {
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

            let (auth_url, csrf_token) = client
                .authorize_url(CsrfToken::new_random)
                .add_scope(Scope::new("openid".to_string()))
                .add_scope(Scope::new("email".to_string()))
                .add_scope(Scope::new("profile".to_string()))
                .url();

            let cookie = format!(
                "{CSRF_COOKIE_NAME}={}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600",
                csrf_token.secret()
            );

            let mut response = Redirect::temporary(auth_url.as_str()).into_response();
            response.headers_mut().insert(
                header::SET_COOKIE,
                HeaderValue::from_str(&cookie).internal("Failed to build CSRF cookie")?,
            );
            Ok(response)
        }
        _ => Err(AppError::unsupported_provider(&provider)),
    }
}

/// Query parameters returned by the OAuth provider on the callback redirect.
#[derive(Deserialize)]
struct CallbackParams {
    /// The authorization code to exchange for an access token.
    code: String,
    /// The CSRF state parameter, verified against the cookie set in [`start_oauth`].
    state: Option<String>,
}

/// Axum extractor that reads the CSRF cookie set during [`start_oauth`].
///
/// Rejects with `400 Bad Request` if the cookie is absent.
struct CsrfCookie(String);

impl<S: Send + Sync> FromRequestParts<S> for CsrfCookie {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let value = parts
            .headers
            .get_all(header::COOKIE)
            .iter()
            .filter_map(|v| v.to_str().ok())
            .flat_map(|v| v.split(';'))
            .find_map(|pair| {
                let pair = pair.trim();
                let (key, val) = pair.split_once('=')?;
                (key.trim() == CSRF_COOKIE_NAME).then(|| val.trim().to_string())
            })
            .ok_or_else(|| AppError::bad_request("Invalid or missing OAuth state parameter"))?;

        Ok(CsrfCookie(value))
    }
}

/// Handles the OAuth callback after the user consents.
///
/// Verifies the CSRF `state` parameter against the cookie set during [`start_oauth`],
/// exchanges the authorization `code` for an access token, fetches the user's
/// profile from the provider, upserts the user in the database, and redirects
/// back to the frontend with a JWT in the query string.
async fn oauth_callback(
    State(state): State<AppState>,
    Path(provider): Path<String>,
    CsrfCookie(csrf_cookie): CsrfCookie,
    Query(params): Query<CallbackParams>,
) -> Result<Response, AppError> {
    let csrf_param = params
        .state
        .as_deref()
        .ok_or_else(|| AppError::bad_request("Invalid or missing OAuth state parameter"))?;

    if csrf_cookie != csrf_param {
        return Err(AppError::bad_request(
            "Invalid or missing OAuth state parameter",
        ));
    }

    match provider.as_str() {
        "google" => {
            let client = google_client(&state.config)?;
            let token_response = client
                .exchange_code(AuthorizationCode::new(params.code))
                .request_async(&state.http)
                .await
                .internal("Token exchange failed")?;

            let access_token = token_response.access_token().secret();

            // Fetch user profile from Google
            let user_info = fetch_google_user_info(&state.http, access_token).await?;

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

            // Clear the CSRF cookie
            let clear_cookie =
                format!("{CSRF_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
            let mut response = Redirect::temporary(&redirect_url).into_response();
            response.headers_mut().insert(
                header::SET_COOKIE,
                HeaderValue::from_str(&clear_cookie).internal("Failed to build cookie")?,
            );
            Ok(response)
        }
        _ => Err(AppError::unsupported_provider(&provider)),
    }
}

/// Returns the current authenticated user's profile as JSON.
///
/// Extracts the JWT from the request, looks up the corresponding user,
/// and returns their `id`, `email`, `name`, and `avatar_url`.
async fn get_current_user(
    auth_user: crate::middleware::auth::AuthUser,
    State(state): State<AppState>,
) -> Result<axum::Json<serde_json::Value>, AppError> {
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
