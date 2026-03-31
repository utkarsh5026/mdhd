//! `OAuth2` client construction and user profile fetching for supported providers.
//!
//! Currently, supports Google `OAuth2`. Each provider has a typed client constructor
//! and a user info fetcher that exchanges an access token for profile data.
//!
//! To add a new provider, define its endpoint constants, a client constructor
//! (similar to [`google_client`]), and a userinfo fetcher that delegates to
//! [`fetch_user_info`].

use oauth2::basic::{BasicClient, BasicTokenType};
use oauth2::{
    AuthUrl, ClientId, ClientSecret, EmptyExtraTokenFields, RedirectUrl,
    RevocationErrorResponseType, TokenUrl,
};

use crate::config::Config;
use crate::errors::{AppError, ResultExt};

/// Google `OAuth2` authorization endpoint (consent screen).
const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
/// Google `OAuth2` token exchange endpoint.
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
/// Google `OpenID` Connect userinfo endpoint (returns profile data for an access token).
const GOOGLE_USERINFO_URL: &str = "https://www.googleapis.com/oauth2/v3/userinfo";

/// GitHub `OAuth2` authorization endpoint.
const GITHUB_AUTH_URL: &str = "https://github.com/login/oauth/authorize";
/// GitHub `OAuth2` token exchange endpoint.
const GITHUB_TOKEN_URL: &str = "https://github.com/login/oauth/access_token";
/// GitHub user profile endpoint.
const GITHUB_USERINFO_URL: &str = "https://api.github.com/user";
/// GitHub user emails endpoint (needed when profile email is private).
const GITHUB_EMAILS_URL: &str = "https://api.github.com/user/emails";

/// Fully-specified `OAuth2` client type for Google, with auth and token endpoints set.
pub type GoogleOAuthClient = oauth2::Client<
    oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>,
    oauth2::StandardTokenResponse<EmptyExtraTokenFields, BasicTokenType>,
    oauth2::StandardTokenIntrospectionResponse<EmptyExtraTokenFields, BasicTokenType>,
    oauth2::StandardRevocableToken,
    oauth2::StandardErrorResponse<RevocationErrorResponseType>,
    oauth2::EndpointSet,
    oauth2::EndpointNotSet,
    oauth2::EndpointNotSet,
    oauth2::EndpointNotSet,
    oauth2::EndpointSet,
>;

/// Profile data returned by Google's userinfo endpoint.
#[derive(Debug, serde::Deserialize)]
pub struct GoogleUserInfo {
    /// Google's unique, stable user identifier.
    pub sub: String,
    /// The user's primary email address from their Google account.
    pub email: String,
    /// Display name, if the user has set one on their Google profile.
    pub name: Option<String>,
    /// URL to the user's Google profile photo.
    pub picture: Option<String>,
}

/// Parses a URL string into an oauth2 URL type, returning [`AppError::Internal`] on failure.
fn parse_oauth_url<T, E: std::fmt::Display>(
    ctor: impl FnOnce(String) -> Result<T, E>,
    url: String,
    label: &str,
) -> Result<T, AppError> {
    ctor(url).internal(&format!("Invalid {label} URL"))
}

/// Constructs a [`GoogleOAuthClient`] configured with credentials and URLs from [`Config`].
///
/// The redirect URL is derived from `config.oauth_redirect_base` with the path
/// `/auth/google/callback` appended.
///
/// # Errors
///
/// Returns [`AppError::Internal`] if any of the `OAuth2` URLs fail to parse.
pub fn google_client(config: &Config) -> Result<GoogleOAuthClient, AppError> {
    let client_id = ClientId::new(config.google_client_id());
    let client_secret = ClientSecret::new(config.google_client_secret());
    let redirect_url = config.oauth_redirect_url("google");

    let client = BasicClient::new(client_id)
        .set_client_secret(client_secret)
        .set_auth_uri(parse_oauth_url(
            AuthUrl::new,
            GOOGLE_AUTH_URL.to_string(),
            "auth",
        )?)
        .set_token_uri(parse_oauth_url(
            TokenUrl::new,
            GOOGLE_TOKEN_URL.to_string(),
            "token",
        )?)
        .set_redirect_uri(parse_oauth_url(RedirectUrl::new, redirect_url, "redirect")?);

    Ok(client)
}

