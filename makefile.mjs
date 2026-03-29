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
    description: "Start client (port 5173) and server (port 8080) concurrently",
    category: "Development",
    action: runDev,
  },
  setup: {
    description:
      "First-time setup: install deps, git hooks, python venv, containers, migrate, build",
    category: "Development",
    action: runSetup,
  },
  containers: {
    description: "Start containers, wait for Postgres, run migrations, build server",
    category: "Development",
    action: runContainers,
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
    description: "Format client (Prettier), server (cargo fmt), and Python (ruff)",
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

  "python-setup": {
    description: "Create venv and install Python dependencies (scripts/)",
    category: "Python",
    action: runPythonSetup,
  },
  "python-fmt": {
    description: "Format Python scripts with ruff",
    category: "Python",
    action: () => runVenv(["ruff", "format", "."], "python format"),
  },
  "python-fmt-check": {
    description: "Check Python formatting (no write)",
    category: "Python",
    action: () => runVenv(["ruff", "format", "--check", "."], "python format check"),
  },
  "python-lint": {
    description: "Lint Python scripts with ruff",
    category: "Python",
    action: () => runVenv(["ruff", "check", "."], "python lint"),
  },
  "python-lint-fix": {
    description: "Lint and auto-fix Python scripts with ruff",
    category: "Python",
    action: () => runVenv(["ruff", "check", "--fix", "."], "python lint fix"),
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

async function runPreContainerSetup() {
  console.log(chalk.bold.yellow("\n▶ Installing app dependencies..."));
  console.log(chalk.dim("─".repeat(50)));
  await runBun(["install"], "app dependencies");

  console.log(chalk.bold.yellow("\n▶ Installing git hooks (lefthook)..."));
  console.log(chalk.dim("─".repeat(50)));
  await runBun(["x", "lefthook", "install"], "lefthook install");

  console.log(chalk.bold.yellow("\n▶ Setting up Python environment..."));
  console.log(chalk.dim("─".repeat(50)));
  await runPythonSetup();

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
}

async function runContainers() {
  console.log(chalk.bold.cyan("Starting containers and running migrations..."));
  console.log();

  console.log(chalk.bold.yellow("\n▶ Starting containers..."));
  console.log(chalk.dim("─".repeat(50)));
  await runDocker(["up", "-d"]);

  await waitForPostgres();

  console.log(chalk.bold.yellow("\n▶ Running migrations..."));
  console.log(chalk.dim("─".repeat(50)));
  console.log(chalk.cyan("Running: sqlx migrate run..."));
  await runCommand("cargo", ["sqlx", "migrate", "run"], { cwd: SERVER_DIR });
  console.log(chalk.green("✓ Migrations applied!"));

  console.log(chalk.bold.yellow("\n▶ Building server..."));
  console.log(chalk.dim("─".repeat(50)));
  await runCargo(["build"], "server build");

  console.log();
  console.log(chalk.bold.green("═".repeat(50)));
  console.log(chalk.bold.green("✓ Containers ready! Run 'make dev' to start."));
  console.log(chalk.bold.green("═".repeat(50)));
}

async function runSetup() {
  console.log(chalk.bold.cyan("Running first-time setup..."));
  console.log();

  await runPreContainerSetup();
  await runContainers();

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
    {
      name: "python fmt-check",
      fn: () => runVenv(["ruff", "format", "--check", "."], "python format check"),
    },
    {
      name: "python lint",
      fn: () => runVenv(["ruff", "check", "."], "python lint"),
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
      name: "python fmt-check",
      fn: () => runVenv(["ruff", "format", "--check", "."], "python format check"),
    },
    {
      name: "python lint",
      fn: () => runVenv(["ruff", "check", "."], "python lint"),
    },
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
  console.log(chalk.dim("  Run client/server-specific commands from their directories:"));
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
