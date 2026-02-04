import { Show, onMount, createSignal, Switch, Match } from "solid-js";
import { ThemeProvider, useTheme } from "../context/theme";
import { SDKProvider } from "../context/sdk";
import { KVProvider } from "../context/kv";
import { SyncProvider } from "../context/sync";
import { KeybindProvider, useKeybind } from "../context/keybind";
import { DialogProvider, useDialog } from "../ui/dialog";
import { CommandProvider } from "../context/command";
import { RouteProvider, useRoute } from "../context/route";
import { SessionProvider, useSession } from "../context/session";
import { Home } from "../routes/home";
import { SessionView } from "../routes/session";
import { DialogSessionList } from "../components/dialog-session-list";
import { DialogApp } from "../components/dialog-app";
import { useKeyboard } from "@opentui/solid";

const DEBUG = process.env.ADK_TUI_DEBUG === "1";
function log(msg: string) {
  if (!DEBUG) return;
  const { appendFileSync } = require("fs");
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  appendFileSync("/tmp/adk-tui-debug.log", line);
}

function MainContent() {
  const { theme } = useTheme();
  const keybind = useKeybind();
  const route = useRoute();
  const session = useSession();
  const dialog = useDialog();

  log("MainContent rendering...");

  // Global keybind handlers
  useKeyboard((evt) => {
    // Session list
    if (keybind.match("session_list", evt)) {
      evt.preventDefault();
      dialog.replace(() => <DialogSessionList />);
      return;
    }

    // New session
    if (keybind.match("session_new", evt)) {
      evt.preventDefault();
      dialog.replace(() => <DialogApp />);
      return;
    }
  });

  log("MainContent about to return JSX...");

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      backgroundColor={theme.background}
    >
      <Switch>
        <Match when={route.current().type === "home"}>
          <Home />
        </Match>
        <Match when={route.current().type === "session"}>
          {(() => {
            const current = route.current();
            if (current.type === "session") {
              return <SessionView sessionId={current.sessionId} />;
            }
            return null;
          })()}
        </Match>
      </Switch>
    </box>
  );
}

function AppWithProviders() {
  return (
    <RouteProvider>
      <SessionProvider>
        <CommandProvider>
          <MainContent />
        </CommandProvider>
      </SessionProvider>
    </RouteProvider>
  );
}

export default function App(props: { initialServerUrl?: string }) {
  const [ready, setReady] = createSignal(false);

  log("App component created");

  onMount(() => {
    log("App onMount called");
    setReady(true);
    log("App ready state set to true");
  });

  log(`App rendering, ready=${ready()}`);

  return (
    <KVProvider>
      <SyncProvider>
        <SDKProvider initialServerUrl={props.initialServerUrl}>
          <ThemeProvider mode="dark">
            <KeybindProvider>
              <DialogProvider>
                <Show when={ready()}>
                  <AppWithProviders />
                </Show>
              </DialogProvider>
            </KeybindProvider>
          </ThemeProvider>
        </SDKProvider>
      </SyncProvider>
    </KVProvider>
  );
}