/// Fetches the authenticated user's Google profile using an `OAuth2` access token.
///
/// This is a thin wrapper around [`fetch_user_info`] that supplies Google's userinfo URL.
///
/// # Errors
///
/// Returns [`AppError::Internal`] if the HTTP request or response deserialization fails.
pub async fn fetch_google_user_info(
    client: &reqwest::Client,
    access_token: &str,
) -> Result<GoogleUserInfo, AppError> {
    fetch_user_info(client, GOOGLE_USERINFO_URL, access_token).await
}

/// Fetches user profile JSON from the given URL using a bearer token.
///
/// Sends a `GET` request with `Authorization: Bearer {access_token}` and deserializes
/// the response body into [`GoogleUserInfo`].
///
/// # Errors
///
/// Returns [`AppError::Internal`] if the HTTP request fails, the endpoint returns
/// a non-2xx status, or the response body cannot be deserialized.
pub(crate) async fn fetch_user_info(
    client: &reqwest::Client,
    url: &str,
    access_token: &str,
) -> Result<GoogleUserInfo, AppError> {
    let response = client
        .get(url)
        .bearer_auth(access_token)
        .send()
        .await
        .internal("Failed to fetch user info")?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(AppError::internal(format!(
            "Userinfo endpoint returned {status}: {body}"
        )));
    }

    response
        .json::<GoogleUserInfo>()
        .await
        .internal("Failed to parse user info")
}

/// Fully-specified `OAuth2` client type for GitHub.
pub type GitHubOAuthClient = oauth2::Client<
    oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>,
    oauth2::StandardTokenResponse<EmptyExtraTokenFields, BasicTokenType>,
    oauth2::StandardTokenIntrospectionResponse<EmptyExtraTokenFields, BasicTokenType>,
    oauth2::StandardRevocableToken,
    oauth2::StandardErrorResponse<RevocationErrorResponseType>,
    oauth2::EndpointSet,
    oauth2::EndpointNotSet,
    oauth2::EndpointNotSet,
    oauth2::EndpointNotSet,
    oauth2::EndpointSet,
>;

/// Profile data returned by GitHub's user endpoint.
#[derive(Debug, serde::Deserialize)]
pub struct GitHubUserInfo {
    pub id: i64,
    pub login: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}

/// A single email entry from GitHub's `/user/emails` endpoint.
#[derive(Debug, serde::Deserialize)]
struct GitHubEmail {
    email: String,
    primary: bool,
    verified: bool,
}

/// Constructs a [`GitHubOAuthClient`] configured with credentials and URLs from [`Config`].
pub fn github_client(config: &Config) -> Result<GitHubOAuthClient, AppError> {
    let client_id = ClientId::new(config.github_client_id());
    let client_secret = ClientSecret::new(config.github_client_secret());
    let redirect_url = config.oauth_redirect_url("github");

    let client = BasicClient::new(client_id)
        .set_client_secret(client_secret)
        .set_auth_uri(parse_oauth_url(
            AuthUrl::new,
            GITHUB_AUTH_URL.to_string(),
            "GitHub auth",
        )?)
        .set_token_uri(parse_oauth_url(
            TokenUrl::new,
            GITHUB_TOKEN_URL.to_string(),
            "GitHub token",
        )?)
        .set_redirect_uri(parse_oauth_url(RedirectUrl::new, redirect_url, "redirect")?);

    Ok(client)
}

