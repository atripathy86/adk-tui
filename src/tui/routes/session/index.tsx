import { Show, For, createMemo, createEffect } from "solid-js";
import { useTheme } from "../../context/theme";
import { useKeybind } from "../../context/keybind";
import { useSync, useSyncActions } from "../../context/sync";
import { useSession } from "../../context/session";
import { useRoute } from "../../context/route";
import { useToast } from "../../ui/toast";
import { useKeyboard } from "@opentui/solid";
import { Clipboard } from "../../util/clipboard";
import { Prompt, PromptHistoryProvider } from "../../components/prompt";
import { Message } from "./message";
import { useBuiltInCommands } from "../../components/dialog-command";
import type { Event } from "../../../sdk/types";

interface SessionViewProps {
  sessionId: string;
}

function Header(props: { sessionId: string }) {
  const { theme } = useTheme();
  const keybind = useKeybind();
  const sync = useSync();
  const route = useRoute();

  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
      paddingBottom={1}
      borderColor={theme.border}
      border={["bottom"]}
    >
      <box flexDirection="row" gap={2}>
        <text
          fg={theme.primary}
          onMouseUp={() => route.goHome()}
        >
          ← Back
        </text>
        <text fg={theme.text}>
          Session:{" "}
          <span style={{ fg: theme.textMuted }}>
            {props.sessionId.slice(0, 8)}
          </span>
        </text>
      </box>
      <box flexDirection="row" gap={2}>
        <Show when={sync.data.currentApp}>
          <text fg={theme.textMuted}>
            App:{" "}
            <span style={{ fg: theme.primary }}>{sync.data.currentApp}</span>
          </text>
        </Show>
        <text fg={theme.textMuted}>
          {keybind.print("command_palette")} menu
        </text>
      </box>
    </box>
  );
}

function Timeline(props: { sessionId: string }) {
  const { theme } = useTheme();
  const sync = useSync();
  const syncActions = useSyncActions();

  const messages = createMemo(() => {
    return sync.data.messages[props.sessionId] ?? [];
  });

  const status = createMemo(() => {
    return sync.data.sessionStatus[props.sessionId] ?? { type: "idle" };
  });

  // Streaming event from the dedicated signal (bypasses store array reactivity)
  const streamingEvent = () => {
    const se = syncActions.streamingEvent();
    return se?.sessionId === props.sessionId ? se.event : null;
  };

  return (
    <scrollbox flexGrow={1} paddingLeft={1} paddingRight={1} paddingTop={1} stickyScroll={true} stickyStart="bottom">
      <box flexDirection="column">
        <Show
          when={messages().length > 0 || streamingEvent()}
          fallback={
            <box
              flexGrow={1}
              justifyContent="center"
              alignItems="center"
              paddingTop={2}
            >
              <text fg={theme.textMuted}>
                Start a conversation by typing below
              </text>
            </box>
          }
        >
          <For each={messages()}>
            {(event) => <Message event={event} />}
          </For>

          <Show when={streamingEvent()}>
            <Message event={streamingEvent()!} />
          </Show>
        </Show>

        <Show when={status().type === "busy" && !streamingEvent()}>
          <box flexDirection="row" gap={1} marginTop={1}>
            <text fg={theme.textMuted}>●</text>
            <text fg={theme.textMuted}>Thinking...</text>
          </box>
        </Show>

        <Show when={status().type === "error"}>
          <box
            marginTop={1}
            paddingLeft={1}
            border={["left"]}
            borderColor={theme.error}
          >
            <text fg={theme.error}>
              Error: {status().message ?? "Unknown error"}
            </text>
          </box>
        </Show>
      </box>
    </scrollbox>
  );
}

/** Extract all text from an event's parts */
function extractEventText(event: Event): string {
  if (!event.content?.parts) return "";
  return event.content.parts
    .filter((p) => p.text && !p.thought)
    .map((p) => p.text!)
    .join("\n")
    .trim();
}

/** Format a full session transcript as markdown */
function formatTranscript(messages: Event[], sessionId: string): string {
  const lines: string[] = [];
  lines.push(`# Session ${sessionId.slice(0, 8)}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const msg of messages) {
    const isUser = msg.author === "user";
    lines.push(`## ${isUser ? "User" : msg.author || "Assistant"}`);
    lines.push("");

    if (msg.content?.parts) {
      for (const part of msg.content.parts) {
        if (part.text) {
          lines.push(part.text);
        }
        if (part.functionCall) {
          lines.push(`**Tool Call:** ${part.functionCall.name ?? "function"}`);
          if (part.functionCall.args) {
            lines.push("```json");
            lines.push(JSON.stringify(part.functionCall.args, null, 2));
            lines.push("```");
          }
        }
        if (part.functionResponse) {
          lines.push(`**Tool Response:** ${part.functionResponse.name ?? "response"}`);
        }
      }
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export function SessionView(props: SessionViewProps) {
  const { theme } = useTheme();
  const session = useSession();
  const sync = useSync();
  const keybind = useKeybind();
  const toast = useToast();
  const builtInCommands = useBuiltInCommands();

  const messages = createMemo(() => {
    return sync.data.messages[props.sessionId] ?? [];
  });

  const promptCommands = createMemo(() =>
    builtInCommands.map((cmd) => ({
      label: cmd.title.slice(1),
      value: cmd.title.slice(1),
      description: cmd.description,
      action: cmd.action,
    }))
  );

  const handleSubmit = async (text: string) => {
    await session.sendMessage(text);
  };

  // Copy last assistant message to clipboard
  async function copyLastMessage() {
    const msgs = messages();
    const lastAssistant = [...msgs].reverse().find((m) => m.author !== "user");
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
  }

  // Copy full session transcript to clipboard
  async function copyTranscript() {
    const msgs = messages();
    if (msgs.length === 0) {
      toast.warning("No messages to copy");
      return;
    }
    const transcript = formatTranscript(msgs, props.sessionId);
    try {
      await Clipboard.copy(transcript);
      toast.success("Session transcript copied");
    } catch {
      toast.error("Failed to copy transcript");
    }
  }

  // Keybind handlers for copy
  useKeyboard((evt) => {
    if (keybind.match("messages_copy", evt)) {
      evt.preventDefault();
      copyLastMessage();
      return;
    }
    if (keybind.match("session_copy", evt)) {
      evt.preventDefault();
      copyTranscript();
      return;
    }
  });

  // Load session data on mount
  createEffect(() => {
    session.switch(props.sessionId);
  });

  return (
    <PromptHistoryProvider>
      <box flexDirection="column" flexGrow={1}>
        <Header sessionId={props.sessionId} />

        <Timeline sessionId={props.sessionId} />

        <box
          paddingLeft={1}
          paddingRight={1}
          paddingTop={1}
          paddingBottom={1}
          borderColor={theme.border}
          border={["top"]}
        >
          <Prompt
            sessionID={props.sessionId}
            placeholder="Type a message..."
            onSubmit={handleSubmit}
            commands={promptCommands()}
          />
        </box>
      </box>
    </PromptHistoryProvider>
  );
}
