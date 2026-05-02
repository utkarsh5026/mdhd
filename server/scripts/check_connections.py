#!/usr/bin/env python3
"""Ping Supabase Postgres and S3 using values from server/.env.

Run with the project's existing venv:
    server/scripts/.venv/bin/python server/scripts/check_connections.py

Or via the wrapper:
    server/scripts/check-connections.sh
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

GREEN = "\033[0;32m"
RED = "\033[0;31m"
YELLOW = "\033[0;33m"
BOLD = "\033[1m"
RESET = "\033[0m"


def load_env(path: Path, override: bool = False) -> None:
    if not path.exists():
        print(f"{RED}env file not found: {path}{RESET}")
        sys.exit(1)
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if override or key not in os.environ:
            os.environ[key] = val


def check_postgres() -> bool:
    print(f"{BOLD}==> Postgres{RESET}")
    url = os.environ.get("DATABASE_URL")
    if not url:
        print(f"{RED}DATABASE_URL is not set{RESET}")
        return False
    try:
        import psycopg2
    except ImportError:
        print(f"{RED}psycopg2 not installed in this Python env{RESET}")
        return False
    try:
        with psycopg2.connect(url, connect_timeout=10) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()[0]
                cur.execute(
                    "SELECT count(*) FROM information_schema.tables "
                    "WHERE table_schema='public';"
                )
                tables = cur.fetchone()[0]
                cur.execute(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema='public' ORDER BY table_name;"
                )
                table_list = [r[0] for r in cur.fetchall()]
        print(f"{GREEN}OK{RESET}")
        print(f"  {version}")
        print(f"  public tables: {tables} {table_list if table_list else ''}")
        return True
    except Exception as e:  # noqa: BLE001
        print(f"{RED}FAIL{RESET}")
        print(f"  {e}")
        return False


def check_s3() -> bool:
    print(f"{BOLD}==> S3 (Supabase Storage){RESET}")
    endpoint = os.environ.get("SUPABASE_S3_ENDPOINT")
    access = os.environ.get("SUPABASE_S3_ACCESS_KEY")
    secret = os.environ.get("SUPABASE_S3_SECRET_KEY")
    bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "files")
    region = os.environ.get("SUPABASE_S3_REGION", "us-east-1")

    missing = [
        n
        for n, v in [
            ("SUPABASE_S3_ENDPOINT", endpoint),
            ("SUPABASE_S3_ACCESS_KEY", access),
            ("SUPABASE_S3_SECRET_KEY", secret),
        ]
        if not v
    ]
    if missing:
        print(f"{RED}missing env vars: {', '.join(missing)}{RESET}")
        return False

    try:
        import boto3
        from botocore.config import Config
    except ImportError:
        print(f"{RED}boto3 not installed in this Python env{RESET}")
        return False

    try:
        client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access,
            aws_secret_access_key=secret,
            region_name=region,
            config=Config(
                signature_version="s3v4", connect_timeout=10, read_timeout=10
            ),
        )
        resp = client.list_objects_v2(Bucket=bucket, MaxKeys=5)
        count = resp.get("KeyCount", 0)
        print(f"{GREEN}OK — bucket '{bucket}' reachable{RESET}")
        print(f"  objects (sample, max 5): {count}")
        for obj in resp.get("Contents", [])[:5]:
            print(f"    - {obj['Key']} ({obj['Size']} bytes)")
        return True
    except Exception as e:  # noqa: BLE001
        print(f"{RED}FAIL{RESET}")
        print(f"  {e}")
        return False


ENV_PRESETS = {
    "dev": [".env.development", ".env"],
    "development": [".env.development", ".env"],
    "prod": [".env.production", ".env"],
    "production": [".env.production", ".env"],
}


def reset_env(keys: list[str]) -> None:
    for k in keys:
        os.environ.pop(k, None)


def run_for(server_dir: Path, target: str) -> bool:
    files = ENV_PRESETS[target]
    print(f"{BOLD}########## {target.upper()} ##########{RESET}")
    paths = [server_dir / f for f in files if (server_dir / f).exists()]
    if not paths:
        print(f"{RED}No env files found for '{target}': {files}{RESET}\n")
        return False
    print(f"Loading: {', '.join(str(p) for p in paths)}\n")
    reset_env(
        [
            "DATABASE_URL",
            "SUPABASE_S3_ENDPOINT",
            "SUPABASE_S3_ACCESS_KEY",
            "SUPABASE_S3_SECRET_KEY",
            "SUPABASE_STORAGE_BUCKET",
            "SUPABASE_S3_REGION",
        ]
    )
    # Later files override earlier ones — match the server's load order
    # (.env.{RUN_ENV} first, then .env overlays).
    for p in paths:
        load_env(p, override=True)

    pg_ok = check_postgres()
    print()
    s3_ok = check_s3()
    print()
    return pg_ok and s3_ok


def main() -> int:
    server_dir = Path(__file__).resolve().parent.parent

    # CLI arg or ENV_FILE override picks a single target; otherwise check both.
    if len(sys.argv) > 1 and sys.argv[1] in ENV_PRESETS:
        targets = [sys.argv[1]]
    elif os.environ.get("ENV_FILE"):
        env_file = Path(os.environ["ENV_FILE"])
        print(f"Using env file: {env_file}\n")
        load_env(env_file, override=True)
        ok = check_postgres() and (print() or True) and check_s3()
        print()
        print(
            f"{GREEN}All checks passed.{RESET}"
            if ok
            else f"{RED}One or more checks failed.{RESET}"
        )
        return 0 if ok else 1
    else:
        targets = ["dev", "prod"]

    results = {t: run_for(server_dir, t) for t in targets}

    print(f"{BOLD}========== Summary =========={RESET}")
    for t, ok in results.items():
        mark = f"{GREEN}OK{RESET}" if ok else f"{RED}FAIL{RESET}"
        print(f"  {t:12s} {mark}")
    return 0 if all(results.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
