#!/usr/bin/env node
/**
 * @file MDHD **server-only** task runner. Invoked as `node makefile.mjs <task>` from `server/`
 * (often via `make <task>` when the Makefile forwards here).
 *
 * Wraps **Cargo** (run, check, build, sqlx, clippy, test, watch), **Docker Compose** for local
 * Postgres/MinIO (`docker-compose.dev.yml`), and a few **psql** helpers. Does not install app
 * deps or the Python venv — use the **repo root** `makefile.mjs` for full monorepo setup.
 *
 * Chalk is loaded from `../app/node_modules/chalk` so colors match the frontend toolchain.
 *
 * @module server/makefile
 */

import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @constant This package directory (`server/`). */
const SERVER_DIR = __dirname;

/** @constant Resolved path to Chalk in the sibling `app` package (run `bun install` in `app/` first). */
const chalkModulePath = join(
  SERVER_DIR,
  "..",
  "app",
  "node_modules",
  "chalk",
  "source",
  "index.js",
);
const chalkModuleURL = pathToFileURL(chalkModulePath).href;
/** @type {Awaited<ReturnType<typeof import('chalk')>>} */
const chalk = await import(chalkModuleURL).then((m) => m.default);

/** @constant Local dev stack definition (Postgres, MinIO, Adminer). */
const COMPOSE_FILE = join(SERVER_DIR, "docker-compose.dev.yml");

/**
 * @typedef {object} MakefileTask
 * @property {string} description One-line summary for `make help`.
 * @property {string} category Help section heading.
 * @property {() => void | Promise<void>} action Task implementation.
 */

/** @type {Record<string, MakefileTask>} */
const tasks = {
  help: {
    description: "Show this help message",
    category: "Help",
    action: showHelp,
  },

  setup: {
    description: "First-time setup: start containers, migrate, build",
    category: "Development",
    action: runSetup,
  },
  dev: {
    description: "Start dev server (port 8080, reads .env.development then .env)",
    category: "Development",
    action: () => runCargo(["run"]),
  },
  "dev:prod": {
    description: "Start server with RUN_ENV=production (local prod config)",
    category: "Development",
    action: () =>
      runCargo(["run"], { env: { ...process.env, RUN_ENV: "production" } }),
  },
  check: {
    description: "Type-check without building",
    category: "Development",
    action: () => runCargo(["check"]),
  },
  watch: {
    description: "Auto-restart server on file changes (requires cargo-watch)",
    category: "Development",
    action: () => runCargo(["watch", "-x", "run"]),
  },
  build: {
    description: "Debug build",
    category: "Build",
    action: () => runCargo(["build"]),
  },
  "build-release": {
    description: "Optimized release build",
    category: "Build",
    action: () => runCargo(["build", "--release"]),
  },

  up: {
    description: "Start Postgres + MinIO containers",
    category: "Docker",
    action: () => runDocker(["up", "-d"]),
  },
  down: {
    description: "Stop containers (keep data)",
    category: "Docker",
    action: () => runDocker(["down"]),
  },
  nuke: {
    description: "Stop containers and delete volumes",
    category: "Docker",
    action: () => runDocker(["down", "-v"]),
  },
  ps: {
    description: "Show container status",
    category: "Docker",
    action: () => runDocker(["ps"]),
  },
  logs: {
    description: "Tail container logs",
    category: "Docker",
    action: () => runDocker(["logs", "-f", "--tail", "50"]),
  },

  migrate: {
    description: "Run pending database migrations",
    category: "Database",
    action: runMigrate,
  },
  "migrate-add": {
    description: "Create a new migration file (make migrate-add)",
    category: "Database",
    action: runMigrateAdd,
  },
  "db-reset": {
    description: "Drop and recreate database, re-run migrations",
    category: "Database",
    action: runDbReset,
  },
  "db-shell": {
    description: "Open psql shell to dev database",
    category: "Database",
    action: () =>
      runCommand("psql", [
        "postgresql://postgres:postgres@localhost:5432/mdhd",
      ]),
  },

  test: {
    description: "Run all tests",
    category: "Testing",
    action: () => runCargo(["test"]),
  },
  "test-watch": {
    description: "Run tests in watch mode (cargo-watch)",
    category: "Testing",
    action: () => runCargo(["watch", "-x", "test"]),
  },

  lint: {
    description: "Lint with Clippy (warnings as errors)",
    category: "Quality",
    action: () => runCargo(["clippy", "--", "-D", "warnings"]),
  },
  fmt: {
    description: "Format code",
    category: "Quality",
    action: () => runCargo(["fmt"]),
  },
  "fmt-check": {
    description: "Check formatting (CI)",
    category: "Quality",
    action: () => runCargo(["fmt", "--", "--check"]),
  },
  "pre-commit": {
    description: "Run all CI checks (fmt-check, lint, test)",
    category: "Quality",
    action: runPreCommit,
  },
  validate: {
    description: "Run all validations (pre-push)",
    category: "Quality",
    action: runValidate,
  },

  clean: {
    description: "Remove build artifacts",
    category: "Maintenance",
    action: () => runCargo(["clean"]),
  },
};

