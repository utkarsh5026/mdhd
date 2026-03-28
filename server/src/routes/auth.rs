//! OAuth authentication routes.
//!
//! Handles the full OAuth flow: redirecting users to the provider's consent screen,
//! processing the callback to exchange codes for tokens, and returning the
//! authenticated user's profile. Currently supports Google as an OAuth provider.
//!
//! CSRF protection: the `state` parameter is stored in a short-lived, `HttpOnly`
//! cookie during the redirect and verified on callback.

use axum::Router;
use axum::extract::{Path, Query, State};
use axum::response::{IntoResponse, Redirect};
use axum::routing::{get, post};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use oauth2::{AuthorizationCode, CsrfToken, Scope, TokenResponse};
use serde::{Deserialize, Serialize};
use time::Duration;
use uuid::Uuid;

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
        .route("/auth/exchange", post(exchange_code))
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
    jar: CookieJar,
) -> Result<impl IntoResponse, AppError> {
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

            let cookie = Cookie::build((CSRF_COOKIE_NAME, csrf_token.secret().clone()))
                .http_only(true)
                .same_site(SameSite::Lax)
                .path("/")
                .max_age(Duration::minutes(10));

            Ok((jar.add(cookie), Redirect::temporary(auth_url.as_str())))
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

/// Handles the OAuth callback after the user consents.
///
/// Verifies the CSRF `state` parameter against the cookie set during [`start_oauth`],
/// exchanges the authorization `code` for an access token, fetches the user's
/// profile from the provider, upserts the user in the database, and redirects
/// back to the frontend with a JWT in the query string.
async fn oauth_callback(
    State(state): State<AppState>,
    Path(provider): Path<String>,
    jar: CookieJar,
    Query(params): Query<CallbackParams>,
) -> Result<impl IntoResponse, AppError> {
    let csrf_cookie = jar
        .get(CSRF_COOKIE_NAME)
        .ok_or_else(|| AppError::bad_request("Invalid or missing OAuth state parameter"))?;

    let csrf_param = params
        .state
        .as_deref()
        .ok_or_else(|| AppError::bad_request("Invalid or missing OAuth state parameter"))?;

    if csrf_cookie.value() != csrf_param {
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

            let user_info = fetch_google_user_info(&state.http, access_token).await?;

            let user = sqlx::query_as!(
                crate::models::user::User,
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
                user_info.email,
                user_info.name,
                user_info.picture,
                user_info.sub,
            )
            .fetch_one(&state.db)
            .await?;

            let code: Uuid = sqlx::query_scalar!(
                "INSERT INTO auth_codes (user_id) VALUES ($1) RETURNING code",
                user.id,
            )
            .fetch_one(&state.db)
            .await?;

            let redirect_url = format!("{}?code={}", state.config.frontend_url, code);
            let jar = jar.remove(Cookie::from(CSRF_COOKIE_NAME));

            Ok((jar, Redirect::temporary(&redirect_url)))
        }
        _ => Err(AppError::unsupported_provider(&provider)),
    }
}

/// Request body for POST /auth/exchange.
#[derive(Deserialize)]
struct ExchangeRequest {
    code: Uuid,
}

/// Response body for POST /auth/exchange.
#[derive(Serialize)]
struct ExchangeResponse {
    token: String,
}

/// POST /auth/exchange — consume a one-time auth code and return a JWT.
///
/// The code is deleted atomically via `DELETE … RETURNING`, so concurrent
/// requests with the same code cannot both succeed. Returns `404 Not Found`
/// if the code is unknown or has already expired (60-second window).
async fn exchange_code(
    State(state): State<AppState>,
    axum::Json(body): axum::Json<ExchangeRequest>,
) -> Result<axum::Json<ExchangeResponse>, AppError> {
    let row = sqlx::query!(
        "DELETE FROM auth_codes WHERE code = $1 AND expires_at > now() RETURNING user_id",
        body.code,
    )
    .fetch_optional(&state.db)
    .await?
    .or_not_found()?;

    let token = create_token(row.user_id, &state.config.jwt_secret)?;
    Ok(axum::Json(ExchangeResponse { token }))
}

