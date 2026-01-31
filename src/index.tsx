import { render } from "@opentui/solid";
import App from "./tui/client/app";
import { appendFileSync } from "fs";

const logFile = "/tmp/adk-tui-debug.log";

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  appendFileSync(logFile, line);
}

log("Starting ADK TUI...");
log(`TERM: ${process.env.TERM}`);
log(`COLORTERM: ${process.env.COLORTERM}`);
log(`stdout.isTTY: ${process.stdout.isTTY}`);
log(`stdin.isTTY: ${process.stdin.isTTY}`);
log(`columns: ${process.stdout.columns}, rows: ${process.stdout.rows}`);

async function start() {
  log("Calling render()...");
  try {
    await render(() => {
      log("Rendering App component...");
      return <App />;
    }, {
        targetFps: 30,
        gatherStats: false,
        exitOnCtrlC: true,
        useKittyKeyboard: null,
        useMouse: false,
        useAlternateScreen: true,
    });
    log("render() completed - this means TUI exited");
  } catch (e) {
    log(`ERROR in render: ${e}`);
    process.stdout.write('\x1b[?25h\x1b[0m\n');
    console.error("Failed to start TUI:", e);
    process.exit(1);
  }
}

start().catch(e => {
  log(`Unhandled error: ${e}`);
  process.exit(1);
});
