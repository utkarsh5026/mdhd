#!/usr/bin/env python3
"""Interactive TUI for browsing database table metadata.

Setup:
    pip install -r scripts/requirements.txt

Usage:
    python scripts/db_info.py
    DATABASE_URL=postgres://... python scripts/db_info.py
"""

import sys

import psycopg2
from rich import box
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

from common import DB_URL, console, get_db


def fetch_tables(cur) -> list[tuple]:
    """(name, total_size, table_size, index_size, row_estimate)"""
    cur.execute(
        """
        SELECT
            t.table_name,
            pg_size_pretty(pg_total_relation_size(c.oid)),
            pg_size_pretty(pg_relation_size(c.oid)),
            pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)),
            s.n_live_tup
        FROM information_schema.tables t
        JOIN pg_class c ON c.relname = t.table_name
        JOIN pg_stat_user_tables s ON s.relname = t.table_name
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
        ORDER BY pg_total_relation_size(c.oid) DESC
    """
    )
    return cur.fetchall()


def fetch_columns(cur, table_name: str) -> list[tuple]:
    """(col_name, data_type, nullable, default)"""
    cur.execute(
        """
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position
        """,
        (table_name,),
    )
    return cur.fetchall()


def fetch_indexes(cur, table_name: str) -> list[tuple]:
    """(index_name, is_unique, is_primary, size, definition)"""
    cur.execute(
        """
        SELECT i.relname, ix.indisunique, ix.indisprimary,
               pg_size_pretty(pg_relation_size(i.oid)),
               pg_get_indexdef(ix.indexrelid)
        FROM pg_index ix
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public' AND t.relname = %s
        ORDER BY i.relname
        """,
        (table_name,),
    )
    return cur.fetchall()


def fetch_foreign_keys(cur, table_name: str) -> list[tuple]:
    """(column, foreign_table, foreign_column, delete_rule)"""
    cur.execute(
        """
        SELECT kcu.column_name, ccu.table_name, ccu.column_name, rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints rc
          ON rc.constraint_name = tc.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = %s
        ORDER BY kcu.column_name
        """,
        (table_name,),
    )
    return cur.fetchall()


def fetch_sample_rows(
    cur, table_name: str, limit: int = 5
) -> tuple[list[str], list[tuple]]:
    """Returns (column_names, rows)."""
    cur.execute(
        f'SELECT * FROM "{table_name}" LIMIT %s',  # noqa: S608 — table_name is from pg catalog
        (limit,),
    )
    cols = [d[0] for d in cur.description]
    return cols, cur.fetchall()


def fetch_migrations(cur) -> list[tuple] | None:
    """Returns rows or None if the migrations table doesn't exist."""
    try:
        cur.execute(
            "SELECT version, description, installed_on, success FROM _sqlx_migrations ORDER BY version"
        )
        return cur.fetchall()
    except psycopg2.errors.UndefinedTable:
        return None


# ── renderers ────────────────────────────────────────────────────────────────


def render_tables_overview(tables: list[tuple]) -> None:
    t = Table(title="Tables", box=box.ROUNDED, show_lines=False)
    t.add_column("#", style="dim", width=3, justify="right")
    t.add_column("Table", style="bold cyan")
    t.add_column("Rows (est.)", justify="right", style="green")
    t.add_column("Total Size", justify="right")
    t.add_column("Table Size", justify="right")
    t.add_column("Index Size", justify="right", style="dim")

    for i, (name, total, tbl_sz, idx_sz, rows) in enumerate(tables, 1):
        t.add_row(str(i), name, str(rows), total, tbl_sz, idx_sz)

    console.print(t)


def render_columns(table_name: str, cols: list[tuple]) -> None:
    t = Table(title=f"Columns — {table_name}", box=box.SIMPLE_HEAD)
    t.add_column("Column", style="bold green")
    t.add_column("Type", style="cyan")
    t.add_column("Nullable", justify="center")
    t.add_column("Default", style="dim")

    for col_name, dtype, maxlen, nullable, default in cols:
        full_type = f"{dtype}({maxlen})" if maxlen else dtype
        null_str = "[dim]YES[/dim]" if nullable == "YES" else "[bold]NO[/bold]"
        t.add_row(col_name, full_type, null_str, default or "—")

    console.print(t)


def render_indexes(table_name: str, indexes: list[tuple]) -> None:
    if not indexes:
        console.print("[dim]  No indexes.[/dim]")
        return

    t = Table(title=f"Indexes — {table_name}", box=box.SIMPLE_HEAD)
    t.add_column("Index", style="bold green")
    t.add_column("Size", justify="right")
    t.add_column("Flags")
    t.add_column("Definition", style="dim", overflow="fold")

    for idx_name, is_unique, is_primary, size, defn in indexes:
        flags = []
        if is_primary:
            flags.append("[bold magenta]PK[/bold magenta]")
        if is_unique and not is_primary:
            flags.append("[bold blue]UNIQUE[/bold blue]")
        t.add_row(idx_name, size, " ".join(flags), defn)

    console.print(t)


