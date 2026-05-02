#!/usr/bin/env python3
"""Interactive TUI inspector for user files stored in Postgres and MinIO.

Connects to the MDHD backend's Postgres database and MinIO (S3-compatible)
object storage to let you browse users, inspect their file metadata, and read
raw file content — all from the terminal.

Setup:
    pip install -r scripts/requirements.txt

Usage:
    python scripts/tui.py

    # Override connection defaults via environment variables:
    DATABASE_URL=postgresql://... SUPABASE_S3_ENDPOINT=http://... python scripts/tui.py

Environment variables (all optional, shown with defaults):
    DATABASE_URL            postgresql://postgres:postgres@localhost:5432/mdhd
    SUPABASE_S3_ENDPOINT    http://localhost:9000
    SUPABASE_S3_ACCESS_KEY  minioadmin
    SUPABASE_S3_SECRET_KEY  minioadmin
    SUPABASE_STORAGE_BUCKET files
    AWS_REGION              us-east-1
"""

import sys

from rich import box
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

from common import MINIO_BUCKET, console, get_db, get_s3, humanize_bytes, pick_user


def fetch_users() -> list[tuple]:
    """Return all users with their file counts, ordered by creation date (newest first).

    Each row: (id, name, email, oauth_provider, created_at, file_count)
    """
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT u.id, u.name, u.email, u.oauth_provider, u.created_at, COUNT(f.id) "
            "FROM users u LEFT JOIN files f ON u.id = f.user_id "
            "GROUP BY u.id ORDER BY u.created_at DESC"
        )
        return cur.fetchall()


def fetch_db_files(user_id: str) -> list[tuple]:
    """Return all file metadata rows for a user from Postgres, ordered by path.

    Each row: (name, path, storage_key, size_bytes, content_hash, updated_at)
    """
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT name, path, storage_key, size_bytes, content_hash, updated_at "
            "FROM files WHERE user_id = %s ORDER BY path",
            (user_id,),
        )
        return cur.fetchall()


def fetch_minio_files(user_id: str) -> list[dict]:
    """List all S3 objects in the bucket whose key starts with user_id.

    Returns the raw Contents list from ListObjectsV2, or [] on error.
    Each item is a dict with at least: Key, Size, LastModified.
    """
    s3 = get_s3()
    try:
        response = s3.list_objects_v2(Bucket=MINIO_BUCKET, Prefix=user_id)
        return response.get("Contents", [])
    except Exception as e:
        console.print(f"[red]MinIO error: {e}[/red]")
        return []


def fetch_minio_content(storage_key: str) -> bytes | None:
    """Download and return the raw bytes for a single object from MinIO.

    Returns None if the object cannot be read (logs the error to the console).
    """
    s3 = get_s3()
    try:
        response = s3.get_object(Bucket=MINIO_BUCKET, Key=storage_key)
        return response["Body"].read()
    except Exception as e:
        console.print(f"[red]Failed to read '{storage_key}': {e}[/red]")
        return None


def render_db_files(files: list[tuple], user_name: str) -> None:
    """Print a Rich table of Postgres file rows for the given user."""
    if not files:
        console.print("[yellow]No files in Postgres.[/yellow]")
        return

    table = Table(title=f"Postgres files — {user_name}", box=box.SIMPLE_HEAD)
    table.add_column("#", style="dim", width=3, justify="right")
    table.add_column("Name", style="bold")
    table.add_column("Path", style="cyan")
    table.add_column("Size", justify="right", style="green")
    table.add_column("Hash", style="dim")
    table.add_column("Updated", style="magenta")

    for i, (name, path, _key, size, hash_, updated) in enumerate(files, 1):
        table.add_row(
            str(i),
            name,
            path,
            humanize_bytes(size),
            (hash_[:10] + "…") if hash_ else "—",
            str(updated)[:19],
        )

    console.print(table)
    console.print(f"[dim]  {len(files)} file(s)[/dim]")


