import { createMemo } from "solid-js";
import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select";
import { useDialog } from "../ui/dialog";
import { useToast } from "../ui/toast";
import { useTheme, DEFAULT_THEMES } from "../context/theme";
import { DialogConnect } from "./dialog-connect";
import { DialogApp } from "./dialog-app";
import { DialogSessionList } from "./dialog-session-list";
import { DialogHelp } from "./dialog-help";
import { DialogStatus } from "./dialog-status";
import { useSync, useSyncActions } from "../context/sync";
import { useSession } from "../context/session";
import { useRoute } from "../context/route";
import { Clipboard } from "../util/clipboard";
import type { Event } from "../../sdk/types";

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
/** Extract all text from an event's parts */
function extractEventText(event: Event): string {
  if (!event.content?.parts) return "";
  return event.content.parts
    .filter((p) => p.text && !p.thought)
    .map((p) => p.text!)
    .join("\n")
    .trim();
}

export function useBuiltInCommands() {
  const dialog = useDialog();
  const sync = useSync();
  const syncActions = useSyncActions();
  const session = useSession();
  const route = useRoute();
  const toast = useToast();

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
      id: "copy:last",
      title: "/copy",
      category: "Clipboard",
      description: "Copy last assistant message",
      action: async () => {
        log("Executing /copy action");
        dialog.clear();
        const sessionId = sync.data.currentSessionId;
        if (!sessionId) {
          toast.warning("No active session");
          return;
        }
        const messages = sync.data.messages[sessionId] ?? [];
        const lastAssistant = [...messages].reverse().find((m) => m.author !== "user");
        if (!lastAssistant) {
          toast.warning("No assistant message to copy");
          return;
        }
        const text = extractEventText(lastAssistant);
        if (!text) {
          toast.warning("No text content to copy");
          return;
        }
        try {
          await Clipboard.copy(text);
          toast.success("Copied to clipboard");
        } catch {
          toast.error("Failed to copy to clipboard");
        }
      },
    },
    {
      id: "copy:transcript",
      title: "/copy-all",
      category: "Clipboard",
      description: "Copy full session transcript",
      action: async () => {
        log("Executing /copy-all action");
        dialog.clear();
        const sessionId = sync.data.currentSessionId;
        if (!sessionId) {
          toast.warning("No active session");
          return;
        }
        const messages = sync.data.messages[sessionId] ?? [];
        if (messages.length === 0) {
          toast.warning("No messages to copy");
          return;
        }
        const lines: string[] = [];
        lines.push(`# Session ${sessionId.slice(0, 8)}`);
        lines.push("", "---", "");
        for (const msg of messages) {
          const isUser = msg.author === "user";
          lines.push(`## ${isUser ? "User" : msg.author || "Assistant"}`, "");
          if (msg.content?.parts) {
            for (const part of msg.content.parts) {
              if (part.text) lines.push(part.text);
              if (part.functionCall) {
                lines.push(`**Tool Call:** ${part.functionCall.name ?? "function"}`);
                if (part.functionCall.args) {
                  lines.push("```json", JSON.stringify(part.functionCall.args, null, 2), "```");
                }
              }
              if (part.functionResponse) {
                lines.push(`**Tool Response:** ${part.functionResponse.name ?? "response"}`);
              }
            }
          }
          lines.push("", "---", "");
        }
        try {
          await Clipboard.copy(lines.join("\n"));
          toast.success("Session transcript copied");
        } catch {
          toast.error("Failed to copy transcript");
        }
      },
    },
    {
      id: "session:delete",
      title: "/delete",
      category: "Session",
      description: "Delete current session",
      action: async () => {
        log("Executing /delete action");
        dialog.clear();
        const sessionId = sync.data.currentSessionId;
        if (!sessionId) {
          toast.warning("No active session");
          return;
        }
        try {
          await session.delete(sessionId);
          toast.success("Session deleted");
          route.goHome();
        } catch {
          toast.error("Failed to delete session");
        }
      },
    },
    {
      id: "status",
      title: "/status",
      category: "Application",
      description: "View connection status",
      action: () => {
        log("Executing /status action");
        dialog.replace(() => <DialogStatus />);
      },
    },
    {
      id: "streaming:toggle",
      title: "/streaming",
      category: "Application",
      description: `Toggle streaming mode (currently ${sync.data.config.streaming ? "ON" : "OFF"})`,
      action: () => {
        log("Executing /streaming action");
        dialog.clear();
        const current = sync.data.config.streaming;
        syncActions.setStreaming(!current);
        toast.info(`Streaming ${!current ? "enabled" : "disabled"}`);
      },
    },
    {
      id: "help",
      title: "/help",
      category: "Application",
      description: "Show help and keybindings",
      action: () => {
        log("Executing /help action");
        dialog.replace(() => <DialogHelp />);
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
