#!/usr/bin/env python3
"""Shared utilities for MDHD admin scripts.

Provides database and S3 connections, byte formatting, and common Rich UI
components (user table, user picker) reused across all scripts.
"""

import os
import sys

import boto3
import psycopg2
from botocore.config import Config as BotoConfig
from rich import box
from rich.console import Console
from rich.prompt import Prompt
from rich.table import Table

DB_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mdhd"
)
MINIO_ENDPOINT = os.environ.get("SUPABASE_S3_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.environ.get("SUPABASE_S3_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.environ.get("SUPABASE_S3_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "files")

console = Console()


def get_db():
    """Return a new psycopg2 connection using DATABASE_URL."""
    return psycopg2.connect(DB_URL)


def get_s3():
    """Return a boto3 S3 client pointed at the configured MinIO/Supabase Storage endpoint."""
    return boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        region_name=os.environ.get("AWS_REGION", "us-east-1"),
        config=BotoConfig(signature_version="s3v4"),
    )


def humanize_bytes(size: int) -> str:
    """Convert a byte count to a human-readable string (e.g. 1536 → '1.5 KB')."""
    n = float(size)
    for unit in ("B", "KB", "MB", "GB"):
        if abs(n) < 1024:
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def render_user_table(users: list[tuple], count_col: str = "Count") -> None:
    """Print a Rich table listing all users with index, name, email, provider, count, and join date."""
    table = Table(title="Users", box=box.ROUNDED, show_lines=False)
    table.add_column("#", style="dim", width=3, justify="right")
    table.add_column("Name", style="bold")
    table.add_column("Email", style="cyan")
    table.add_column("Provider", style="blue")
    table.add_column(count_col, justify="right", style="magenta")
    table.add_column("Created", style="green")

    for i, (uid, name, email, provider, created, count) in enumerate(users, 1):
        table.add_row(
            str(i),
            name or "[dim]—[/dim]",
            email,
            provider or "—",
            str(count),
            str(created)[:10],
        )

    console.print(table)


def pick_user(
    users: list[tuple],
    title: str = "MDHD Inspector",
    count_col: str = "Count",
) -> tuple:
    """Show the users table and prompt for a number. Returns the chosen row."""
    while True:
        console.clear()
        console.rule(f"[bold cyan]{title}[/bold cyan]")
        render_user_table(users, count_col)
        console.print()

        raw = Prompt.ask(
            "[bold]Select user[/bold] [dim](number, or q to quit)[/dim]",
            default="q",
        )
        if raw.lower() == "q":
            console.print("[dim]Bye.[/dim]")
            sys.exit(0)

        if raw.isdigit() and 1 <= int(raw) <= len(users):
            return users[int(raw) - 1]

        console.print(
            f"[red]Invalid choice '{raw}' — enter a number between 1 and {len(users)}.[/red]"
        )
        Prompt.ask("[dim]Press Enter to try again[/dim]", default="")