/**
 * Spawns a subprocess with cwd {@link SERVER_DIR} and inherited stdio (unless overridden).
 *
 * @param {string} command Executable name.
 * @param {string[]} [args] argv after the command.
 * @param {import('node:child_process').SpawnOptions} [options] Merged into spawn options (`env`, `stdio`, etc.).
 * @returns {Promise<void>} Resolves on exit code `0`; rejects on non-zero exit or spawn error.
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: SERVER_DIR,
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Runs `docker compose -f docker-compose.dev.yml` with the given subcommand from {@link SERVER_DIR}.
 *
 * @param {string[]} args e.g. `["up", "-d"]`, `["down", "-v"]`.
 * @returns {Promise<void>}
 */
async function runDocker(args) {
  const label = `docker compose ${args.join(" ")}`;
  console.log(chalk.cyan(`Running: ${label}...`));
  console.log();
  await runCommand("docker", ["compose", "-f", COMPOSE_FILE, ...args]);
  console.log();
  console.log(chalk.green("✓ Done!"));
}

/**
 * Polls `pg_isready` in the Compose `postgres` service until ready or retries are exhausted.
 *
 * @param {number} [retries=30] Max attempts, one second apart.
 * @returns {Promise<void>}
 * @throws {Error} If Postgres never becomes ready.
 */
