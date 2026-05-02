#!/usr/bin/env bash
#
# oha run against the authenticated /api/files list endpoint. Exercises the
# full stack (auth, rate-limit, DB round-trip). See perf/README.md.
set -euo pipefail

: "${MDHD_TEST_JWT:?MDHD_TEST_JWT must be set — see perf/README.md for how to mint one}"

HOST="${MDHD_HOST:-http://127.0.0.1:8080}"
DURATION="${MDHD_PERF_DURATION:-30s}"
CONCURRENCY="${MDHD_PERF_CONCURRENCY:-20}"

if ! command -v oha >/dev/null 2>&1; then
  echo "oha not found on PATH — install with: cargo install oha" >&2
  exit 1
fi

echo "→ ${HOST}/api/files  (duration=${DURATION} c=${CONCURRENCY})"
exec oha \
  -z "${DURATION}" \
  -c "${CONCURRENCY}" \
  -H "Authorization: Bearer ${MDHD_TEST_JWT}" \
  --no-tui \
  "${HOST}/api/files"
