import { Show, For, createMemo, createEffect } from "solid-js";
import { useTheme } from "../../context/theme";
import { useKeybind } from "../../context/keybind";
import { useSync } from "../../context/sync";
import { useSession } from "../../context/session";
import { useRoute } from "../../context/route";
import { Prompt, PromptHistoryProvider } from "../../components/prompt";
import { Message } from "./message";

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

  const messages = createMemo(() => {
    return sync.data.messages[props.sessionId] ?? [];
  });

  const status = createMemo(() => {
    return sync.data.sessionStatus[props.sessionId] ?? { type: "idle" };
  });

  return (
    <scrollbox flexGrow={1} paddingLeft={1} paddingRight={1} paddingTop={1}>
      <box flexDirection="column">
        <Show
          when={messages().length > 0}
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
        </Show>

        <Show when={status().type === "busy"}>
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

export function SessionView(props: SessionViewProps) {
  const { theme } = useTheme();
  const session = useSession();

  const handleSubmit = async (text: string) => {
    await session.sendMessage(text);
  };

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
          />
        </box>
      </box>
    </PromptHistoryProvider>
  );
}
