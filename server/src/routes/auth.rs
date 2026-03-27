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
#[derive(Debug)]
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
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    // ── helpers ────────────────────────────────────────────────────────────────

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

    /// Helper so each test can call the extractor without repeating boilerplate.
    async fn extract_csrf(req: Request<Body>) -> Result<CsrfCookie, AppError> {
        let (mut parts, _) = req.into_parts();
        CsrfCookie::from_request_parts(&mut parts, &()).await
    }

    #[tokio::test]
    async fn csrf_cookie_extracted_when_present() {
        let req = Request::builder()
            .header(header::COOKIE, "oauth_csrf=my_token_123")
            .body(Body::empty())
            .unwrap();
        let csrf = extract_csrf(req).await.unwrap();
        assert_eq!(csrf.0, "my_token_123");
    }

    #[tokio::test]
    async fn csrf_cookie_returns_bad_request_when_absent() {
        let req = Request::builder().body(Body::empty()).unwrap();
        let err = extract_csrf(req).await.unwrap_err();
        assert!(matches!(err, AppError::BadRequest(_)));
    }

    #[tokio::test]
    async fn csrf_cookie_returns_bad_request_when_only_other_cookies_present() {
        let req = Request::builder()
            .header(header::COOKIE, "session=abc; other=xyz")
            .body(Body::empty())
            .unwrap();
        let err = extract_csrf(req).await.unwrap_err();
        assert!(matches!(err, AppError::BadRequest(_)));
    }

    #[tokio::test]
    async fn csrf_cookie_found_among_multiple_cookies() {
        let req = Request::builder()
            .header(
                header::COOKIE,
                "session=abc; oauth_csrf=csrf_value; other=xyz",
            )
            .body(Body::empty())
            .unwrap();
        let csrf = extract_csrf(req).await.unwrap();
        assert_eq!(csrf.0, "csrf_value");
    }

    #[tokio::test]
    async fn csrf_cookie_value_is_trimmed() {
        let req = Request::builder()
            .header(header::COOKIE, "oauth_csrf= spaced_token ")
            .body(Body::empty())
            .unwrap();
        let csrf = extract_csrf(req).await.unwrap();
        assert_eq!(csrf.0, "spaced_token");
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