def render_minio_files(objects: list[dict], user_id: str, user_name: str) -> None:
    """Print a Rich table of MinIO objects for the given user, with a total size summary."""
    if not objects:
        console.print("[yellow]No objects in MinIO.[/yellow]")
        return

    table = Table(title=f"MinIO objects — {user_name}", box=box.SIMPLE_HEAD)
    table.add_column("#", style="dim", width=3, justify="right")
    table.add_column("Key", style="cyan")
    table.add_column("Size", justify="right", style="green")
    table.add_column("Modified", style="magenta")

    total = 0
    for i, obj in enumerate(objects, 1):
        key = obj["Key"].removeprefix(user_id)
        size = obj["Size"]
        total += size
        table.add_row(str(i), key, humanize_bytes(size), str(obj["LastModified"])[:19])

    console.print(table)
    console.print(
        f"[dim]  {len(objects)} object(s), {humanize_bytes(total)} total[/dim]"
    )


def _show_minio_reader(user_id: str, label: str) -> None:
    """Interactively prompt the user to pick a MinIO object and print its content.

    Displays the object list, asks for a selection, downloads the chosen object,
    and renders it as UTF-8 text in a panel. Falls back to a binary-size notice
    for non-text content.
    """
    minio_files = fetch_minio_files(user_id)
    if not minio_files:
        console.print("[yellow]No MinIO objects to read.[/yellow]")
        return

    render_minio_files(minio_files, user_id, label)
    console.print()
    raw = Prompt.ask(
        "[bold]Object number to read[/bold] [dim](or Enter to cancel)[/dim]",
        default="",
    )
    if not (raw.isdigit() and 1 <= int(raw) <= len(minio_files)):
        return

    key = minio_files[int(raw) - 1]["Key"]
    body = fetch_minio_content(key)
    if body is None:
        return
    try:
        console.print(Panel(body.decode("utf-8"), title=key, border_style="cyan"))
    except UnicodeDecodeError:
        console.print(f"[yellow]Binary content ({humanize_bytes(len(body))})[/yellow]")


def _handle_detail_choice(choice: str, user_id: str, label: str) -> bool:
    """Execute the chosen action. Returns True if a pause prompt should follow."""
    if choice in ("1", "3"):
        console.print()
        render_db_files(fetch_db_files(user_id), label)

    if choice in ("2", "3"):
        console.print()
        render_minio_files(fetch_minio_files(user_id), user_id, label)

    if choice == "4":
        console.print()
        _show_minio_reader(user_id, label)

    return choice in ("1", "2", "3", "4")


def user_detail(user: tuple) -> None:
    """Show the detail screen for a single user and handle action choices.

    Loops until the user chooses 'b' (back) or 'q' (quit), dispatching each
    menu selection to _handle_detail_choice.
    """
    user_id, name, email, provider, created, _ = user
    label = name or email
    uid = str(user_id)

    while True:
        console.clear()
        console.rule(f"[bold cyan]{label}[/bold cyan]")
        console.print(
            f"  [dim]ID[/dim]       {user_id}\n"
            f"  [dim]Email[/dim]    [cyan]{email}[/cyan]\n"
            f"  [dim]Provider[/dim] [blue]{provider}[/blue]\n"
            f"  [dim]Created[/dim]  [green]{str(created)[:10]}[/green]\n"
        )
        console.print(
            "  [bold]1[/bold]  Postgres files\n"
            "  [bold]2[/bold]  MinIO objects\n"
            "  [bold]3[/bold]  Both\n"
            "  [bold]4[/bold]  Read a file from MinIO\n"
            "  [bold]b[/bold]  Back to user list\n"
            "  [bold]q[/bold]  Quit\n"
        )

        choice = Prompt.ask("[bold]Action[/bold]", default="b")

        if choice == "q":
            console.print("[dim]Bye.[/dim]")
            sys.exit(0)

        if choice == "b":
            return

        if _handle_detail_choice(choice, uid, label):
            Prompt.ask("\n[dim]Press Enter to continue[/dim]", default="")


def main() -> None:
    """Entry point: load users from Postgres and run the interactive TUI loop."""
    try:
        users = fetch_users()
    except Exception as e:
        console.print(f"[red]Could not connect to database: {e}[/red]")
        sys.exit(1)

    if not users:
        console.print("[yellow]No users found.[/yellow]")
        sys.exit(0)

    while True:
        user = pick_user(users, title="MDHD Inspector", count_col="Files")
        user_detail(user)


if __name__ == "__main__":
    main()
