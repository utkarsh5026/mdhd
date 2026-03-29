#!/usr/bin/env python3
"""Interactive TUI inspector for bookmarks stored in Postgres.

Connects to the MDHD backend's Postgres database to let you browse users,
inspect their bookmarks per file, and view full bookmark details — all from
the terminal.

Setup:
    pip install -r scripts/requirements.txt

Usage:
    python scripts/bookmarks_tui.py

    # Override connection defaults via environment variables:
    DATABASE_URL=postgresql://... python scripts/bookmarks_tui.py

Environment variables (all optional, shown with defaults):
    DATABASE_URL  postgresql://postgres:postgres@localhost:5432/mdhd
"""

import os
import sys

import psycopg2
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

DB_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mdhd"
)

console = Console()


def get_db():
    """Return a new psycopg2 connection using DATABASE_URL."""
    return psycopg2.connect(DB_URL)


def fetch_users() -> list[tuple]:
    """Return all users with their bookmark counts, ordered by creation date (newest first).

    Each row: (id, name, email, oauth_provider, created_at, bookmark_count)
    """
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT u.id, u.name, u.email, u.oauth_provider, u.created_at, "
            "COUNT(b.id) "
            "FROM users u LEFT JOIN bookmarks b ON u.id = b.user_id "
            "GROUP BY u.id ORDER BY u.created_at DESC"
        )
        return cur.fetchall()


def fetch_files_with_bookmarks(user_id: str) -> list[tuple]:
    """Return all files that have at least one bookmark for the given user.

    Each row: (file_id, file_name, file_path, bookmark_count)
    """
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT f.id, f.name, f.path, COUNT(b.id) "
            "FROM files f "
            "JOIN bookmarks b ON b.file_id = f.id "
            "WHERE f.user_id = %s "
            "GROUP BY f.id, f.name, f.path "
            "ORDER BY f.path",
            (user_id,),
        )
        return cur.fetchall()


def fetch_bookmarks(user_id: str, file_id: str) -> list[tuple]:
    """Return all bookmarks for a user+file pair, ordered by section_index.

    Each row: (id, section_index, name, created_at)
    """
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, section_index, name, created_at "
            "FROM bookmarks "
            "WHERE user_id = %s AND file_id = %s "
            "ORDER BY section_index",
            (user_id, file_id),
        )
        return cur.fetchall()


def fetch_all_bookmarks(user_id: str) -> list[tuple]:
    """Return every bookmark for a user across all files, ordered by file path then section_index.

    Each row: (id, file_name, file_path, section_index, name, created_at)
    """
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT b.id, f.name, f.path, b.section_index, b.name, b.created_at "
            "FROM bookmarks b "
            "JOIN files f ON f.id = b.file_id "
            "WHERE b.user_id = %s "
            "ORDER BY f.path, b.section_index",
            (user_id,),
        )
        return cur.fetchall()


# ── Renderers ────────────────────────────────────────────────────────────────


def render_user_table(users: list[tuple]) -> None:
    """Print a Rich table listing all users with index, name, email, provider, bookmark count, and join date."""
    table = Table(title="Users", box=box.ROUNDED, show_lines=False)
    table.add_column("#", style="dim", width=3, justify="right")
    table.add_column("Name", style="bold")
    table.add_column("Email", style="cyan")
    table.add_column("Provider", style="blue")
    table.add_column("Bookmarks", justify="right", style="magenta")
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


def render_files_table(files: list[tuple], user_name: str) -> None:
    """Print a Rich table of files that have bookmarks for the given user."""
    if not files:
        console.print("[yellow]No bookmarked files found.[/yellow]")
        return

    table = Table(title=f"Bookmarked files — {user_name}", box=box.SIMPLE_HEAD)
    table.add_column("#", style="dim", width=3, justify="right")
    table.add_column("Name", style="bold")
    table.add_column("Path", style="cyan")
    table.add_column("Bookmarks", justify="right", style="magenta")

    for i, (_fid, name, path, count) in enumerate(files, 1):
        table.add_row(str(i), name, path, str(count))

    console.print(table)
    console.print(f"[dim]  {len(files)} file(s) with bookmarks[/dim]")


