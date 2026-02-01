#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import { rm } from "fs/promises";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_DIR = join(__dirname, "app");

const chalkModulePath = join(
  APP_DIR,
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
  install: {
    description: "Install dependencies",
    category: "Development",
    action: runNpmInstall,
  },
  setup: {
    description: "Setup project (install + husky)",
    category: "Development",
    action: runSetup,
  },
  dev: {
    description: "Start development server",
    category: "Development",
    action: () => runNpmCommand("dev"),
  },
  build: {
    description: "Build for production",
    category: "Build",
    action: () => runNpmCommand("build"),
  },
  preview: {
    description: "Preview production build",
    category: "Build",
    action: () => runNpmCommand("preview"),
  },
  lint: {
    description: "Run ESLint",
    category: "Quality",
    action: () => runNpmCommand("lint"),
  },
  typecheck: {
    description: "Run TypeScript type checking",
    category: "Quality",
    action: () => runTypeCheck(),
  },
  format: {
    description: "Format code with Prettier",
    category: "Quality",
    action: () => runNpmCommand("format"),
  },
  "format-check": {
    description: "Check code formatting",
    category: "Quality",
    action: () => runNpmCommand("format:check"),
  },
  "pre-commit": {
    description: "Run all CI checks (lint, typecheck, build)",
    category: "Quality",
    action: runPreCommit,
  },
  test: {
    description: "Run unit tests",
    category: "Testing",
    action: () => runNpmCommand("test:run"),
  },
  "test:watch": {
    description: "Run tests in watch mode",
    category: "Testing",
    action: () => runNpmCommand("test"),
  },
  "test:ui": {
    description: "Run tests with Vitest UI",
    category: "Testing",
    action: () => runNpmCommand("test:ui"),
  },
  "test:coverage": {
    description: "Run tests with coverage",
    category: "Testing",
    action: () => runNpmCommand("test:coverage"),
  },
  "test:e2e": {
    description: "Run Playwright E2E tests",
    category: "Testing",
    action: runE2ETests,
  },
  "test:all": {
    description: "Run all tests (unit + E2E)",
    category: "Testing",
    action: runAllTests,
  },
  security: {
    description: "Run security audit",
    category: "Security",
    action: runSecurityAudit,
  },
  knip: {
    description: "Find dead code and dependencies",
    category: "Quality",
    action: () => runNpmCommand("knip"),
  },
  validate: {
    description: "Run all validations (pre-push)",
    category: "Quality",
    action: runValidate,
  },
  clean: {
    description: "Remove node_modules and dist",
    category: "Maintenance",
    action: cleanProject,
  },
};

