#!/usr/bin/env node
/**
 * @file MDHD monorepo task runner (root). Invoked as `node makefile.mjs <task>`; the repo
 * Makefile typically forwards `make <task>` here.
 *
 * Responsibilities:
 * - **Client** (`app/`): Bun scripts (dev, build, lint, format).
 * - **Server** (`server/`): Cargo (run, build, sqlx migrate, clippy, test).
 * - **Infra**: `server/docker-compose.dev.yml` (Postgres, Minio, Adminer).
 * - **Tooling**: Python venv in `server/scripts/.venv` for ruff and `sqlx_sync.py`.
 *
 * Environment: reads `server/.env.development` for migrations and connection checks;
 * copies from `server/.env.example` on first setup when that file is missing.
 *
 * @module makefile
 */

import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @constant Project root (directory containing this file). */
const ROOT_DIR = __dirname;
/** @constant Frontend package root (`app/`). */
const APP_DIR = join(ROOT_DIR, "app");
/** @constant Rust API package root (`server/`). */
const SERVER_DIR = join(ROOT_DIR, "server");
/** @constant Local dev env file; created from {@link SERVER_ENV_EXAMPLE} when missing. */
const SERVER_DEV_ENV_FILE = join(SERVER_DIR, ".env.development");
/** @constant Template copied to `.env.development` on first setup. */
const SERVER_ENV_EXAMPLE = join(SERVER_DIR, ".env.example");

/** Terminal colors: Chalk from `app/node_modules` when present, else minimal ANSI helpers. */
let chalk;
try {
  const chalkModulePath = join(
    APP_DIR,
    "node_modules",
    "chalk",
    "source",
    "index.js",
  );
  const chalkModuleURL = pathToFileURL(chalkModulePath).href;
  chalk = await import(chalkModuleURL).then((m) => m.default);
} catch {
  const bold = (s) => `\x1b[1m${s}\x1b[22m`;
  chalk = {
    cyan: (s) => `\x1b[36m${s}\x1b[39m`,
    green: (s) => `\x1b[32m${s}\x1b[39m`,
    yellow: (s) => `\x1b[33m${s}\x1b[39m`,
    red: (s) => `\x1b[31m${s}\x1b[39m`,
    blue: (s) => `\x1b[34m${s}\x1b[39m`,
    dim: (s) => `\x1b[2m${s}\x1b[22m`,
    bold: Object.assign(bold, {
      cyan: (s) => `\x1b[1m\x1b[36m${s}\x1b[22m\x1b[39m`,
      yellow: (s) => `\x1b[1m\x1b[33m${s}\x1b[22m\x1b[39m`,
      green: (s) => `\x1b[1m\x1b[32m${s}\x1b[22m\x1b[39m`,
      red: (s) => `\x1b[1m\x1b[31m${s}\x1b[22m\x1b[39m`,
    }),
  };
}

/** @constant Dev Docker Compose file (Postgres, MinIO, Adminer). */
const COMPOSE_FILE = join(SERVER_DIR, "docker-compose.dev.yml");
/** @constant Server-side scripts (Python venv, sqlx helpers). */
const SCRIPTS_DIR = join(SERVER_DIR, "scripts");
/** @constant Python virtualenv root for script dependencies. */
const VENV_DIR = join(SCRIPTS_DIR, ".venv");

/**
 * Appends `statement-cache-capacity=0` when missing so SQLx works with poolers (PgBouncer).
 *
 * @param {string | null | undefined} databaseUrl Postgres connection URL.
 * @returns {string | null | undefined} URL safe for `sqlx` / pooled connections.
 */
function databaseUrlWithStatementCacheDisabled(databaseUrl) {
  if (!databaseUrl) return databaseUrl;
  if (databaseUrl.includes("statement-cache-capacity=")) return databaseUrl;
  const sep = databaseUrl.includes("?") ? "&" : "?";
  return `${databaseUrl}${sep}statement-cache-capacity=0`;
}

/**
 * Reads a single `KEY=value` from a `.env`-style file (no full dotenv dependency).
 *
 * @param {string} envPath Absolute path to the env file.
 * @param {string} key Variable name to extract.
 * @returns {string | null} Trimmed value, or `null` if not found.
 */
function loadEnvVarFromDotenv(envPath, key) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq).trim() !== key) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    return val;
  }
  return null;
}

