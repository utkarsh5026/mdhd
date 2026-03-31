pub mod analytics;
pub mod auth;
pub mod bookmarks;
pub mod files;
pub mod github;
pub mod settings;
pub mod share;
pub mod sync;
pub mod utils;

use axum::Router;
use axum::routing::get;

use crate::state::AppState;

pub fn create_router() -> Router<AppState> {
    let api = Router::new()
        .route("/share/{token}", get(share::get_shared_content))
        .merge(analytics::router())
        .merge(bookmarks::router())
        .merge(files::router())
        .merge(github::router())
        .merge(settings::router())
        .merge(share::router())
        .merge(sync::router());

    Router::new().merge(auth::router()).nest("/api", api)
}
