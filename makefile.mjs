#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = __dirname;
const APP_DIR = join(ROOT_DIR, "app");
const SERVER_DIR = join(ROOT_DIR, "server");

// Try to load chalk, fallback to simple ANSI colors if not installed
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

const COMPOSE_FILE = join(SERVER_DIR, "docker-compose.dev.yml");

const tasks = {
  help: {
    description: "Show this help message",
    category: "Help",
    action: showHelp,
  },

  dev: {
    description: "Start client (port 5173) and server (port 8080) concurrently",
    category: "Development",
    action: runDev,
  },
  setup: {
    description:
      "First-time setup: install deps, git hooks, start containers, migrate, build server",
    category: "Development",
    action: runSetup,
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

  "client-dev": {
    description: "Start Vite dev server (port 5173)",
    category: "Client",
    action: () => runBun(["run", "dev"], "client dev"),
  },
  "client-build": {
    description: "TypeScript check + Vite production build",
    category: "Client",
    action: () => runBun(["run", "build"], "client build"),
  },
  "client-lint": {
    description: "ESLint check",
    category: "Client",
    action: () => runBun(["run", "lint"], "client lint"),
  },
  "client-fmt": {
    description: "Prettier format all files",
    category: "Client",
    action: () => runBun(["run", "format"], "client format"),
  },
  "client-fmt-check": {
    description: "Prettier check (no write)",
    category: "Client",
    action: () => runBun(["run", "format:check"], "client format check"),
  },
  "client-test": {
    description: "Vitest in watch mode",
    category: "Client",
    action: () => runBun(["run", "test"], "client test"),
  },
  "client-test-run": {
    description: "Vitest single run",
    category: "Client",
    action: () => runBun(["run", "test:run"], "client test:run"),
  },

  "server-dev": {
    description: "Start Rust dev server (port 8080, reads .env)",
    category: "Server",
    action: () => runCargo(["run"], "server dev"),
  },
  "server-dev-prod": {
    description: "Start server with RUN_ENV=production (local prod config)",
    category: "Server",
    action: () =>
      runCargo(["run"], "server dev:prod", {
        env: { ...process.env, RUN_ENV: "production" },
      }),
  },
  "server-watch": {
    description: "Auto-restart server on file changes (requires cargo-watch)",
    category: "Server",
    action: () => runCargo(["watch", "-x", "run"], "server watch"),
  },
  "server-build": {
    description: "Server debug build",
    category: "Server",
    action: () => runCargo(["build"], "server build"),
  },
  "server-build-release": {
    description: "Server optimized release build",
    category: "Server",
    action: () => runCargo(["build", "--release"], "server release build"),
  },

  "server-up": {
    description: "Start Postgres + MinIO containers",
    category: "Server",
    action: () => runDocker(["up", "-d"]),
  },
  "server-down": {
    description: "Stop containers (keep data)",
    category: "Server",
    action: () => runDocker(["down"]),
  },
  "server-nuke": {
    description: "Stop containers and delete volumes",
    category: "Server",
    action: () => runDocker(["down", "-v"]),
  },
  "server-ps": {
    description: "Show container status",
    category: "Server",
    action: () => runDocker(["ps"]),
  },
  "server-logs": {
    description: "Tail container logs",
    category: "Server",
    action: () => runDocker(["logs", "-f", "--tail", "50"]),
  },

  "server-migrate": {
    description: "Run pending database migrations",
    category: "Server",
    action: runMigrate,
  },
  "server-migrate-add": {
    description: "Create a new migration file (make server-migrate-add <name>)",
    category: "Server",
    action: runMigrateAdd,
  },
  "server-db-reset": {
    description: "Drop and recreate database, re-run migrations",
    category: "Server",
    action: runDbReset,
  },
  "server-db-shell": {
    description: "Open psql shell to dev database",
    category: "Server",
    action: () =>
      runCommand(
        "psql",
        ["postgresql://postgres:postgres@localhost:5432/mdhd"],
        {
          cwd: SERVER_DIR,
        },
      ),
  },

  "server-test": {
    description: "Run server tests",
    category: "Server",
    action: () => runCargo(["test"], "server test"),
  },
  "server-test-watch": {
    description: "Run server tests in watch mode (cargo-watch)",
    category: "Server",
    action: () => runCargo(["watch", "-x", "test"], "server test:watch"),
  },

  "server-lint": {
    description: "Server lint with Clippy (warnings as errors)",
    category: "Server",
    action: () => runCargo(["clippy", "--", "-D", "warnings"], "server lint"),
  },
  "server-fmt": {
    description: "Server format code",
    category: "Server",
    action: () => runCargo(["fmt"], "server fmt"),
  },
  "server-fmt-check": {
    description: "Server check formatting (CI)",
    category: "Server",
    action: () => runCargo(["fmt", "--", "--check"], "server fmt-check"),
  },
  "server-clean": {
    description: "Remove server build artifacts",
    category: "Server",
    action: () => runCargo(["clean"], "server clean"),
  },

  lint: {
    description: "Lint client (ESLint) and server (Clippy)",
    category: "Quality",
    action: async () => {
      await runBun(["run", "lint"], "client lint");
      await runCargo(["clippy", "--", "-D", "warnings"], "server lint");
    },
  },
  fmt: {
    description: "Format client (Prettier) and server (cargo fmt)",
    category: "Quality",
    action: async () => {
      await runBun(["run", "format"], "client format");
      await runCargo(["fmt"], "server fmt");
    },
  },
  "fmt-check": {
    description: "Check formatting for both client and server",
    category: "Quality",
    action: async () => {
      await runBun(["run", "format:check"], "client format check");
      await runCargo(["fmt", "--", "--check"], "server fmt-check");
    },
  },
  "pre-commit": {
    description: "Run all CI checks (fmt-check, lint, test) for both",
    category: "Quality",
    action: runPreCommit,
  },
  validate: {
    description: "Run all validations (pre-push) for both",
    category: "Quality",
    action: runValidate,
  },
};

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

async function runBun(args, label) {
  if (label) {
    console.log(chalk.cyan(`Running: ${label}...`));
    console.log();
  }
  await runCommand("bun", args, { cwd: APP_DIR });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

async function runCargo(args, label, options = {}) {
  if (label) {
    console.log(chalk.cyan(`Running: ${label}...`));
    console.log();
  }
  await runCommand("cargo", args, { cwd: SERVER_DIR, ...options });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

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

async function runDev() {
  console.log(chalk.bold.cyan("Starting client and server concurrently..."));
  console.log(chalk.dim("  client → http://localhost:5173"));
  console.log(chalk.dim("  server → http://localhost:8080"));
  console.log();

  const children = [];

  const spawnProcess = (command, args, cwd, prefix, color) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    children.push(child);

    const tag = color(`[${prefix}]`);

    child.stdout.on("data", (data) => {
      data
        .toString()
        .split("\n")
        .filter((line) => line.trim())
        .forEach((line) => console.log(`${tag} ${line}`));
    });

    child.stderr.on("data", (data) => {
      data
        .toString()
        .split("\n")
        .filter((line) => line.trim())
        .forEach((line) => console.error(`${tag} ${line}`));
    });

    return new Promise((resolve, reject) => {
      child.on("exit", (code) => {
        if (code === 0 || code === null) resolve();
        else reject(new Error(`${prefix} exited with code ${code}`));
      });
      child.on("error", reject);
    });
  };

  const cleanup = () => {
    children.forEach((child) => {
      try {
        child.kill("SIGTERM");
      } catch {}
    });
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    await Promise.all([
      spawnProcess("bun", ["run", "dev"], APP_DIR, "client", chalk.blue),
      spawnProcess("cargo", ["run"], SERVER_DIR, "server", chalk.yellow),
    ]);
  } finally {
    cleanup();
  }
}

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

async function runMigrate() {
  console.log(chalk.cyan("Running: sqlx migrate run..."));
  console.log();
  await runCommand("cargo", ["sqlx", "migrate", "run"], { cwd: SERVER_DIR });
  console.log();
  console.log(chalk.green("✓ Migrations applied!"));
}

async function runMigrateAdd() {
  const name = process.argv[3];
  if (!name) {
    console.error(chalk.red("Usage: make server-migrate-add <name>"));
    console.log(chalk.dim("  Example: make server-migrate-add create_posts"));
    process.exit(1);
  }
  console.log(chalk.cyan(`Creating migration: ${name}...`));
  console.log();
  await runCommand("cargo", ["sqlx", "migrate", "add", name], {
    cwd: SERVER_DIR,
  });
  console.log();
  console.log(chalk.green("✓ Migration file created!"));
}

async function runDbReset() {
  console.log(chalk.bold.cyan("Resetting database..."));
  console.log();

  const dbUrl = "postgresql://postgres:postgres@localhost:5432";

  console.log(chalk.yellow("▶ Dropping database mdhd..."));
  await runCommand("psql", [dbUrl, "-c", "DROP DATABASE IF EXISTS mdhd"], {
    cwd: SERVER_DIR,
  });

  console.log(chalk.yellow("▶ Creating database mdhd..."));
  await runCommand("psql", [dbUrl, "-c", "CREATE DATABASE mdhd"], {
    cwd: SERVER_DIR,
  });

  console.log(chalk.yellow("▶ Running migrations..."));
  await runMigrate();

  console.log();
  console.log(chalk.green("✓ Database reset complete!"));
}

async function runSetup() {
  console.log(chalk.bold.cyan("Running first-time setup..."));
  console.log();

  console.log(chalk.bold.yellow("\n▶ Installing app dependencies..."));
  console.log(chalk.dim("─".repeat(50)));
  await runBun(["install"], "app dependencies");

  console.log(chalk.bold.yellow("\n▶ Installing git hooks (lefthook)..."));
  console.log(chalk.dim("─".repeat(50)));
  await runBun(["x", "lefthook", "install"], "lefthook install");

  console.log(chalk.bold.yellow("\n▶ Setting up server environment..."));
  console.log(chalk.dim("─".repeat(50)));
  const envPath = join(SERVER_DIR, ".env");
  const envExamplePath = join(SERVER_DIR, ".env.example");
  const { existsSync } = await import("node:fs");
  if (existsSync(envPath)) {
    console.log(chalk.dim("Skipping .env — already exists."));
  } else {
    console.log(chalk.dim("Creating .env from .env.example..."));
    await runCommand("cp", [envExamplePath, envPath], { cwd: SERVER_DIR });
  }

  console.log(chalk.bold.yellow("\n▶ Starting containers..."));
  console.log(chalk.dim("─".repeat(50)));
  await runDocker(["up", "-d"]);

  await waitForPostgres();

  console.log(chalk.bold.yellow("\n▶ Running migrations..."));
  console.log(chalk.dim("─".repeat(50)));
  await runMigrate();

  console.log(chalk.bold.yellow("\n▶ Building server..."));
  console.log(chalk.dim("─".repeat(50)));
  await runCargo(["build"], "server build");

  console.log();
  console.log(chalk.bold.green("═".repeat(50)));
  console.log(chalk.bold.green("✓ Setup complete! Run 'make dev' to start."));
  console.log(chalk.bold.green("═".repeat(50)));
}

async function runPreCommit() {
  console.log(chalk.bold.cyan("Running pre-commit checks..."));
  console.log();

  const checks = [
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
  ];

  for (const check of checks) {
    try {
      console.log(chalk.bold.yellow(`\n▶ Running ${check.name}...`));
      console.log(chalk.dim("─".repeat(50)));
      await check.fn();
    } catch {
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

async function runValidate() {
  console.log(chalk.bold.cyan("Running full validation..."));
  console.log();

  const checks = [
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
      name: "server release build",
      fn: () => runCargo(["build", "--release"], "server release"),
    },
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

function showHelp() {
  console.log();
  console.log(chalk.bold("  MDHD — root task runner"));
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
