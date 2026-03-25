#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_DIR = __dirname;

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
const chalk = await import(chalkModuleURL).then((m) => m.default);

const tasks = {
  help: {
    description: "Show this help message",
    category: "Help",
    action: showHelp,
  },
  dev: {
    description: "Start dev server (port 8080, reads .env)",
    category: "Development",
    action: () => runCargo(["run"]),
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
  test: {
    description: "Run all tests",
    category: "Testing",
    action: () => runCargo(["test"]),
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
  migrate: {
    description: "Run pending database migrations",
    category: "Database",
    action: () => runCargo(["sqlx", "migrate", "run"]),
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

async function runCargo(args) {
  const label = `cargo ${args.join(" ")}`;
  console.log(chalk.cyan(`Running: ${label}...`));
  console.log();
  await runCommand("cargo", args);
  console.log();
  console.log(chalk.green("✓ Done!"));
}

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

main();