def render_foreign_keys(table_name: str, fks: list[tuple]) -> None:
    if not fks:
        console.print("[dim]  No foreign keys.[/dim]")
        return

    t = Table(title=f"Foreign Keys — {table_name}", box=box.SIMPLE_HEAD)
    t.add_column("Column", style="bold green")
    t.add_column("→ References", style="cyan")
    t.add_column("On Delete", style="dim")

    for col, ftbl, fcol, del_rule in fks:
        t.add_row(col, f"{ftbl}({fcol})", del_rule)

    console.print(t)


def render_sample(table_name: str, col_names: list[str], rows: list[tuple]) -> None:
    if not rows:
        console.print("[dim]  Table is empty.[/dim]")
        return

    t = Table(title=f"Sample rows — {table_name} (up to 5)", box=box.SIMPLE_HEAD)
    for col in col_names:
        t.add_column(col, overflow="fold", max_width=30)

    for row in rows:
        t.add_row(*[str(v)[:60] if v is not None else "[dim]NULL[/dim]" for v in row])

    console.print(t)


def render_migrations(migrations: list[tuple] | None) -> None:
    if migrations is None:
        console.print("[dim]  _sqlx_migrations table not found.[/dim]")
        return

    t = Table(title="Applied Migrations", box=box.SIMPLE_HEAD)
    t.add_column("Version", style="dim")
    t.add_column("Description", style="bold")
    t.add_column("Applied At", style="green")
    t.add_column("OK", justify="center")

    for ver, desc, applied, ok in migrations:
        tick = "[green]✓[/green]" if ok else "[red]✗[/red]"
        applied_str = str(applied)[:19] if applied else "—"
        t.add_row(str(ver), desc or "", applied_str, tick)

    console.print(t)


def pick_table(tables: list[tuple]) -> tuple:
    while True:
        console.clear()
        console.rule("[bold cyan]DB Inspector[/bold cyan]")
        console.print(f"  [dim]{DB_URL}[/dim]\n")
        render_tables_overview(tables)
        console.print()

        raw = Prompt.ask(
            "[bold]Select table[/bold] [dim](number, m = migrations, q = quit)[/dim]",
            default="q",
        )

        if raw.lower() == "q":
            console.print("[dim]Bye.[/dim]")
            sys.exit(0)

        if raw.lower() == "m":
            return ("__migrations__",)

        if raw.isdigit() and 1 <= int(raw) <= len(tables):
            return tables[int(raw) - 1]

        console.print(f"[red]Invalid choice '{raw}'.[/red]")
        Prompt.ask("[dim]Press Enter to try again[/dim]", default="")


def table_detail(table: tuple, conn) -> None:
    name = table[0]

    while True:
        console.clear()
        console.rule(f"[bold cyan]{name}[/bold cyan]")
        console.print(
            "  [bold]1[/bold]  Columns\n"
            "  [bold]2[/bold]  Indexes\n"
            "  [bold]3[/bold]  Foreign keys\n"
            "  [bold]4[/bold]  Sample rows\n"
            "  [bold]5[/bold]  All of the above\n"
            "  [bold]b[/bold]  Back\n"
            "  [bold]q[/bold]  Quit\n"
        )

        choice = Prompt.ask("[bold]Action[/bold]", default="b")

        if choice == "q":
            console.print("[dim]Bye.[/dim]")
            sys.exit(0)
        if choice == "b":
            return

        console.print()
        with conn.cursor() as cur:
            if choice in ("1", "5"):
                render_columns(name, fetch_columns(cur, name))
                console.print()
            if choice in ("2", "5"):
                render_indexes(name, fetch_indexes(cur, name))
                console.print()
            if choice in ("3", "5"):
                render_foreign_keys(name, fetch_foreign_keys(cur, name))
                console.print()
            if choice in ("4", "5"):
                col_names, rows = fetch_sample_rows(cur, name)
                render_sample(name, col_names, rows)
                console.print()

        if choice in ("1", "2", "3", "4", "5"):
            Prompt.ask("[dim]Press Enter to continue[/dim]", default="")


def migrations_screen(conn) -> None:
    console.clear()
    console.rule("[bold cyan]Migration History[/bold cyan]")
    console.print()
    with conn.cursor() as cur:
        render_migrations(fetch_migrations(cur))
    console.print()
    Prompt.ask("[dim]Press Enter to go back[/dim]", default="")


def main() -> None:
    try:
        conn = get_db()
    except Exception as e:
        console.print(
            Panel(f"[red]Could not connect to database:\n{e}[/red]", border_style="red")
        )
        sys.exit(1)

    try:
        with conn.cursor() as cur:
            tables = fetch_tables(cur)
    except Exception as e:
        console.print(f"[red]Failed to fetch tables: {e}[/red]")
        sys.exit(1)

    if not tables:
        console.print("[yellow]No tables found in the public schema.[/yellow]")
        sys.exit(0)

    while True:
        selection = pick_table(tables)
        if selection[0] == "__migrations__":
            migrations_screen(conn)
        else:
            table_detail(selection, conn)


if __name__ == "__main__":
    main()
