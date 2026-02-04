import { Show, createMemo } from "solid-js";
import { Logo } from "../components/logo";
import { Prompt, PromptHistoryProvider } from "../components/prompt";
import { useTheme } from "../context/theme";
import { useKeybind } from "../context/keybind";
import { useSync } from "../context/sync";
import { useSession } from "../context/session";
import { useRoute } from "../context/route";
import { useDialog } from "../ui/dialog";
import { DialogApp } from "../components/dialog-app";
import { useBuiltInCommands } from "../components/dialog-command";

export function Home() {
  const { theme } = useTheme();
  const keybind = useKeybind();
  const sync = useSync();
  const session = useSession();
  const route = useRoute();
  const dialog = useDialog();
  const builtInCommands = useBuiltInCommands();

  const promptCommands = createMemo(() =>
    builtInCommands.map((cmd) => ({
      label: cmd.title.slice(1),
      value: cmd.title.slice(1),
      description: cmd.description,
      action: cmd.action,
    }))
  );

  const handleSubmit = async (text: string) => {
    // If no app selected, prompt to select one
    if (!sync.data.currentApp) {
      dialog.replace(() => <DialogApp />);
      return;
    }

    // Send message (will create session if needed)
    await session.sendMessage(text);

    // Navigate to session view
    const currentSession = session.current();
    if (currentSession) {
      route.goToSession(currentSession.id);
    }
  };

  return (
    <PromptHistoryProvider>
      <box
        flexDirection="column"
        flexGrow={1}
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        <Logo />

        <box
          flexDirection="column"
          width="100%"
          maxWidth={80}
          paddingLeft={4}
          paddingRight={4}
        >
          <Show when={sync.data.currentApp}>
            <text fg={theme.textMuted} marginBottom={1}>
              App:{" "}
              <span style={{ fg: theme.primary }}>{sync.data.currentApp}</span>
            </text>
          </Show>

          <Prompt
            placeholder={
              sync.data.currentApp
                ? "Ask anything..."
                : "Select an app first (press Enter)"
            }
            onSubmit={handleSubmit}
            commands={promptCommands()}
          />
        </box>

        <box flexDirection="column" gap={1} alignItems="center">
          <Show when={!sync.data.currentApp}>
            <text fg={theme.warning}>No app selected</text>
          </Show>

          <box flexDirection="row" gap={2}>
            <text fg={theme.textMuted}>
              <span style={{ fg: theme.text }}>
                {keybind.print("command_palette")}
              </span>{" "}
              commands
            </text>
            <text fg={theme.textMuted}>
              <span style={{ fg: theme.text }}>
                {keybind.print("session_list")}
              </span>{" "}
              sessions
            </text>
            <text fg={theme.textMuted}>
              <span style={{ fg: theme.text }}>
                {keybind.print("theme_list")}
              </span>{" "}
              themes
            </text>
          </box>
        </box>
      </box>
    </PromptHistoryProvider>
  );
}
