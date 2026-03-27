pub mod auth;
pub mod files;
pub mod settings;
pub mod sync;

use axum::Router;

use crate::state::AppState;

pub fn create_router() -> Router<AppState> {
    Router::new()
        .merge(auth::router())
        .merge(files::router())
        .merge(settings::router())
        .merge(sync::router())
}
