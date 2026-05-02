#!/usr/bin/env python3
"""Verify or refresh the sqlx offline query cache (.sqlx/).

Modes:
    check (default)
        Runs `SQLX_OFFLINE=true cargo check`. Fast, needs no database.
        Exits 0 if .sqlx/ matches the code, 1 if stale.

    fix
        Runs `cargo sqlx prepare` against DATABASE_URL loaded from
        .env.development (or whichever env file you point it at), regenerating
        .sqlx/. Use this after `check` fails.

Usage:
    server/scripts/.venv/bin/python server/scripts/sqlx_sync.py            # check
    server/scripts/.venv/bin/python server/scripts/sqlx_sync.py fix        # regen
    ENV_FILE=.env.production ... sqlx_sync.py fix                          # custom env

Wired into the root Makefile as:
    make sqlx-check
    make sqlx-prepare
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

GREEN = "\033[0;32m"
RED = "\033[0;31m"
YELLOW = "\033[0;33m"
BOLD = "\033[1m"
RESET = "\033[0m"

SERVER_DIR = Path(__file__).resolve().parent.parent


def load_env(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    out: dict[str, str] = {}
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        out[key.strip()] = val.strip().strip('"').strip("'")
    return out


def run_check() -> int:
    print(f"{BOLD}==> Verifying .sqlx/ cache (SQLX_OFFLINE=true cargo check){RESET}")
    env = {**os.environ, "SQLX_OFFLINE": "true"}
    # Unset DATABASE_URL so sqlx can't fall back to a live connection and
    # mask a stale cache.
    env.pop("DATABASE_URL", None)
    result = subprocess.run(
        ["cargo", "check", "--all-targets", "--quiet"],
        cwd=SERVER_DIR,
        env=env,
    )
    if result.returncode == 0:
        print(f"{GREEN}OK — .sqlx/ is in sync with the code.{RESET}")
        return 0
    print()
    print(f"{RED}FAIL — .sqlx/ is stale or missing query metadata.{RESET}")
    print(f"{YELLOW}Run: make sqlx-prepare   (or: python sqlx_sync.py fix){RESET}")
    return 1


def run_fix() -> int:
    # Default to .env.supabase (session-pooler URL for admin ops) if it exists,
    # otherwise fall back to .env.development (local Docker).
    default = SERVER_DIR / ".env.supabase"
    if not default.exists():
        default = SERVER_DIR / ".env.development"
    env_file = Path(os.environ.get("ENV_FILE", default))
    print(f"{BOLD}==> Regenerating .sqlx/ using {env_file.name}{RESET}")

    file_env = load_env(env_file)
    db_url = os.environ.get("DATABASE_URL") or file_env.get("DATABASE_URL")
    if not db_url:
        print(f"{RED}DATABASE_URL not set in environment or {env_file}{RESET}")
        return 1

    print(f"  using DATABASE_URL host: {db_url.split('@')[-1].split('/')[0]}")
    env = {**os.environ, "DATABASE_URL": db_url}
    result = subprocess.run(
        ["cargo", "sqlx", "prepare", "--", "--all-targets"],
        cwd=SERVER_DIR,
        env=env,
    )
    if result.returncode != 0:
        print(f"{RED}cargo sqlx prepare failed.{RESET}")
        return result.returncode

    print()
    print(f"{GREEN}OK — .sqlx/ regenerated.{RESET}")
    print(f"{YELLOW}Don't forget: git add .sqlx && git commit{RESET}")
    return 0


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "check"
    if mode == "check":
        return run_check()
    if mode == "fix":
        return run_fix()
    print(f"{RED}Unknown mode: {mode}{RESET}")
    print("Usage: sqlx_sync.py [check|fix]")
    return 2


if __name__ == "__main__":
    sys.exit(main())
