#!/usr/bin/env bash
#
# oha smoke run against /api/health. No auth, no DB — represents the middleware
# ceiling. See perf/README.md for interpretation.
set -euo pipefail

HOST="${MDHD_HOST:-http://127.0.0.1:8080}"
DURATION="${MDHD_PERF_DURATION:-30s}"
CONCURRENCY="${MDHD_PERF_CONCURRENCY:-50}"

if ! command -v oha >/dev/null 2>&1; then
  echo "oha not found on PATH — install with: cargo install oha" >&2
  exit 1
fi

echo "→ ${HOST}/api/health  (duration=${DURATION} c=${CONCURRENCY})"
exec oha \
  -z "${DURATION}" \
  -c "${CONCURRENCY}" \
  --no-tui \
  "${HOST}/api/health"