/// Fetches the authenticated user's GitHub profile. If the profile email is
/// `None` (private), falls back to the `/user/emails` endpoint.
pub async fn fetch_github_user_info(
    client: &reqwest::Client,
    access_token: &str,
) -> Result<GitHubUserInfo, AppError> {
    let response = client
        .get(GITHUB_USERINFO_URL)
        .bearer_auth(access_token)
        .header("User-Agent", "mdhd-server")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .internal("Failed to fetch GitHub user info")?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(AppError::internal(format!(
            "GitHub userinfo returned {status}: {body}"
        )));
    }

    let mut info: GitHubUserInfo = response
        .json()
        .await
        .internal("Failed to parse GitHub user info")?;

    // If the user's email is private, fetch from /user/emails
    if info.email.is_none()
        && let Ok(email) = fetch_github_primary_email(client, access_token).await
    {
        info.email = Some(email);
    }

    Ok(info)
}

/// Fetches the user's primary verified email from GitHub.
async fn fetch_github_primary_email(
    client: &reqwest::Client,
    access_token: &str,
) -> Result<String, AppError> {
    let response = client
        .get(GITHUB_EMAILS_URL)
        .bearer_auth(access_token)
        .header("User-Agent", "mdhd-server")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .internal("Failed to fetch GitHub emails")?;

    if !response.status().is_success() {
        return Err(AppError::internal("GitHub emails endpoint failed"));
    }

    let emails: Vec<GitHubEmail> = response
        .json()
        .await
        .internal("Failed to parse GitHub emails")?;

    emails
        .into_iter()
        .find(|e| e.primary && e.verified)
        .map(|e| e.email)
        .ok_or_else(|| AppError::internal("No primary verified email on GitHub account"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use wiremock::matchers::{header, method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    fn test_config() -> crate::config::Config {
        let mut config = crate::testutil::test_config();
        config.google_client_id = "test-client-id".into();
        config.google_client_secret = "test-client-secret".into();
        config
    }

    #[test]
    fn google_client_builds_successfully() {
        let config = test_config();
        let client = google_client(&config);
        assert!(client.is_ok());
    }

    #[test]
    fn oauth_redirect_url_formats_correctly() {
        let config = test_config();
        assert_eq!(
            config.oauth_redirect_url("google"),
            "http://localhost:8080/auth/google/callback"
        );
    }

    #[tokio::test]
    async fn fetch_user_info_parses_valid_response() {
        let server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/userinfo"))
            .and(header("Authorization", "Bearer test-token"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
                "sub": "12345",
                "email": "user@example.com",
                "name": "Test User",
                "picture": "https://example.com/photo.jpg"
            })))
            .mount(&server)
            .await;

        let client = reqwest::Client::new();
        let url = format!("{}/userinfo", server.uri());
        let result = fetch_user_info(&client, &url, "test-token").await.unwrap();

        assert_eq!(result.sub, "12345");
        assert_eq!(result.email, "user@example.com");
        assert_eq!(result.name.as_deref(), Some("Test User"));
        assert_eq!(
            result.picture.as_deref(),
            Some("https://example.com/photo.jpg")
        );
    }

    #[tokio::test]
    async fn fetch_user_info_returns_error_on_401() {
        let server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/userinfo"))
            .respond_with(ResponseTemplate::new(401).set_body_string("Unauthorized"))
            .mount(&server)
            .await;

        let client = reqwest::Client::new();
        let url = format!("{}/userinfo", server.uri());
        let result = fetch_user_info(&client, &url, "bad-token").await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn fetch_user_info_returns_error_on_invalid_json() {
        let server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/userinfo"))
            .respond_with(ResponseTemplate::new(200).set_body_string("not json"))
            .mount(&server)
            .await;

        let client = reqwest::Client::new();
        let url = format!("{}/userinfo", server.uri());
        let result = fetch_user_info(&client, &url, "test-token").await;

        assert!(result.is_err());
    }
}