/**
 * Ensures `server/.env.development` exists by copying `server/.env.example` when absent.
 *
 * @returns {Promise<void>}
 */
async function ensureServerDevEnvFile() {
  if (existsSync(SERVER_DEV_ENV_FILE)) {
    console.log(chalk.dim("Skipping .env.development — already exists."));
    return;
  }
  console.log(chalk.dim("Creating .env.development from .env.example..."));
  await runCommand("cp", [SERVER_ENV_EXAMPLE, SERVER_DEV_ENV_FILE], {
    cwd: SERVER_DIR,
  });
}

/** @constant Interpreter inside the scripts virtualenv. */
const VENV_PYTHON = join(VENV_DIR, "bin", "python");
/** @constant Pip inside the scripts virtualenv. */
const VENV_PIP = join(VENV_DIR, "bin", "pip");

/**
 * @typedef {object} MakefileTask
 * @property {string} description One-line summary for `make help`.
 * @property {string} category Help section heading (e.g. `Development`, `Quality`).
 * @property {() => void | Promise<void>} action Async or sync handler for the task.
 */

/** @type {Record<string, MakefileTask>} */
const tasks = {
  help: {
    description: "Show this help message",
    category: "Help",
    action: showHelp,
  },

  dev: {
    description:
      "Start client (port 5173) + server (port 8080), server auto-restarts on changes (requires cargo-watch)",
    category: "Development",
    action: runDev,
  },
  prod: {
    description:
      "Release build of client + server, serve with RUN_ENV=production",
    category: "Development",
    action: runProd,
  },
  "prod-watch": {
    description:
      "Prod build + watch: client rebuilds on change, server restarts on change",
    category: "Development",
    action: runProdWatch,
  },
  setup: {
    description:
      "First-time setup: install deps, git hooks, python venv, containers, migrate, build",
    category: "Development",
    action: runSetup,
  },
  containers: {
    description:
      "Start containers, wait for Postgres, run migrations, build server",
    category: "Development",
    action: runContainers,
  },

  test: {
    description: "Run tests for client (Vitest) and server (cargo test)",
    category: "Quality",
    action: async () => {
      await runBun(["run", "test:run"], "client tests");
      await runCargo(["test"], "server tests");
    },
  },

  build: {
    description: "Build client (tsc + vite) then server (cargo)",
    category: "Build",
    action: async () => {
      await runBun(["run", "build"], "client build");
      await runCargo(["build"], "server build");
    },
  },
  "build-release": {
    description: "Build client then server (release)",
    category: "Build",
    action: async () => {
      await runBun(["run", "build"], "client build");
      await runCargo(["build", "--release"], "server release build");
    },
  },

  lint: {
    description: "Lint client (ESLint), server (Clippy), and Python (ruff)",
    category: "Quality",
    action: async () => {
      await runBun(["run", "lint"], "client lint");
      await runCargo(["clippy", "--", "-D", "warnings"], "server lint");
      await runVenv(["ruff", "check", "."], "python lint");
    },
  },
  fmt: {
    description:
      "Format client (Prettier), server (cargo fmt), and Python (ruff)",
    category: "Quality",
    action: async () => {
      await runBun(["run", "format"], "client format");
      await runCargo(["fmt"], "server fmt");
      await runVenv(["ruff", "format", "."], "python format");
    },
  },
  "fmt-check": {
    description: "Check formatting for client, server, and Python",
    category: "Quality",
    action: async () => {
      await runBun(["run", "format:check"], "client format check");
      await runCargo(["fmt", "--", "--check"], "server fmt-check");
      await runVenv(["ruff", "format", "--check", "."], "python format check");
    },
  },
  "sqlx-check": {
    description:
      "Verify .sqlx/ offline cache matches the code (no DB needed, fast)",
    category: "Quality",
    action: () =>
      runVenvScript(["scripts/sqlx_sync.py", "check"], "sqlx cache check"),
  },
  "sqlx-prepare": {
    description:
      "Regenerate .sqlx/ offline cache against DATABASE_URL from .env.development",
    category: "Quality",
    action: () =>
      runVenvScript(["scripts/sqlx_sync.py", "fix"], "sqlx prepare"),
  },

  "test-connections": {
    description:
      "Ping Supabase Postgres + S3 using server/.env files (dev + prod, or pass 'dev' / 'prod')",
    category: "Quality",
    action: runTestConnections,
  },

  "pre-commit": {
    description: "Run all CI checks (fmt-check, lint, test) for all",
    category: "Quality",
    action: runPreCommit,
  },
  validate: {
    description: "Run all validations (pre-push) for all",
    category: "Quality",
    action: runValidate,
  },
};

