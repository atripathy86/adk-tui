import { render } from "@opentui/solid";
import App from "./tui/client/app";

async function start() {
  try {
    await render(() => <App />, {
        targetFps: 60,
        gatherStats: false,
        exitOnCtrlC: true,
        useKittyKeyboard: {},
    });
  } catch (e) {
    console.error("Failed to start TUI:", e);
    process.exit(1);
  }
}

start();
