FROM lukemathwalker/cargo-chef:latest-rust-1-slim-bookworm AS planner
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

FROM lukemathwalker/cargo-chef:latest-rust-1-slim-bookworm AS cacher
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  pkg-config libssl-dev \
  && rm -rf /var/lib/apt/lists/*
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json


FROM rust:1-slim-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  pkg-config libssl-dev \
  && rm -rf /var/lib/apt/lists/*
COPY --from=cacher /app/target target
COPY --from=cacher /usr/local/cargo /usr/local/cargo
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations
COPY .sqlx ./.sqlx
ENV SQLX_OFFLINE=true
RUN cargo build --release --bin mdhd-server

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 mdhd \
  && useradd  --system --uid 1001 --gid mdhd mdhd

WORKDIR /app
COPY --from=builder /app/target/release/mdhd-server /usr/local/bin/mdhd-server
COPY --from=builder /app/migrations /app/migrations

USER mdhd
ENV APP_ENV=production \
  PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT}/api/health" || exit 1

ENTRYPOINT ["/usr/local/bin/mdhd-server"]
