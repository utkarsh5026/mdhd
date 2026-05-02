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
const SCRIPTS_DIR = join(SERVER_DIR, "scripts");
const VENV_DIR = join(SCRIPTS_DIR, ".venv");
const VENV_PYTHON = join(VENV_DIR, "bin", "python");
const VENV_PIP = join(VENV_DIR, "bin", "pip");

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

async function runVenv(args, label) {
  if (label) {
    console.log(chalk.cyan(`Running: ${label}...`));
    console.log();
  }
  await runCommand(VENV_PYTHON, ["-m", ...args], { cwd: SCRIPTS_DIR });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

async function runVenvScript(args, label) {
  if (label) {
    console.log(chalk.cyan(`Running: ${label}...`));
    console.log();
  }
  await runCommand(VENV_PYTHON, args, { cwd: SERVER_DIR });
  console.log();
  console.log(chalk.green("✓ Done!"));
}

/** Print a bold section header with a divider. */
function step(label) {
  console.log(chalk.bold.yellow(`\n▶ ${label}...`));
  console.log(chalk.dim("─".repeat(50)));
}

/** Print a bordered success banner. */
function done(message) {
  console.log();
  console.log(chalk.bold.green("═".repeat(50)));
  console.log(chalk.bold.green(`✓ ${message}`));
  console.log(chalk.bold.green("═".repeat(50)));
}

/**
 * Spawn multiple long-running processes concurrently, prefixing each line of
 * output with a colored tag. Cleans up all children on SIGINT/SIGTERM or when
 * any process exits.
 *
 * @param {{ command: string, args: string[], cwd: string, prefix: string, color: Function, env?: object }[]} procs
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

async function runPreContainerSetup() {
  step("Installing app dependencies");
  await runBun(["install"], "app dependencies");

  step("Installing git hooks (lefthook)");
  await runBun(["x", "lefthook", "install"], "lefthook install");

  step("Setting up Python environment");
  await runPythonSetup();

  step("Setting up server environment");
  const envPath = join(SERVER_DIR, ".env");
  const envExamplePath = join(SERVER_DIR, ".env.example");
  const { existsSync } = await import("node:fs");
  if (existsSync(envPath)) {
    console.log(chalk.dim("Skipping .env — already exists."));
  } else {
    console.log(chalk.dim("Creating .env from .env.example..."));
    await runCommand("cp", [envExamplePath, envPath], { cwd: SERVER_DIR });
  }
}

async function runContainers() {
  console.log(chalk.bold.cyan("Starting containers and running migrations..."));
  console.log();

  step("Starting containers");
  await runDocker(["up", "-d"]);

  await waitForPostgres();

  step("Running migrations");
  console.log(chalk.cyan("Running: sqlx migrate run..."));
  await runCommand("cargo", ["sqlx", "migrate", "run"], { cwd: SERVER_DIR });
  console.log(chalk.green("✓ Migrations applied!"));

  step("Building server");
  await runCargo(["build"], "server build");

  done("Containers ready! Run 'make dev' to start.");
}

async function runSetup() {
  console.log(chalk.bold.cyan("Running first-time setup..."));
  console.log();

  await runPreContainerSetup();
  await runContainers();

  done("Setup complete! Run 'make dev' to start.");
}

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
