#!/usr/bin/env python3
"""Interactive TUI inspector for user settings stored in Postgres.

Connects to the MDHD backend's Postgres database to let you browse users,
inspect their settings (key-value pairs), and view raw JSON values — all
from the terminal.

Setup:
    pip install -r scripts/requirements.txt

Usage:
    python scripts/settings_tui.py

    # Override connection defaults via environment variables:
    DATABASE_URL=postgresql://... python scripts/settings_tui.py

Environment variables (all optional, shown with defaults):
    DATABASE_URL  postgresql://postgres:postgres@localhost:5432/mdhd
"""

import json
import os
import sys

import psycopg2
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.syntax import Syntax
from rich.table import Table

DB_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mdhd"
)

console = Console()


def get_db():
    """Return a new psycopg2 connection using DATABASE_URL."""
    return psycopg2.connect(DB_URL)


def fetch_users() -> list[tuple]:
    """Return all users with their setting counts, ordered by creation date (newest first).

    Each row: (id, name, email, oauth_provider, created_at, setting_count)
    """
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT u.id, u.name, u.email, u.oauth_provider, u.created_at, "
            "COUNT(s.id) "
            "FROM users u LEFT JOIN user_settings s ON u.id = s.user_id "
            "GROUP BY u.id ORDER BY u.created_at DESC"
        )
        return cur.fetchall()


def fetch_settings(user_id: str) -> list[tuple]:
    """Return all settings for a user from Postgres, ordered by key.

    Each row: (id, key, value, hash, updated_at)
    """
    with get_db() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, key, value, hash, updated_at "
            "FROM user_settings WHERE user_id = %s ORDER BY key",
            (user_id,),
        )
        return cur.fetchall()


def render_user_table(users: list[tuple]) -> None:
    """Print a Rich table listing all users with index, name, email, provider, setting count, and join date."""
    table = Table(title="Users", box=box.ROUNDED, show_lines=False)
    table.add_column("#", style="dim", width=3, justify="right")
    table.add_column("Name", style="bold")
    table.add_column("Email", style="cyan")
    table.add_column("Provider", style="blue")
    table.add_column("Settings", justify="right", style="magenta")
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


def render_settings_table(settings: list[tuple], user_name: str) -> None:
    """Print a Rich table of all settings for the given user."""
    if not settings:
        console.print("[yellow]No settings found.[/yellow]")
        return

    table = Table(title=f"Settings — {user_name}", box=box.SIMPLE_HEAD)
    table.add_column("#", style="dim", width=3, justify="right")
    table.add_column("Key", style="bold")
    table.add_column("Value (preview)", style="cyan", max_width=50)
    table.add_column("Hash", style="dim")
    table.add_column("Updated", style="magenta")

    for i, (_id, key, value, hash_, updated) in enumerate(settings, 1):
        preview = json.dumps(value, ensure_ascii=False)
        if len(preview) > 50:
            preview = preview[:47] + "..."
        table.add_row(
            str(i),
            key,
            preview,
            (hash_[:10] + "…") if hash_ else "—",
            str(updated)[:19],
        )

    console.print(table)
    console.print(f"[dim]  {len(settings)} setting(s)[/dim]")


def show_setting_detail(setting: tuple) -> None:
    """Print the full JSON value of a single setting in a syntax-highlighted panel."""
    _id, key, value, hash_, updated = setting
    formatted = json.dumps(value, indent=2, ensure_ascii=False)
    syntax = Syntax(formatted, "json", theme="monokai", word_wrap=True)

    console.print()
    console.print(
        Panel(
            syntax,
            title=f"[bold]{key}[/bold]",
            subtitle=f"hash: {hash_}  |  updated: {str(updated)[:19]}",
            border_style="cyan",
        )
    )


def pick_user(users: list[tuple]) -> tuple:
    """Show the users table and prompt for a number. Returns the chosen row."""
    while True:
        console.clear()
        console.rule("[bold cyan]MDHD Settings Inspector[/bold cyan]")
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


def _handle_detail_choice(
    choice: str, user_id: str, label: str, settings: list[tuple]
) -> bool:
    """Execute the chosen action. Returns True if a pause prompt should follow."""
    if choice == "1":
        console.print()
        settings[:] = fetch_settings(user_id)
        render_settings_table(settings, label)
        return True

    if choice == "2":
        if not settings:
            console.print(
                "[yellow]No settings to inspect. List settings first.[/yellow]"
            )
            return True

        console.print()
        render_settings_table(settings, label)
        console.print()
        raw = Prompt.ask(
            "[bold]Setting number to inspect[/bold] [dim](or Enter to cancel)[/dim]",
            default="",
        )
        if raw.isdigit() and 1 <= int(raw) <= len(settings):
            show_setting_detail(settings[int(raw) - 1])
            return True
        return False

    if choice == "3":
        if not settings:
            console.print("[yellow]No settings to search.[/yellow]")
            return True

        console.print()
        query = Prompt.ask("[bold]Search key (substring)[/bold]", default="")
        if not query:
            return False

        matches = [s for s in settings if query.lower() in s[1].lower()]
        if not matches:
            console.print(f"[yellow]No settings matching '{query}'.[/yellow]")
        else:
            for setting in matches:
                show_setting_detail(setting)
        return True

    return False


def user_detail(user: tuple) -> None:
    """Show the detail screen for a single user and handle action choices."""
    user_id, name, email, provider, created, _ = user
    label = name or email
    uid = str(user_id)
    settings = fetch_settings(uid)

    while True:
        console.clear()
        console.rule(f"[bold cyan]{label}[/bold cyan]")
        console.print(
            f"  [dim]ID[/dim]       {user_id}\n"
            f"  [dim]Email[/dim]    [cyan]{email}[/cyan]\n"
            f"  [dim]Provider[/dim] [blue]{provider}[/blue]\n"
            f"  [dim]Created[/dim]  [green]{str(created)[:10]}[/green]\n"
            f"  [dim]Settings[/dim] [magenta]{len(settings)}[/magenta]\n"
        )
        console.print(
            "  [bold]1[/bold]  List all settings\n"
            "  [bold]2[/bold]  Inspect a setting (full JSON)\n"
            "  [bold]3[/bold]  Search settings by key\n"
            "  [bold]b[/bold]  Back to user list\n"
            "  [bold]q[/bold]  Quit\n"
        )

        choice = Prompt.ask("[bold]Action[/bold]", default="b")

        if choice == "q":
            console.print("[dim]Bye.[/dim]")
            sys.exit(0)

        if choice == "b":
            return

        if _handle_detail_choice(choice, uid, label, settings):
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