// Helper function to run commands in the app directory
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const finalCommand = isWindows && command === "npm" ? "npm.cmd" : command;

    const child = spawn(finalCommand, args, {
      cwd: APP_DIR,
      stdio: "inherit",
      shell: isWindows,
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

// Helper function to run npm install
async function runNpmInstall() {
  try {
    console.log(chalk.cyan("Running: npm install..."));
    console.log();

    await runCommand("npm", ["install"]);

    console.log();
    console.log(chalk.green("✓ Dependencies installed!"));
  } catch (error) {
    throw new Error("npm install failed");
  }
}

// Helper function to run npm commands in the app directory
function runNpmCommand(command) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(chalk.cyan(`Running: npm run ${command}...`));
      console.log();

      await runCommand("npm", ["run", command]);

      console.log();
      console.log(chalk.green("✓ Done!"));
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Run TypeScript type checking
async function runTypeCheck() {
  try {
    console.log(chalk.cyan("Running TypeScript type check..."));
    console.log();

    await runCommand("npx", ["tsc", "--noEmit"]);

    console.log();
    console.log(chalk.green("✓ Type check passed!"));
  } catch (error) {
    throw new Error("Type check failed");
  }
}

// Run pre-commit checks (matches CI workflow)
async function runPreCommit() {
  console.log(chalk.bold.cyan("Running pre-commit checks..."));
  console.log();

  const checks = [
    { name: "ESLint", fn: () => runNpmCommand("lint") },
    { name: "TypeScript", fn: runTypeCheck },
    { name: "Build", fn: () => runNpmCommand("build") },
  ];

  for (const check of checks) {
    try {
      console.log(chalk.bold.yellow(`\n▶ Running ${check.name}...`));
      console.log(chalk.dim("─".repeat(50)));
      await check.fn();
    } catch (error) {
      console.log();
      console.log(chalk.bold.red(`✗ ${check.name} check failed!`));
      console.log(chalk.red(`Error: ${error.message}`));
      console.log();
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

async function cleanProject() {
  console.log(chalk.cyan("Cleaning up..."));

  const pathsToRemove = [join(APP_DIR, "node_modules"), join(APP_DIR, "dist")];

  for (const path of pathsToRemove) {
    if (existsSync(path)) {
      console.log(chalk.dim(`  Removing ${path}...`));
      await rm(path, { recursive: true, force: true });
    }
  }

  console.log(chalk.green("✓ Done!"));
}

// Setup project with dependencies and husky
async function runSetup() {
  console.log(chalk.bold.cyan("Setting up project..."));
  console.log();

  try {
    console.log(chalk.yellow("▶ Installing dependencies..."));
    await runCommand("npm", ["install"]);

    console.log(chalk.yellow("▶ Setting up Husky git hooks..."));
    await runCommand("npx", ["husky", "install"]);

    console.log();
    console.log(chalk.bold.green("✓ Project setup complete!"));
  } catch (error) {
    throw new Error("Setup failed: " + error.message);
  }
}

// Run E2E tests with Playwright
async function runE2ETests() {
  try {
    console.log(chalk.cyan("Running Playwright E2E tests..."));
    console.log();

    await runCommand("npx", ["playwright", "test"], { cwd: __dirname });

    console.log();
    console.log(chalk.green("✓ E2E tests passed!"));
  } catch (error) {
    throw new Error("E2E tests failed");
  }
}

// Run all tests (unit + E2E)
async function runAllTests() {
  console.log(chalk.bold.cyan("Running all tests..."));
  console.log();

  const tests = [
    { name: "Unit Tests", fn: () => runNpmCommand("test:run") },
    { name: "E2E Tests", fn: runE2ETests },
  ];

  for (const test of tests) {
    try {
      console.log(chalk.bold.yellow(`\n▶ Running ${test.name}...`));
      console.log(chalk.dim("─".repeat(50)));
      await test.fn();
    } catch (error) {
      console.log();
      console.log(chalk.bold.red(`✗ ${test.name} failed!`));
      process.exit(1);
    }
  }

  console.log();
  console.log(chalk.bold.green("═".repeat(50)));
  console.log(chalk.bold.green("✓ All tests passed!"));
  console.log(chalk.bold.green("═".repeat(50)));
}

// Run security audit
async function runSecurityAudit() {
  console.log(chalk.bold.cyan("Running security audit..."));
  console.log();

  try {
    await runCommand("npm", ["audit", "--audit-level=moderate"]);
    console.log();
    console.log(chalk.green("✓ Security audit passed!"));
  } catch (error) {
    console.log();
    console.log(
      chalk.yellow(
        "⚠ Security vulnerabilities found. Run 'npm audit' for details.",
      ),
    );
  }
}

// Run all validations (pre-push)
async function runValidate() {
  console.log(chalk.bold.cyan("Running full validation..."));
  console.log();

  const checks = [
    { name: "Format Check", fn: () => runNpmCommand("format:check") },
    { name: "ESLint", fn: () => runNpmCommand("lint") },
    { name: "TypeScript", fn: runTypeCheck },
    { name: "Unit Tests", fn: () => runNpmCommand("test:run") },
    { name: "Build", fn: () => runNpmCommand("build") },
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

  // Group tasks by category
  const categories = {};
  for (const [name, task] of Object.entries(tasks)) {
    if (!categories[task.category]) {
      categories[task.category] = [];
    }
    categories[task.category].push({ name, ...task });
  }

  // Display each category
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

// Main execution
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