async function waitForPostgres(retries = 30) {
  console.log(chalk.dim("Waiting for Postgres to be ready..."));
  for (let i = 0; i < retries; i++) {
    try {
      await runCommand(
        "docker",
        [
          "compose",
          "-f",
          COMPOSE_FILE,
          "exec",
          "-T",
          "postgres",
          "pg_isready",
          "-U",
          "postgres",
        ],
        {
          stdio: "ignore",
        },
      );
      console.log(chalk.green("✓ Postgres is ready!"));
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Postgres did not become ready in time");
}

/**
 * Applies pending SQLx migrations (`cargo sqlx migrate run`) using project env / `.env` as configured by Cargo.
 *
 * @returns {Promise<void>}
 */
async function runMigrate() {
  console.log(chalk.cyan("Running: sqlx migrate run..."));
  console.log();
  await runCommand("cargo", ["sqlx", "migrate", "run"]);
  console.log();
  console.log(chalk.green("✓ Migrations applied!"));
}

/**
 * Creates a new empty migration file via `cargo sqlx migrate add <name>`.
 * Expects the migration name as `process.argv[3]` (e.g. `node makefile.mjs migrate-add my_table`).
 *
 * @returns {Promise<void>}
 */
async function runMigrateAdd() {
  const name = process.argv[3];
  if (!name) {
    console.error(chalk.red("Usage: make migrate-add <name>"));
    console.log(chalk.dim("  Example: make migrate-add create_posts"));
    process.exit(1);
  }
  console.log(chalk.cyan(`Creating migration: ${name}...`));
  console.log();
  await runCommand("cargo", ["sqlx", "migrate", "add", name]);
  console.log();
  console.log(chalk.green("✓ Migration file created!"));
}

/**
 * Destroys and recreates the local `mdhd` database on default Compose credentials, then runs migrations.
 * **Destructive** — intended for dev Docker Postgres on `localhost:5432` only.
 *
 * @returns {Promise<void>}
 */
async function runDbReset() {
  console.log(chalk.bold.cyan("Resetting database..."));
  console.log();

  const dbUrl = "postgresql://postgres:postgres@localhost:5432";

  console.log(chalk.yellow("▶ Dropping database mdhd..."));
  await runCommand("psql", [dbUrl, "-c", "DROP DATABASE IF EXISTS mdhd"]);

  console.log(chalk.yellow("▶ Creating database mdhd..."));
  await runCommand("psql", [dbUrl, "-c", "CREATE DATABASE mdhd"]);

  console.log(chalk.yellow("▶ Running migrations..."));
  await runCommand("cargo", ["sqlx", "migrate", "run"]);

  console.log();
  console.log(chalk.green("✓ Database reset complete!"));
}

/**
 * Server-only bootstrap: Compose up, wait for Postgres, migrate, debug build.
 *
 * @returns {Promise<void>}
 */
async function runSetup() {
  console.log(chalk.bold.cyan("Running first-time setup..."));
  console.log();

  console.log(chalk.bold.yellow("\n▶ Starting containers..."));
  console.log(chalk.dim("─".repeat(50)));
  await runDocker(["up", "-d"]);

  await waitForPostgres();

  console.log(chalk.bold.yellow("\n▶ Running migrations..."));
  console.log(chalk.dim("─".repeat(50)));
  await runMigrate();

  console.log(chalk.bold.yellow("\n▶ Building server..."));
  console.log(chalk.dim("─".repeat(50)));
  await runCargo(["build"]);

  console.log();
  console.log(chalk.bold.green("═".repeat(50)));
  console.log(chalk.bold.green("✓ Setup complete! Run 'make dev' to start."));
  console.log(chalk.bold.green("═".repeat(50)));
}

/**
 * Runs `cargo` in {@link SERVER_DIR} with a standard log banner.
 *
 * @param {string[]} args Arguments after `cargo`.
 * @param {import('node:child_process').SpawnOptions} [options] Extra spawn options (e.g. `RUN_ENV` via `env`).
 * @returns {Promise<void>}
 */
async function runCargo(args, options = {}) {
  const label = `cargo ${args.join(" ")}`;
  console.log(chalk.cyan(`Running: ${label}...`));
  console.log();
  await runCommand("cargo", args, options);
  console.log();
  console.log(chalk.green("✓ Done!"));
}

/**
 * Sequential gate: `cargo fmt --check`, Clippy (`-D warnings`), then tests.
 *
 * @returns {Promise<void>}
 */
async function runPreCommit() {
  console.log(chalk.bold.cyan("Running pre-commit checks..."));
  console.log();

  const checks = [
    { name: "fmt-check", fn: () => runCargo(["fmt", "--", "--check"]) },
    { name: "Clippy", fn: () => runCargo(["clippy", "--", "-D", "warnings"]) },
    { name: "Tests", fn: () => runCargo(["test"]) },
  ];

  for (const check of checks) {
    try {
      console.log(chalk.bold.yellow(`\n▶ Running ${check.name}...`));
      console.log(chalk.dim("─".repeat(50)));
      await check.fn();
    } catch (error) {
      console.log();
      console.log(chalk.bold.red(`✗ ${check.name} failed!`));
      console.log(chalk.dim("Fix the issues above and try again."));
      process.exit(1);
    }
  }

  console.log();
  console.log(chalk.bold.green("═".repeat(50)));
  console.log(chalk.bold.green("✓ All pre-commit checks passed!"));
  console.log(chalk.bold.green("═".repeat(50)));
  console.log();
}

/**
 * Pre-push style gate: fmt-check, Clippy, tests, and release build.
 *
 * @returns {Promise<void>}
 */
async function runValidate() {
  console.log(chalk.bold.cyan("Running full validation..."));
  console.log();

  const checks = [
    { name: "fmt-check", fn: () => runCargo(["fmt", "--", "--check"]) },
    { name: "Clippy", fn: () => runCargo(["clippy", "--", "-D", "warnings"]) },
    { name: "Tests", fn: () => runCargo(["test"]) },
    { name: "Release build", fn: () => runCargo(["build", "--release"]) },
  ];

  for (const check of checks) {
    try {
      console.log(chalk.bold.yellow(`\n▶ Running ${check.name}...`));
      console.log(chalk.dim("─".repeat(50)));
      await check.fn();
    } catch {
      console.log();
      console.log(chalk.bold.red(`✗ ${check.name} failed!`));
      process.exit(1);
    }
  }

  console.log();
  console.log(chalk.bold.green("═".repeat(50)));
  console.log(chalk.bold.green("✓ All validations passed! Ready to push."));
  console.log(chalk.bold.green("═".repeat(50)));
}

/**
 * Prints tasks from {@link tasks}, grouped by category.
 *
 * @returns {Promise<void>}
 */
function showHelp() {
  console.log();
  console.log();

  const categories = {};
  for (const [name, task] of Object.entries(tasks)) {
    if (!categories[task.category]) {
      categories[task.category] = [];
    }
    categories[task.category].push({ name, ...task });
  }

  for (const [category, categoryTasks] of Object.entries(categories)) {
    console.log(chalk.bold.yellow(`  ${category}`));
    console.log(chalk.dim("  ─────────────────────────────────────"));

    for (const task of categoryTasks) {
      const taskName = chalk.green(`make ${task.name.padEnd(15)}`);
      console.log(`  ${taskName} ${task.description}`);
    }

    console.log();
  }

  return Promise.resolve();
}

/**
 * CLI entry: first argument is the task name (default `help`); unknown tasks exit with code 1.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);
  const taskName = args[0] || "help";

  if (!tasks[taskName]) {
    console.error(chalk.red(`Error: Unknown task "${taskName}"`));
    console.log();
    console.log(chalk.dim('Run "make help" to see available tasks'));
    process.exit(1);
  }

  try {
    await tasks[taskName].action();
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

await main();