/// Returns the current authenticated user's profile as JSON.
///
/// Extracts the JWT from the request, looks up the corresponding user,
/// and returns their `id`, `email`, `name`, and `avatar_url`.
async fn get_current_user(
    auth_user: crate::middleware::auth::AuthUser,
    State(state): State<AppState>,
) -> Result<axum::Json<serde_json::Value>, AppError> {
    let user = sqlx::query_as!(
        crate::models::user::User,
        "SELECT * FROM users WHERE id = $1",
        auth_user.user_id
    )
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

#[cfg(test)]
mod tests {
    use crate::config::AppEnv;

    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use tower::ServiceExt;

    fn test_config() -> crate::config::Config {
        crate::config::Config {
            database_url: "postgres://localhost/test".to_string(),
            jwt_secret: "test_secret_key_for_tests".to_string(),
            google_client_id: String::new(),
            google_client_secret: String::new(),
            oauth_redirect_base: "http://localhost:8080".to_string(),
            supabase_s3_endpoint: String::new(),
            supabase_s3_access_key: String::new(),
            supabase_s3_secret_key: String::new(),
            supabase_storage_bucket: "files".to_string(),
            port: 8080,
            cors_origin: "http://localhost:5173".to_string(),
            frontend_url: "http://localhost:5173".to_string(),
            app_env: AppEnv::Development,
        }
    }

    /// Constructs an `AppState` suitable for error-path tests.
    ///
    /// The `PgPool` is lazy (never actually connects); the S3 client points at a
    /// stub endpoint. Tests that reach real I/O will fail, which is intentional —
    /// these helpers are only for branches that return before any DB/network call.
    fn test_state() -> crate::state::AppState {
        let config = test_config();

        let db = sqlx::postgres::PgPoolOptions::new()
            .connect_lazy(&config.database_url)
            .expect("connect_lazy should not fail for a valid URL");

        let s3_config = aws_sdk_s3::Config::builder()
            .behavior_version_latest()
            .endpoint_url("http://localhost:9000")
            .region(aws_sdk_s3::config::Region::new("us-east-1"))
            .credentials_provider(aws_sdk_s3::config::Credentials::new(
                "test", "test", None, None, "static",
            ))
            .build();

        crate::state::AppState {
            config,
            db,
            s3: aws_sdk_s3::Client::from_conf(s3_config),
            http: reqwest::Client::new(),
        }
    }

    #[tokio::test]
    async fn start_oauth_returns_400_for_unconfigured_google() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/auth/google")
            .body(Body::empty())
            .unwrap();
        let status = app.oneshot(req).await.unwrap().status();
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn start_oauth_returns_400_for_unknown_provider() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/auth/facebook")
            .body(Body::empty())
            .unwrap();
        let status = app.oneshot(req).await.unwrap().status();
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn oauth_callback_returns_400_when_csrf_cookie_missing() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/auth/google/callback?code=test_code&state=some_state")
            .body(Body::empty())
            .unwrap();
        let status = app.oneshot(req).await.unwrap().status();
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn oauth_callback_returns_400_when_state_param_missing() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/auth/google/callback?code=test_code")
            .header(header::COOKIE, "oauth_csrf=my_csrf")
            .body(Body::empty())
            .unwrap();
        let status = app.oneshot(req).await.unwrap().status();
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn oauth_callback_returns_400_when_csrf_mismatch() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/auth/google/callback?code=test_code&state=different_value")
            .header(header::COOKIE, "oauth_csrf=cookie_value")
            .body(Body::empty())
            .unwrap();
        let status = app.oneshot(req).await.unwrap().status();
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn oauth_callback_returns_400_for_unknown_provider() {
        let app = router().with_state(test_state());
        let req = Request::builder()
            .uri("/auth/twitter/callback?code=test_code&state=csrf_tok")
            .header(header::COOKIE, "oauth_csrf=csrf_tok")
            .body(Body::empty())
            .unwrap();
        let status = app.oneshot(req).await.unwrap().status();
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }
}
