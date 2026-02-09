import { Show } from "solid-js";
import { useTheme } from "../context/theme";
import { useDialog } from "../ui/dialog";
import { useSDK } from "../context/sdk";
import { useSync } from "../context/sync";
import { useKeyboard } from "@opentui/solid";

export function DialogStatus() {
  const { theme } = useTheme();
  const dialog = useDialog();
  const sdk = useSDK();
  const sync = useSync();

  useKeyboard((evt) => {
    if (evt.name === "return" || evt.name === "escape") {
      dialog.clear();
    }
  });

  const sessionCount = () => sync.data.sessions.length;
  const currentApp = () => sync.data.currentApp;
  const currentSessionId = () => sync.data.currentSessionId;

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text bold fg={theme.text}>
          Status
        </text>
        <text fg={theme.textMuted}>esc</text>
      </box>

      <text fg={theme.textMuted}>ADK TUI v0.0.1</text>

      <text fg={theme.text} bold>
        Server
      </text>
      <box paddingLeft={2}>
        <box flexDirection="row" gap={1}>
          <text fg={theme.textMuted}>URL:</text>
          <Show
            when={sdk.serverUrl()}
            fallback={<text fg={theme.warning}>Not configured</text>}
          >
            <text fg={theme.text}>{sdk.serverUrl()}</text>
          </Show>
        </box>
        <box flexDirection="row" gap={1}>
          <text fg={theme.textMuted}>Status:</text>
          <Show
            when={sdk.isConnected()}
            fallback={
              <text fg={theme.error}>
                Disconnected
                <Show when={sdk.connectionError()}>
                  {" "}({sdk.connectionError()})
                </Show>
              </text>
            }
          >
            <text fg={theme.success}>Connected</text>
          </Show>
        </box>
        <box flexDirection="row" gap={1}>
          <text fg={theme.textMuted}>Mode:</text>
          <text fg={sync.data.config.streaming ? theme.success : theme.secondary}>
            {sync.data.config.streaming ? "Streaming (SSE)" : "Non-streaming"}
          </text>
        </box>
      </box>

      <text fg={theme.text} bold>
        Session
      </text>
      <box paddingLeft={2}>
        <box flexDirection="row" gap={1}>
          <text fg={theme.textMuted}>App:</text>
          <Show
            when={currentApp()}
            fallback={<text fg={theme.warning}>None selected</text>}
          >
            <text fg={theme.primary}>{currentApp()}</text>
          </Show>
        </box>
        <box flexDirection="row" gap={1}>
          <text fg={theme.textMuted}>Active:</text>
          <Show
            when={currentSessionId()}
            fallback={<text fg={theme.textMuted}>None</text>}
          >
            <text fg={theme.text}>{currentSessionId()!.slice(0, 8)}</text>
          </Show>
        </box>
        <box flexDirection="row" gap={1}>
          <text fg={theme.textMuted}>Total:</text>
          <text fg={theme.text}>{sessionCount()}</text>
        </box>
      </box>

      <text fg={theme.text} bold>
        User
      </text>
      <box paddingLeft={2}>
        <box flexDirection="row" gap={1}>
          <text fg={theme.textMuted}>ID:</text>
          <text fg={theme.text}>{sync.data.userId}</text>
        </box>
      </box>
    </box>
  );
}
