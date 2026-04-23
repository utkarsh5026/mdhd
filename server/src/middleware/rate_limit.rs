//! Per-IP HTTP rate limiting using [`tower_governor`] on top of [`governor`].
//!
//! Each client is keyed by IP using [`SmartIpKeyExtractor`], which reads `Forwarded`,
//! `X-Forwarded-For`, or `X-Real-IP` (in that order) and falls back to the TCP peer address
//! from [`axum::extract::ConnectInfo`]. The app must be served with
//! [`axum::Router::into_make_service_with_connect_info`] so the fallback works.
//!
//! # Deployment requirement
//!
//! This extractor **trusts** forwarded headers. Deploy only behind a reverse proxy
//! (Railway, Fly.io, Render, Cloudflare, nginx, etc.) that strips or overrides these
//! headers from client requests — otherwise clients can spoof their IP to bypass the
//! limit. All platforms listed in `CLAUDE.md` do this by default.
//!
//! The token-bucket policy matches the earlier in-process limiter: burst **100**, steady **50**
//! requests per second. Apply the stack with [`layer`].

use std::time::Duration;

use axum::body::Body;
use axum::http::{Response, StatusCode};
use axum::response::IntoResponse;
use governor::middleware::NoOpMiddleware;
use tower_governor::GovernorError;
use tower_governor::GovernorLayer;
use tower_governor::governor::GovernorConfigBuilder;
use tower_governor::key_extractor::SmartIpKeyExtractor;

/// Maximum tokens in the bucket; allows short bursts up to this many requests before refill
/// pacing applies.
const BURST_SIZE: u32 = 100;
/// One token every 20 ms ⇒ 50 tokens/s sustained rate.
const REFILL_INTERVAL: Duration = Duration::from_millis(20);

/// Returns a [`GovernorLayer`] that rate-limits by client IP and maps quota exhaustion to **429**.
///
/// [`GovernorError::TooManyRequests`] becomes `429 Too Many Requests` with a short plain-text
/// body. Other [`GovernorError`] variants are turned into an HTTP response via [`Response::from`].
///
/// # Panics
///
/// Panics if the governor configuration fails to build. With the non-zero constants in this
/// module, that indicates a programming error rather than runtime input.
pub fn layer() -> GovernorLayer<SmartIpKeyExtractor, NoOpMiddleware, Body> {
    let config = GovernorConfigBuilder::default()
        .const_period(REFILL_INTERVAL)
        .const_burst_size(BURST_SIZE)
        .key_extractor(SmartIpKeyExtractor)
        .finish()
        .expect("non-zero burst and refill interval");

    GovernorLayer::new(config).error_handler(|err| match err {
        GovernorError::TooManyRequests { .. } => {
            (StatusCode::TOO_MANY_REQUESTS, "Rate limit exceeded").into_response()
        }
        err => Response::from(err),
    })
}