def render_bookmarks_table(bookmarks: list[tuple], title: str) -> None:
    """Print a Rich table of bookmarks with section index, name, and creation date."""
    if not bookmarks:
        console.print("[yellow]No bookmarks found.[/yellow]")
        return

    table = Table(title=title, box=box.SIMPLE_HEAD)
    table.add_column("#", style="dim", width=3, justify="right")
    table.add_column("Section", justify="right", style="yellow")
    table.add_column("Name", style="bold")
    table.add_column("Created", style="green")

    for i, (_bid, section_idx, name, created_at) in enumerate(bookmarks, 1):
        table.add_row(str(i), str(section_idx), name, str(created_at)[:19])

    console.print(table)
    console.print(f"[dim]  {len(bookmarks)} bookmark(s)[/dim]")


def render_all_bookmarks_table(bookmarks: list[tuple], user_name: str) -> None:
    """Print a Rich table of all bookmarks for a user, grouped with file path context."""
    if not bookmarks:
        console.print("[yellow]No bookmarks found.[/yellow]")
        return

    table = Table(title=f"All bookmarks — {user_name}", box=box.SIMPLE_HEAD)
    table.add_column("#", style="dim", width=3, justify="right")
    table.add_column("File", style="cyan")
    table.add_column("Section", justify="right", style="yellow")
    table.add_column("Name", style="bold")
    table.add_column("Created", style="green")

    for i, (_bid, file_name, _path, section_idx, name, created_at) in enumerate(
        bookmarks, 1
    ):
        table.add_row(str(i), file_name, str(section_idx), name, str(created_at)[:19])

    console.print(table)
    console.print(f"[dim]  {len(bookmarks)} bookmark(s) total[/dim]")


def show_bookmark_detail(bookmark: tuple, file_name: str) -> None:
    """Print a detail panel for a single bookmark."""
    bid, section_idx, name, created_at = bookmark
    console.print()
    console.print(
        Panel(
            f"  [dim]ID[/dim]           {bid}\n"
            f"  [dim]File[/dim]         [cyan]{file_name}[/cyan]\n"
            f"  [dim]Section index[/dim] [yellow]{section_idx}[/yellow]\n"
            f"  [dim]Name[/dim]         [bold]{name}[/bold]\n"
            f"  [dim]Created[/dim]      [green]{str(created_at)[:19]}[/green]",
            title="[bold]Bookmark detail[/bold]",
            border_style="cyan",
        )
    )


# ── Navigation ────────────────────────────────────────────────────────────────


def pick_user(users: list[tuple]) -> tuple:
    """Show the users table and prompt for a number. Returns the chosen row."""
    while True:
        console.clear()
        console.rule("[bold cyan]MDHD Bookmarks Inspector[/bold cyan]")
        render_user_table(users)
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


def file_detail(user_id: str, file_row: tuple) -> None:
    """Show bookmarks for a single file and let the user inspect individual entries."""
    file_id, file_name, file_path, _ = file_row
    bookmarks = fetch_bookmarks(user_id, str(file_id))

    while True:
        console.clear()
        console.rule(f"[bold cyan]{file_name}[/bold cyan]")
        console.print(f"  [dim]Path[/dim]  [cyan]{file_path}[/cyan]\n")
        render_bookmarks_table(bookmarks, f"Bookmarks — {file_name}")
        console.print()
        console.print(
            "  [bold]r[/bold]  Refresh\n"
            "  [bold]i[/bold]  Inspect a bookmark (detail panel)\n"
            "  [bold]b[/bold]  Back to file list\n"
            "  [bold]q[/bold]  Quit\n"
        )

        choice = Prompt.ask("[bold]Action[/bold]", default="b")

        if choice == "q":
            console.print("[dim]Bye.[/dim]")
            sys.exit(0)

        if choice == "b":
            return

        if choice == "r":
            bookmarks = fetch_bookmarks(user_id, str(file_id))
            continue

        if choice == "i":
            if not bookmarks:
                console.print("[yellow]No bookmarks to inspect.[/yellow]")
                Prompt.ask("\n[dim]Press Enter to continue[/dim]", default="")
                continue

            raw = Prompt.ask(
                "[bold]Bookmark number[/bold] [dim](or Enter to cancel)[/dim]",
                default="",
            )
            if raw.isdigit() and 1 <= int(raw) <= len(bookmarks):
                show_bookmark_detail(bookmarks[int(raw) - 1], file_name)
                Prompt.ask("\n[dim]Press Enter to continue[/dim]", default="")