/**
 * Spawns a subprocess with inherited stdio (unless overridden).
 *
 * @param {string} command Executable or shell builtin (uses `shell: true` on Windows).
 * @param {string[]} [args] argv tokens after the command.
 * @param {import('node:child_process').SpawnOptions} [options] Passed to `spawn` (e.g. `cwd`, `env`, `stdio`).
 * @returns {Promise<void>} Resolves on exit code 0; rejects otherwise.
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0 || code === null) {
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
 * Runs a Bun command in {@link APP_DIR} (typically `package.json` scripts).
 *
 * @param {string[]} args Arguments after `bun` (e.g. `["run", "dev"]`).
 * @param {string} [label] Human-readable log line; omitted section headers if falsy.
 * @returns {Promise<void>}
 */
async function runBun(args, label) {
  if (label) {
    console.log(chalk.cyan(`Running: ${label}...`));
    console.log();
  }
  await runCommand("bun", args, { cwd: APP_DIR });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

/**
 * Runs a Cargo command in {@link SERVER_DIR}.
 *
 * @param {string[]} args Arguments after `cargo`.
 * @param {string} [label] Human-readable log line.
 * @param {import('node:child_process').SpawnOptions} [options] Extra spawn options merged into defaults.
 * @returns {Promise<void>}
 */
async function runCargo(args, label, options = {}) {
  if (label) {
    console.log(chalk.cyan(`Running: ${label}...`));
    console.log();
  }
  await runCommand("cargo", args, { cwd: SERVER_DIR, ...options });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

/**
 * Runs `docker compose -f docker-compose.dev.yml` from {@link SERVER_DIR}.
 *
 * @param {string[]} args Subcommand and flags (e.g. `["up", "-d"]`).
 * @returns {Promise<void>}
 */
async function runDocker(args) {
  const label = `docker compose ${args.join(" ")}`;
  console.log(chalk.cyan(`Running: ${label}...`));
  console.log();
  await runCommand("docker", ["compose", "-f", COMPOSE_FILE, ...args], {
    cwd: SERVER_DIR,
  });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

/**
 * Runs `python -m <module> ...` using the scripts venv from {@link SCRIPTS_DIR}.
 *
 * @param {string[]} args Tokens after `python -m` (e.g. `["ruff", "check", "."]`).
 * @param {string} [label] Human-readable log line.
 * @returns {Promise<void>}
 */
async function runVenv(args, label) {
  if (label) {
    console.log(chalk.cyan(`Running: ${label}...`));
    console.log();
  }
  await runCommand(VENV_PYTHON, ["-m", ...args], { cwd: SCRIPTS_DIR });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

/**
 * Runs the venv Python with arbitrary argv (script path as first arg), cwd {@link SERVER_DIR}.
 *
 * @param {string[]} args e.g. `["scripts/sqlx_sync.py", "check"]`.
 * @param {string} [label] Human-readable log line.
 * @returns {Promise<void>}
 */
async function runVenvScript(args, label) {
  if (label) {
    console.log(chalk.cyan(`Running: ${label}...`));
    console.log();
  }
  await runCommand(VENV_PYTHON, args, { cwd: SERVER_DIR });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

/**
 * Prints a bold section header with a divider line (`▶ {label}...`).
 *
 * @param {string} label Step title.
 */
function step(label) {
  console.log(chalk.bold.yellow(`\n▶ ${label}...`));
  console.log(chalk.dim("─".repeat(50)));
}

/**
 * Prints a bordered success banner.
 *
 * @param {string} message Short completion message.
 */
function done(message) {
  console.log();
  console.log(chalk.bold.green("═".repeat(50)));
  console.log(chalk.bold.green(`✓ ${message}`));
  console.log(chalk.bold.green("═".repeat(50)));
}

/**
 * Spawns multiple long-running processes concurrently; prefixes each stdout/stderr line.
 * Registers SIGINT/SIGTERM handlers to terminate all children.
 *
 * @param {Array<{
 *   command: string,
 *   args: string[],
 *   cwd: string,
 *   prefix: string,
 *   color: (s: string) => string,
 *   env?: NodeJS.ProcessEnv
 * }>} procs Process specs (typically Vite + cargo-watch).
 * @returns {Promise<void>} Rejects if any child exits non-zero.
 */
async function runConcurrent(procs) {
  const children = [];

  const spawnOne = ({ command, args, cwd, prefix, color, env = {} }) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
      env: { ...process.env, ...env },
    });

    children.push(child);
    const tag = color(`[${prefix}]`);

    child.stdout.on("data", (data) => {
      data
        .toString()
        .split("\n")
        .filter((l) => l.trim())
        .forEach((l) => console.log(`${tag} ${l}`));
    });
    child.stderr.on("data", (data) => {
      data
        .toString()
        .split("\n")
        .filter((l) => l.trim())
        .forEach((l) => console.error(`${tag} ${l}`));
    });

    return new Promise((resolve, reject) => {
      child.on("exit", (code) => {
        if (code === 0 || code === null) resolve();
        else reject(new Error(`${prefix} exited with code ${code}`));
      });
      child.on("error", reject);
    });
  };

  const cleanup = () =>
    children.forEach((c) => {
      try {
        c.kill("SIGTERM");
      } catch {}
    });
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    await Promise.all(procs.map(spawnOne));
  } finally {
    cleanup();
  }
}

/**
 * Run a list of named checks sequentially, exiting on the first failure.
 * @param {{ name: string, fn: () => Promise<void> }[]} checks
 * @param {string} failHint  Extra line printed after a failure.
 */
async function runChecks(checks, failHint = "") {
  for (const check of checks) {
    try {
      step(`Running ${check.name}`);
      await check.fn();
    } catch {
      console.log();
      console.log(chalk.bold.red(`✗ ${check.name} failed!`));
      if (failHint) console.log(chalk.dim(failHint));
      process.exit(1);
    }
  }
}

/**
 * Dev stack: Vite on 5173 and `cargo watch -x run` on 8080, logs interleaved with tags.
 *
 * @returns {Promise<void>}
 */
async function runDev() {
  console.log(chalk.bold.cyan("Starting client and server concurrently..."));
  console.log(chalk.dim("  client → http://localhost:5173  (Vite HMR)"));
  console.log(chalk.dim("  server → http://localhost:8080  (cargo-watch)"));
  console.log();

  await runConcurrent([
    {
      command: "bun",
      args: ["run", "dev"],
      cwd: APP_DIR,
      prefix: "client",
      color: chalk.blue,
    },
    {
      command: "cargo",
      args: ["watch", "-x", "run"],
      cwd: SERVER_DIR,
      prefix: "server",
      color: chalk.yellow,
    },
  ]);
}

/**
 * Production path: release-build client + server, then runs `mdhd-server` with `RUN_ENV=production`.
 *
 * @returns {Promise<void>}
 */
async function runProd() {
  console.log(chalk.bold.cyan("Building and serving production..."));
  console.log();

  step("Building client (release)");
  await runBun(["run", "build"], "client release build");

  step("Building server (release)");
  await runCargo(["build", "--release"], "server release build");

  step("Serving");
  console.log(
    chalk.dim("  server → http://localhost:8080  (RUN_ENV=production)"),
  );
  console.log();

  const serverBin = join(SERVER_DIR, "target", "release", "mdhd-server");
  await runCommand(serverBin, [], {
    cwd: SERVER_DIR,
    env: { ...process.env, RUN_ENV: "production" },
    stdio: "inherit",
  });
}

/**
 * Watches client (`vite build --watch`) and server (release build + binary via cargo-watch).
 *
 * @returns {Promise<void>}
 */
async function runProdWatch() {
  console.log(chalk.bold.cyan("Starting production watch mode..."));
  console.log(chalk.dim("  client → rebuilds to dist/ on source changes"));
  console.log(
    chalk.dim(
      "  server → http://localhost:8080  (RUN_ENV=production, cargo-watch)",
    ),
  );
  console.log();

  const serverBin = join(SERVER_DIR, "target", "release", "mdhd-server");
  const cargoWatchCmd = `cargo build --release && ${serverBin}`;

  await runConcurrent([
    {
      command: "bun",
      args: ["run", "vite", "build", "--watch"],
      cwd: APP_DIR,
      prefix: "client",
      color: chalk.blue,
    },
    {
      command: "cargo",
      args: ["watch", "-s", cargoWatchCmd],
      cwd: SERVER_DIR,
      prefix: "server",
      color: chalk.yellow,
      env: { RUN_ENV: "production" },
    },
  ]);
}

/**
 * Polls `pg_isready` inside the Compose `postgres` service until ready or retries exhausted.
 *
 * @param {number} [retries=30] Maximum attempts (one second apart).
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
        { cwd: SERVER_DIR, stdio: "ignore" },
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
 * Creates `server/scripts/.venv` if missing and installs `requirements.txt` via pip.
 *
 * @returns {Promise<void>}
 */
async function runPythonSetup() {
  console.log(chalk.bold.cyan("Setting up Python virtual environment..."));
  console.log();

  const { existsSync } = await import("node:fs");
  if (!existsSync(VENV_DIR)) {
    console.log(chalk.yellow("▶ Creating virtual environment..."));
    await runCommand("python3", ["-m", "venv", VENV_DIR], { cwd: SCRIPTS_DIR });
    console.log(chalk.green("✓ venv created!"));
  } else {
    console.log(chalk.dim("Skipping venv creation — already exists."));
  }

  console.log(chalk.yellow("▶ Installing dependencies..."));
  await runCommand(VENV_PIP, ["install", "-r", "requirements.txt"], {
    cwd: SCRIPTS_DIR,
  });
  console.log();
  console.log(chalk.green("✓ Python setup complete!"));
}

/**
 * Steps before Docker: Bun install, lefthook, Python venv, and dev env file bootstrap.
 *
 * @returns {Promise<void>}
 */
async function runPreContainerSetup() {
  step("Installing app dependencies");
  await runBun(["install"], "app dependencies");

  step("Installing git hooks (lefthook)");
  await runBun(["x", "lefthook", "install"], "lefthook install");

  step("Setting up Python environment");
  await runPythonSetup();

  step("Setting up server environment");
  await ensureServerDevEnvFile();
}

/**
 * Brings up dev Compose stack, waits for Postgres, ensures `.env.development`, runs SQLx migrations, builds server.
 *
 * @returns {Promise<void>}
 * @throws {Error} On missing DB URL, pooler-only URL on 6543, or migration failure.
 */
async function runContainers() {
  console.log(chalk.bold.cyan("Starting containers and running migrations..."));
  console.log();

  step("Starting containers");
  await runDocker(["up", "-d"]);

  await waitForPostgres();

  await ensureServerDevEnvFile();

  step("Running migrations");
  console.log(chalk.cyan("Running: sqlx migrate run..."));
  const migrationOverride =
    process.env.MIGRATION_DATABASE_URL ||
    (existsSync(SERVER_DEV_ENV_FILE)
      ? loadEnvVarFromDotenv(SERVER_DEV_ENV_FILE, "MIGRATION_DATABASE_URL")
      : null);
  const databaseUrl =
    process.env.DATABASE_URL ||
    (existsSync(SERVER_DEV_ENV_FILE)
      ? loadEnvVarFromDotenv(SERVER_DEV_ENV_FILE, "DATABASE_URL")
      : null);
  const resolvedForMigrate = migrationOverride || databaseUrl;
  if (resolvedForMigrate?.includes(":6543")) {
    throw new Error(
      "Migrations cannot use Supabase transaction pooler (port 6543). Set MIGRATION_DATABASE_URL in server/.env.development to the session pooler or direct Postgres URL (port 5432). See server/.env.supabase.example.",
    );
  }
  if (!resolvedForMigrate) {
    throw new Error(
      "DATABASE_URL (or MIGRATION_DATABASE_URL) must be set in server/.env.development or in the environment before running migrations.",
    );
  }
  const migrateArgs = [
    "sqlx",
    "migrate",
    "run",
    "--no-dotenv",
    "--database-url",
    databaseUrlWithStatementCacheDisabled(resolvedForMigrate),
  ];
  await runCommand("cargo", migrateArgs, { cwd: SERVER_DIR });
  console.log(chalk.green("✓ Migrations applied!"));

  step("Building server");
  await runCargo(["build"], "server build");

  done("Containers ready! Run 'make dev' to start.");
}

/**
 * Full first-time flow: {@link runPreContainerSetup} then {@link runContainers}.
 *
 * @returns {Promise<void>}
 */
async function runSetup() {
  console.log(chalk.bold.cyan("Running first-time setup..."));
  console.log();

  await runPreContainerSetup();
  await runContainers();

  done("Setup complete! Run 'make dev' to start.");
}

/**
 * Runs `server/scripts/check_connections.py` against Supabase (optional `dev` / `prod` from `process.argv[3]`).
 *
 * @returns {Promise<void>}
 */
async function runTestConnections() {
  const target = process.argv[3];
  const args = ["scripts/check_connections.py"];
  if (target) args.push(target);
  console.log(
    chalk.bold.cyan(
      `Testing Supabase connections${target ? ` (${target})` : " (dev + prod)"}...`,
    ),
  );
  console.log();
  await runCommand(VENV_PYTHON, args, { cwd: SERVER_DIR, stdio: "inherit" });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

/**
 * Local gate mirroring pre-commit: fmt-check, lint, and tests for client, server, and Python.
 *
 * @returns {Promise<void>}
 */
async function runPreCommit() {
  console.log(chalk.bold.cyan("Running pre-commit checks..."));
  console.log();

  await runChecks(
    [
      {
        name: "client fmt-check",
        fn: () => runBun(["run", "format:check"], "client format check"),
      },
      { name: "client lint", fn: () => runBun(["run", "lint"], "client lint") },
      {
        name: "server fmt-check",
        fn: () => runCargo(["fmt", "--", "--check"], "server fmt-check"),
      },
      {
        name: "server lint (Clippy)",
        fn: () => runCargo(["clippy", "--", "-D", "warnings"], "server lint"),
      },
      { name: "server tests", fn: () => runCargo(["test"], "server test") },
      {
        name: "python fmt-check",
        fn: () =>
          runVenv(["ruff", "format", "--check", "."], "python format check"),
      },
      {
        name: "python lint",
        fn: () => runVenv(["ruff", "check", "."], "python lint"),
      },
    ],
    "Fix the issues above and try again.",
  );

  done("All pre-commit checks passed!");
  console.log();
}

/**
 * Broader CI-style gate: fmt-check, lint, tests, plus client build and server release build.
 *
 * @returns {Promise<void>}
 */
async function runValidate() {
  console.log(chalk.bold.cyan("Running full validation..."));
  console.log();

  await runChecks([
    {
      name: "client fmt-check",
      fn: () => runBun(["run", "format:check"], "client format check"),
    },
    { name: "client lint", fn: () => runBun(["run", "lint"], "client lint") },
    {
      name: "client build",
      fn: () => runBun(["run", "build"], "client build"),
    },
    {
      name: "server fmt-check",
      fn: () => runCargo(["fmt", "--", "--check"], "server fmt-check"),
    },
    {
      name: "server lint (Clippy)",
      fn: () => runCargo(["clippy", "--", "-D", "warnings"], "server lint"),
    },
    { name: "server tests", fn: () => runCargo(["test"], "server test") },
    {
      name: "python fmt-check",
      fn: () =>
        runVenv(["ruff", "format", "--check", "."], "python format check"),
    },
    {
      name: "python lint",
      fn: () => runVenv(["ruff", "check", "."], "python lint"),
    },
    {
      name: "server release build",
      fn: () => runCargo(["build", "--release"], "server release"),
    },
  ]);

  done("All validations passed! Ready to push.");
}

/**
 * Prints grouped task list from {@link tasks} and hints for app/server makefiles.
 *
 * @returns {Promise<void>}
 */
function showHelp() {
  console.log();
  console.log(chalk.bold("  MDHD — root task runner"));
  console.log(
    chalk.dim("  Run client/server-specific commands from their directories:"),
  );
  console.log(chalk.dim("    cd app && node makefile.mjs help"));
  console.log(chalk.dim("    cd server && node makefile.mjs help"));
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
      const taskName = chalk.green(`make ${task.name.padEnd(22)}`);
      console.log(`  ${taskName} ${task.description}`);
    }

    console.log();
  }

  return Promise.resolve();
}

/**
 * CLI entry: first arg is task name (default `help`); unknown names exit 1.
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
