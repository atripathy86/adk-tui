import { useTheme } from "../context/theme";
import { useDialog } from "../ui/dialog";
import { useKeybind } from "../context/keybind";
import { useKeyboard } from "@opentui/solid";

export function DialogHelp() {
  const dialog = useDialog();
  const { theme } = useTheme();
  const keybind = useKeybind();

  useKeyboard((evt) => {
    if (evt.name === "return" || evt.name === "escape") {
      dialog.clear();
    }
  });

  const binds = [
    ["command_palette", "Command palette"],
    ["session_list", "Session list"],
    ["session_new", "New session"],
    ["session_delete", "Delete session"],
    ["messages_copy", "Copy last message"],
    ["session_copy", "Copy transcript"],
  ] as const;

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text bold fg={theme.text}>
          Help
        </text>
        <text fg={theme.textMuted}>esc</text>
      </box>

      <box paddingBottom={1}>
        <text fg={theme.textMuted}>
          Press {keybind.print("command_palette")} to see all available
          commands. Type / in the prompt for slash commands.
        </text>
      </box>

      <text fg={theme.text} bold>
        Keybindings
      </text>
      <box paddingBottom={1}>
        {binds.map(([key, label]) => (
          <box flexDirection="row" gap={2}>
            <text fg={theme.primary}>{keybind.print(key).padEnd(12)}</text>
            <text fg={theme.text}>{label}</text>
          </box>
        ))}
      </box>

      <text fg={theme.text} bold>
        Slash Commands
      </text>
      <box paddingBottom={1}>
        {[
          ["/app", "Select ADK app"],
          ["/sessions", "Switch sessions"],
          ["/new", "New session"],
          ["/delete", "Delete current session"],
          ["/connect", "Connect to server"],
          ["/copy", "Copy last assistant message"],
          ["/copy-all", "Copy full transcript"],
          ["/theme", "Switch theme"],
          ["/status", "Connection status"],
          ["/streaming", "Toggle streaming mode"],
          ["/help", "This help"],
          ["/quit", "Exit"],
        ].map(([cmd, desc]) => (
          <box flexDirection="row" gap={2}>
            <text fg={theme.secondary}>{cmd!.padEnd(12)}</text>
            <text fg={theme.text}>{desc}</text>
          </box>
        ))}
      </box>
    </box>
  );
}
