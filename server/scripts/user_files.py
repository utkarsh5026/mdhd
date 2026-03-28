#!/usr/bin/env python3
"""Inspect files for a user in Postgres and MinIO.

Setup:
    pip install -r scripts/requirements.txt

Usage:
    python scripts/user_files.py <email-or-user-id>          # show DB + MinIO
    python scripts/user_files.py <email-or-user-id> --db     # DB only
    python scripts/user_files.py <email-or-user-id> --minio  # MinIO only
    python scripts/user_files.py <email-or-user-id> --cat <storage-key>  # print file content
    python scripts/user_files.py --list-users                # list all users
"""

import argparse
import os
import re
import sys

import boto3
import psycopg2
from botocore.config import Config as BotoConfig
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

DB_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mdhd"
)
MINIO_ENDPOINT = os.environ.get("SUPABASE_S3_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.environ.get("SUPABASE_S3_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.environ.get("SUPABASE_S3_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "files")

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)

console = Console()


def get_db():
    """Return a new psycopg2 connection using DB_URL."""
    return psycopg2.connect(DB_URL)


def get_s3():
    """Return a boto3 S3 client configured for the MinIO/Supabase Storage endpoint."""
    return boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        region_name=os.environ.get("AWS_REGION", "us-east-1"),
        config=BotoConfig(signature_version="s3v4"),
    )


def humanize_bytes(size: int) -> str:
    """Convert a byte count to a human-readable string (e.g. 1536 -> '1.5 KB')."""
    n = float(size)
    for unit in ("B", "KB", "MB", "GB"):
        if abs(n) < 1024:
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def resolve_user_id(identifier: str) -> str:
    """Resolve an email address or UUID string to a user UUID.

    If *identifier* already looks like a UUID it is returned as-is.
    Otherwise the users table is queried by email and the matching UUID is
    returned.  Exits with an error message if no user is found.
    """
    if UUID_RE.match(identifier):
        return identifier

    with get_db() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, name, email FROM users WHERE email = %s", (identifier,))
        row = cur.fetchone()

    if not row:
        console.print(f"[red]No user found with email '{identifier}'[/red]")
        sys.exit(1)

    user_id, name, email = row
    console.print(f"[dim]Resolved {email} ({name}) -> {user_id}[/dim]\n")
    return str(user_id)


def list_users() -> None:
    """Query all users from Postgres and print them as a Rich table."""
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT u.id, u.name, u.email, u.oauth_provider, u.created_at, COUNT(f.id) AS file_count "
            "FROM users u LEFT JOIN files f ON u.id = f.user_id "
            "GROUP BY u.id ORDER BY u.created_at DESC"
        )
        rows = cur.fetchall()

    if not rows:
        console.print("[yellow]No users found.[/yellow]")
        return

    table = Table(title="All Users")
    table.add_column("ID", style="dim")
    table.add_column("Name", style="bold")
    table.add_column("Email", style="cyan")
    table.add_column("Provider")
    table.add_column("Created", style="green")
    table.add_column("Files", justify="right", style="magenta")

    for uid, name, email, provider, created, count in rows:
        table.add_row(
            str(uid), name or "", email, provider or "", str(created), str(count)
        )

    console.print(table)


def show_db_files(user_id: str) -> None:
    """Print a Rich table of all files belonging to *user_id* in Postgres."""
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT name, path, storage_key, size_bytes, content_hash, updated_at "
            "FROM files WHERE user_id = %s ORDER BY path",
            (user_id,),
        )
        rows = cur.fetchall()

    if not rows:
        console.print("[yellow]No files in Postgres for this user.[/yellow]")
        return

    table = Table(title="Files in Postgres")
    table.add_column("Name", style="bold")
    table.add_column("Path", style="cyan")
    table.add_column("Storage Key", style="dim")
    table.add_column("Size", justify="right", style="green")
    table.add_column("Hash", style="dim", max_width=12)
    table.add_column("Updated", style="magenta")

    for name, path, key, size, hash_, updated in rows:
        table.add_row(
            name,
            path,
            key,
            humanize_bytes(size),
            (hash_[:12] + "...") if hash_ else "-",
            str(updated),
        )

    console.print(table)
    console.print(f"[dim]Total: {len(rows)} file(s)[/dim]")


def show_minio_files(user_id: str) -> None:
    """Print a Rich table of all MinIO objects stored under the *user_id* prefix."""
    s3 = get_s3()
    prefix = f"{user_id}"

    try:
        response = s3.list_objects_v2(Bucket=MINIO_BUCKET, Prefix=prefix)
    except s3.exceptions.NoSuchBucket:
        console.print(f"[red]Bucket '{MINIO_BUCKET}' does not exist.[/red]")
        return
    except Exception as e:
        console.print(f"[red]MinIO error: {e}[/red]")
        return

    objects = response.get("Contents", [])
    if not objects:
        console.print(f"[yellow]No objects in MinIO under prefix '{prefix}'.[/yellow]")
        return

    table = Table(title="Objects in MinIO")
    table.add_column("Key", style="cyan")
    table.add_column("Size", justify="right", style="green")
    table.add_column("Last Modified", style="magenta")
    table.add_column("ETag", style="dim", max_width=16)

    total_size = 0
    for obj in objects:
        key = obj["Key"]
        size = obj["Size"]
        total_size += size
        table.add_row(
            key.removeprefix(prefix),
            humanize_bytes(size),
            str(obj["LastModified"]),
            obj.get("ETag", "-").strip('"')[:16],
        )

    console.print(table)
    console.print(
        f"[dim]Total: {len(objects)} object(s), {humanize_bytes(total_size)}[/dim]"
    )


def cat_minio_file(storage_key: str) -> None:
    """Fetch *storage_key* from MinIO and print its content to the console.

    UTF-8 text is displayed inside a Rich panel.  Binary content that cannot
    be decoded is reported with its size instead.
    """
    s3 = get_s3()
    try:
        response = s3.get_object(Bucket=MINIO_BUCKET, Key=storage_key)
        body = response["Body"].read()
    except Exception as e:
        console.print(f"[red]Failed to read '{storage_key}': {e}[/red]")
        sys.exit(1)

    try:
        text = body.decode("utf-8")
        console.print(Panel(text, title=storage_key, border_style="cyan"))
    except UnicodeDecodeError:
        console.print(
            f"[yellow]Binary content ({humanize_bytes(len(body))}), cannot display as text.[/yellow]"
        )


def main() -> None:
    """Parse CLI arguments and dispatch to the appropriate helper function."""
    parser = argparse.ArgumentParser(
        description="Inspect files for a user in Postgres and MinIO"
    )
    parser.add_argument("user", nargs="?", help="User email or UUID")
    parser.add_argument("--db", action="store_true", help="Show only Postgres files")
    parser.add_argument("--minio", action="store_true", help="Show only MinIO objects")
    parser.add_argument(
        "--cat", metavar="KEY", help="Print content of a MinIO object by storage key"
    )
    parser.add_argument("--list-users", action="store_true", help="List all users")

    args = parser.parse_args()

    if args.list_users:
        list_users()
        return

    if not args.user:
        parser.error("user is required (or use --list-users)")

    user_id = resolve_user_id(args.user)

    if args.cat:
        cat_minio_file(args.cat)
        return

    show_both = not args.db and not args.minio

    if args.db or show_both:
        show_db_files(user_id)
        console.print()

    if args.minio or show_both:
        show_minio_files(user_id)


if __name__ == "__main__":
    main()
