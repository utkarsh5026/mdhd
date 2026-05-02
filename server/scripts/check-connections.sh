#!/usr/bin/env bash
# Pings Supabase Postgres and S3 using values from server/.env to confirm
# the credentials and network paths work before deploying.
#
# Usage:
#   ./scripts/check-connections.sh           # uses server/.env
#   ENV_FILE=.env.production ./scripts/check-connections.sh

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${ENV_FILE:-$SERVER_DIR/.env}"

red()    { printf '\033[0;31m%s\033[0m\n' "$*"; }
green()  { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }
bold()   { printf '\033[1m%s\033[0m\n' "$*"; }

if [[ ! -f "$ENV_FILE" ]]; then
  red "env file not found: $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

fail=0
skipped=0

bold "==> Postgres"
if [[ -z "${DATABASE_URL:-}" ]]; then
  red "DATABASE_URL is not set in $ENV_FILE"
  fail=1
elif ! command -v psql >/dev/null 2>&1; then
  yellow "psql not installed; skipping. Install with: sudo apt install postgresql-client"
  skipped=1
else
  if out=$(psql "$DATABASE_URL" -X -A -t -c "SELECT version();" 2>&1); then
    green "OK"
    echo "  $out"
    table_count=$(psql "$DATABASE_URL" -X -A -t -c \
      "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "?")
    echo "  public tables: $table_count"
  else
    red "FAIL"
    echo "$out" | sed 's/^/  /'
    fail=1
  fi
fi

echo
bold "==> S3 (Supabase Storage)"
missing=()
[[ -z "${SUPABASE_S3_ENDPOINT:-}"   ]] && missing+=(SUPABASE_S3_ENDPOINT)
[[ -z "${SUPABASE_S3_ACCESS_KEY:-}" ]] && missing+=(SUPABASE_S3_ACCESS_KEY)
[[ -z "${SUPABASE_S3_SECRET_KEY:-}" ]] && missing+=(SUPABASE_S3_SECRET_KEY)
bucket="${SUPABASE_STORAGE_BUCKET:-files}"

if (( ${#missing[@]} > 0 )); then
  red "missing env vars: ${missing[*]}"
  fail=1
elif ! command -v aws >/dev/null 2>&1; then
  yellow "aws CLI not installed; skipping. Install with: sudo apt install awscli"
  skipped=1
else
  export AWS_ACCESS_KEY_ID="$SUPABASE_S3_ACCESS_KEY"
  export AWS_SECRET_ACCESS_KEY="$SUPABASE_S3_SECRET_KEY"
  export AWS_REGION="${SUPABASE_S3_REGION:-us-east-1}"

  if out=$(aws s3 ls "s3://$bucket" --endpoint-url "$SUPABASE_S3_ENDPOINT" 2>&1); then
    green "OK — bucket '$bucket' reachable"
    obj_count=$(printf '%s\n' "$out" | grep -c . || true)
    echo "  objects/prefixes at root: $obj_count"
  else
    red "FAIL"
    echo "$out" | sed 's/^/  /'
    fail=1
  fi
fi

echo
if (( fail != 0 )); then
  red "One or more checks failed."
  exit 1
elif (( skipped != 0 )); then
  yellow "Some checks skipped (missing CLI tools). Install psql / aws and rerun."
  exit 2
else
  green "All checks passed."
fi