def _handle_detail_choice(
    choice: str, user_id: str, label: str, files: list[tuple]
) -> bool:
    """Execute the chosen action in the user detail screen. Returns True if a pause should follow."""
    if choice == "1":
        console.print()
        render_files_table(files, label)
        return True

    if choice == "2":
        console.print()
        all_bm = fetch_all_bookmarks(user_id)
        render_all_bookmarks_table(all_bm, label)
        return True

    if choice == "3":
        if not files:
            console.print("[yellow]No bookmarked files to browse.[/yellow]")
            return True

        console.print()
        render_files_table(files, label)
        console.print()
        raw = Prompt.ask(
            "[bold]File number to browse[/bold] [dim](or Enter to cancel)[/dim]",
            default="",
        )
        if raw.isdigit() and 1 <= int(raw) <= len(files):
            file_detail(user_id, files[int(raw) - 1])
        return False

    if choice == "4":
        if not files:
            console.print("[yellow]No bookmarks to search.[/yellow]")
            return True

        console.print()
        query = Prompt.ask("[bold]Search bookmark name (substring)[/bold]", default="")
        if not query:
            return False

        all_bm = fetch_all_bookmarks(user_id)
        matches = [b for b in all_bm if query.lower() in b[4].lower()]
        if not matches:
            console.print(f"[yellow]No bookmarks matching '{query}'.[/yellow]")
        else:
            table = Table(title=f"Search results for '{query}'", box=box.SIMPLE_HEAD)
            table.add_column("#", style="dim", width=3, justify="right")
            table.add_column("File", style="cyan")
            table.add_column("Section", justify="right", style="yellow")
            table.add_column("Name", style="bold")
            table.add_column("Created", style="green")
            for i, (_bid, file_name, _path, section_idx, name, created_at) in enumerate(
                matches, 1
            ):
                table.add_row(
                    str(i), file_name, str(section_idx), name, str(created_at)[:19]
                )
            console.print(table)
            console.print(f"[dim]  {len(matches)} match(es)[/dim]")
        return True

    return False


def user_detail(user: tuple) -> None:
    """Show the detail screen for a single user and handle action choices."""
    user_id, name, email, provider, created, _ = user
    label = name or email
    uid = str(user_id)
    files = fetch_files_with_bookmarks(uid)

    while True:
        console.clear()
        console.rule(f"[bold cyan]{label}[/bold cyan]")
        console.print(
            f"  [dim]ID[/dim]        {user_id}\n"
            f"  [dim]Email[/dim]     [cyan]{email}[/cyan]\n"
            f"  [dim]Provider[/dim]  [blue]{provider}[/blue]\n"
            f"  [dim]Created[/dim]   [green]{str(created)[:10]}[/green]\n"
            f"  [dim]Files w/ bookmarks[/dim]  [magenta]{len(files)}[/magenta]\n"
        )
        console.print(
            "  [bold]1[/bold]  List bookmarked files\n"
            "  [bold]2[/bold]  Show all bookmarks (flat)\n"
            "  [bold]3[/bold]  Browse bookmarks by file\n"
            "  [bold]4[/bold]  Search bookmarks by name\n"
            "  [bold]b[/bold]  Back to user list\n"
            "  [bold]q[/bold]  Quit\n"
        )

        choice = Prompt.ask("[bold]Action[/bold]", default="b")

        if choice == "q":
            console.print("[dim]Bye.[/dim]")
            sys.exit(0)

        if choice == "b":
            return

        if _handle_detail_choice(choice, uid, label, files):
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
        user = pick_user(users)
        user_detail(user)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[dim]Bye.[/dim]")
        sys.exit(0)
