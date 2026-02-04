import { render } from "@opentui/solid";
import App from "./tui/client/app";

// Debug logging (can be disabled in production)
const DEBUG = process.env.ADK_TUI_DEBUG === "1";
const logFile = "/tmp/adk-tui-debug.log";

// Reset debug log on each run
try {
  const { writeFileSync } = require("fs");
  writeFileSync(logFile, "");
} catch {
  // Ignore log reset errors
}

function log(msg: string) {
  if (!DEBUG) return;
  const { appendFileSync } = require("fs");
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  appendFileSync(logFile, line);
}

log("Starting ADK TUI...");
log(`TERM: ${process.env.TERM}`);
log(`COLORTERM: ${process.env.COLORTERM}`);
log(`stdout.isTTY: ${process.stdout.isTTY}`);
log(`stdin.isTTY: ${process.stdin.isTTY}`);
log(`columns: ${process.stdout.columns}, rows: ${process.stdout.rows}`);

// Graceful shutdown handling
let isShuttingDown = false;

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  log("Cleaning up...");

  try {
    // Disable all terminal modes and restore state
    const fs = require("fs");
    const fd = process.stdout.fd;
    
    // Write all cleanup sequences
    fs.writeSync(fd, "\x1b[?1049l"); // Exit alternate screen (do this first)
    fs.writeSync(fd, "\x1b[?25h"); // Show cursor
    fs.writeSync(fd, "\x1b[?1000l"); // Disable mouse tracking
    fs.writeSync(fd, "\x1b[?1002l"); // Disable button event mouse tracking
    fs.writeSync(fd, "\x1b[?1003l"); // Disable all mouse tracking
    fs.writeSync(fd, "\x1b[?1006l"); // Disable SGR mouse mode
    fs.writeSync(fd, "\x1b[0m"); // Reset colors and attributes
    fs.writeSync(fd, "\x1b[2J"); // Clear screen
    fs.writeSync(fd, "\x1b[H"); // Move cursor to home
    fs.writeSync(fd, "\r\n"); // Add a newline
  } catch (e) {
    log(`Cleanup error: ${e}`);
  }

  log("Cleanup complete");
}

// Handle signals
process.on("SIGINT", () => {
  log("Received SIGINT");
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("Received SIGTERM");
  cleanup();
  process.exit(0);
});

process.on("exit", () => {
  cleanup();
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  log(`Uncaught exception: ${error.message}`);
  console.error("Uncaught exception:", error);
  cleanup();
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log(`Unhandled rejection: ${reason}`);
  console.error("Unhandled rejection:", reason);
});

async function start() {
  const cliUrl = process.argv[2];

  // Check if running in a TTY
  log(`Checking TTY status...`);
  log(`stdout.isTTY: ${process.stdout.isTTY}`);
  log(`stdin.isTTY: ${process.stdin.isTTY}`);
  
  // Allow either stdin or stdout to be TTY, or both undefined (for certain environments)
  const hasStdinTTY = process.stdin.isTTY === true;
  const hasStdoutTTY = process.stdout.isTTY === true;
  
  if (!hasStdinTTY && !hasStdoutTTY && process.stdout.isTTY === false) {
    const msg = "Error: ADK TUI must be run in a terminal (TTY required)";
    log(msg);
    console.error(msg);
    console.error("Stdout is TTY:", process.stdout.isTTY);
    console.error("Stdin is TTY:", process.stdin.isTTY);
    process.exit(1);
  }

  log("TTY check passed");
  log("Calling render()...");
  
  try {
    await render(
      () => {
        log("Rendering App component...");
        return <App initialServerUrl={cliUrl} />;
      },
      {
        targetFps: 30,
        gatherStats: false,
        exitOnCtrlC: true,
        useKittyKeyboard: null,
        useMouse: true, // Enable mouse for clicking
        useAlternateScreen: true,
      }
    );
    log("render() completed - this means TUI exited");
  } catch (e) {
    log(`ERROR in render: ${e}`);
    cleanup();
    console.error("Failed to start TUI:", e);
    process.exit(1);
  }
}

start().catch((e) => {
  log(`Unhandled error: ${e}`);
  cleanup();
  process.exit(1);
});
