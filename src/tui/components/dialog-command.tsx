import { createMemo } from "solid-js";
import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select";
import { useDialog } from "../ui/dialog";
import { useTheme, DEFAULT_THEMES } from "../context/theme";
import { DialogConnect } from "./dialog-connect";
import { DialogApp } from "./dialog-app";
import { DialogSessionList } from "./dialog-session-list";
import { useSync } from "../context/sync";
import { useSession } from "../context/session";
import { useRoute } from "../context/route";

const DEBUG = process.env.ADK_TUI_DEBUG === "1";
function log(msg: string) {
  if (!DEBUG) return;
  const { appendFileSync } = require("fs");
  const line = `[DialogCommand] ${msg}\n`;
  appendFileSync("/tmp/adk-tui-debug.log", line);
}

export interface Command {
  id: string;
  title: string;
  category?: string;
  description?: string;
  action: () => void | Promise<void>;
}

export interface DialogCommandProps {
  commands: Command[];
  onSelect?: (command: Command) => void;
}

// Shared commands list for both command palette and prompt autocomplete
export function useBuiltInCommands() {
  const dialog = useDialog();
  const sync = useSync();
  const session = useSession();
  const route = useRoute();

  return [
    {
      id: "app:select",
      title: "/app",
      category: "App",
      description: "Select ADK app",
      action: () => {
        log("Executing /app action");
        dialog.replace(() => <DialogApp />);
        log("/app action complete");
      },
    },
    {
      id: "session:list",
      title: "/sessions",
      category: "Session",
      description: "View sessions",
      action: () => {
        log("Executing /sessions action");
        dialog.replace(() => <DialogSessionList />);
        log("/sessions action complete");
      },
    },
    {
      id: "session:new",
      title: "/new",
      category: "Session",
      description: "Start new session",
      action: async () => {
        log("Executing /new action");
        
        // If no app selected, show app selector
        if (!sync.data.currentApp) {
          log("/new: no app selected, showing app selector");
          dialog.replace(() => <DialogApp />);
          return;
        }
        
        // Create new session
        log("/new: creating new session");
        dialog.clear();
        const newSession = await session.create();
        if (newSession) {
          log(`/new: session created ${newSession.id}, navigating`);
          route.goToSession(newSession.id);
        } else {
          log("/new: session creation failed");
        }
      },
    },
    {
      id: "server:connect",
      title: "/connect",
      category: "Server",
      description: "Connect to ADK server",
      action: () => {
        log("Executing /connect action");
        dialog.replace(() => <DialogConnect />);
        log("/connect action complete");
      },
    },
    {
      id: "theme:switch",
      title: "/theme",
      category: "Theme",
      description: "Switch theme",
      action: () => {
        log("Executing /theme action");
        dialog.replace(() => <ThemePicker />);
        log("/theme action complete");
      },
    },
    {
      id: "quit",
      title: "/quit",
      category: "Application",
      description: "Exit ADK TUI",
      action: () => {
        log("Executing /quit action");
        log("Exiting process...");
        process.exit(0);
      },
    },
  ] as Command[];
}

export function DialogCommand(props: DialogCommandProps) {
  const dialog = useDialog();
  const themeCtx = useTheme();

  const builtInCommands = useBuiltInCommands();

  const allCommands = createMemo(() => [...builtInCommands, ...props.commands]);

  const options = createMemo<DialogSelectOption<Command>[]>(() =>
    allCommands().map((cmd) => ({
      title: cmd.title,
      value: cmd,
      category: cmd.category,
      description: cmd.description,
      onSelect: async (ctx, trigger) => {
        log(`Command selected: ${cmd.title} (id: ${cmd.id}) via ${trigger}`);
        props.onSelect?.(cmd);
        log(`Calling action for ${cmd.title}`);
        await cmd.action();
        log(`Action completed for ${cmd.title}`);
      },
    }))
  );

  return (
    <DialogSelect<Command>
      title="Command Palette"
      placeholder="Search commands (e.g., /connect, /app, /theme)"
      options={options()}
    />
  );
}

export function ThemePicker() {
  const dialog = useDialog();
  const themeCtx = useTheme();

  const themeOptions = createMemo<DialogSelectOption<string>[]>(() =>
    Object.keys(DEFAULT_THEMES).map((name) => ({
      title: name,
      value: name,
      category: "Themes",
      onSelect: () => {
        themeCtx.set(name);
        dialog.clear();
      },
    }))
  );

  return (
    <DialogSelect<string>
      title="Select Theme"
      placeholder="Search themes..."
      options={themeOptions()}
      current={themeCtx.selected}
    />
  );
}
