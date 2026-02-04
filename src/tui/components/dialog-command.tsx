import { createMemo } from "solid-js";
import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select";
import { useDialog } from "../ui/dialog";
import { useTheme, DEFAULT_THEMES } from "../context/theme";
import { DialogConnect } from "./dialog-connect";
import { DialogApp } from "./dialog-app";
import { DialogSessionList } from "./dialog-session-list";

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
  action: () => void;
}

export interface DialogCommandProps {
  commands: Command[];
  onSelect?: (command: Command) => void;
}

export function DialogCommand(props: DialogCommandProps) {
  const dialog = useDialog();
  const themeCtx = useTheme();

  const builtInCommands: Command[] = [
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
      },
    },
    {
      id: "session:new",
      title: "/new",
      category: "Session",
      description: "Start new session",
      action: () => {
        log("Executing /new action");
        dialog.replace(() => <DialogApp />);
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
      },
    },
    {
      id: "quit",
      title: "/quit",
      category: "Application",
      description: "Exit ADK TUI",
      action: () => {
        log("Executing /quit action");
        process.exit(0);
      },
    },
  ];

  const allCommands = createMemo(() => [...builtInCommands, ...props.commands]);

  const options = createMemo<DialogSelectOption<Command>[]>(() =>
    allCommands().map((cmd) => ({
      title: cmd.title,
      value: cmd,
      category: cmd.category,
      description: cmd.description,
      onSelect: (ctx, trigger) => {
        log(`Command selected: ${cmd.title} (id: ${cmd.id}) via ${trigger}`);
        props.onSelect?.(cmd);
        log(`Calling action for ${cmd.title}`);
        cmd.action();
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

function ThemePicker() {
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
