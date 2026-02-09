import { Show, For, createSignal } from "solid-js";
import { useTheme } from "../../context/theme";
import type { Event, Part, FunctionCall } from "../../../sdk/types";

interface MessageProps {
  event: Event;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ToolCall(props: { call: FunctionCall; allParts: Part[] }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = createSignal(false);

  const hasResponse = () =>
    props.allParts.some(
      (p) => p.functionResponse?.name === props.call.name
    );

  return (
    <box flexDirection="column" marginTop={1}>
      <box
        flexDirection="row"
        gap={1}
        onMouseUp={() => setExpanded(!expanded())}
      >
        <text fg={hasResponse() ? theme.success : theme.warning}>
          {hasResponse() ? "✓" : "▶"} ⚙ {props.call.name ?? "function"}
        </text>
      </box>
      <Show when={expanded() && props.call.args}>
        <box
          marginLeft={2}
          paddingLeft={1}
          border={["left"]}
          borderColor={theme.border}
        >
          <text fg={theme.textMuted}>
            {JSON.stringify(props.call.args, null, 2)}
          </text>
        </box>
      </Show>
    </box>
  );
}

function PartContent(props: { part: Part; allParts: Part[] }) {
  const { theme } = useTheme();

  return (
    <>
      <Show when={props.part.text}>
        <text>{props.part.text}</text>
      </Show>

      <Show when={props.part.functionCall}>
        <ToolCall call={props.part.functionCall!} allParts={props.allParts} />
      </Show>

      <Show when={props.part.functionResponse}>
        <box
          marginTop={1}
          paddingLeft={1}
          border={["left"]}
          borderColor={theme.success}
        >
          <text fg={theme.textMuted}>
            ✓ {props.part.functionResponse?.name ?? "response"}
          </text>
        </box>
      </Show>

      <Show when={props.part.executableCode}>
        <box
          marginTop={1}
          backgroundColor={theme.backgroundPanel}
          paddingLeft={1}
          paddingRight={1}
        >
          <text fg={theme.textMuted}>
            Code: {props.part.executableCode?.language ?? "python"}
          </text>
        </box>
      </Show>

      <Show when={props.part.codeExecutionResult}>
        <box
          marginTop={1}
          paddingLeft={1}
          border={["left"]}
          borderColor={
            props.part.codeExecutionResult?.outcome === "OUTCOME_OK"
              ? theme.success
              : theme.error
          }
        >
          <text>
            {props.part.codeExecutionResult?.output ?? "No output"}
          </text>
        </box>
      </Show>
    </>
  );
}

export function UserMessage(props: MessageProps) {
  const { theme } = useTheme();
  const content = () => props.event.content;

  return (
    <box
      flexDirection="column"
      marginBottom={1}
      paddingLeft={1}
      border={["left"]}
      borderColor={theme.primary}
    >
      <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <text fg={theme.primary} bold>
          You
        </text>
        <text fg={theme.textMuted}>
          {formatTimestamp(props.event.timestamp)}
        </text>
      </box>
      <Show when={content()?.parts}>
        <For each={content()!.parts}>
          {(part) => <PartContent part={part} allParts={content()!.parts!} />}
        </For>
      </Show>
    </box>
  );
}

export function AssistantMessage(props: MessageProps) {
  const { theme } = useTheme();
  const content = () => props.event.content;
  const isPartial = () => props.event.partial;

  return (
    <box flexDirection="column" marginBottom={1}>
      <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <box flexDirection="row" gap={1}>
          <text fg={theme.secondary} bold>
            {props.event.author || "Assistant"}
          </text>
          <Show when={isPartial()}>
            <text fg={theme.textMuted}>●</text>
          </Show>
        </box>
        <text fg={theme.textMuted}>
          {formatTimestamp(props.event.timestamp)}
        </text>
      </box>
      <Show when={content()?.parts}>
        <For each={content()!.parts}>
          {(part) => <PartContent part={part} allParts={content()!.parts!} />}
        </For>
      </Show>
      <Show when={props.event.errorMessage}>
        <box
          marginTop={1}
          paddingLeft={1}
          border={["left"]}
          borderColor={theme.error}
        >
          <text fg={theme.error}>{props.event.errorMessage}</text>
        </box>
      </Show>
    </box>
  );
}

export function Message(props: MessageProps) {
  const isUser = () => props.event.author === "user";

  return (
    <Show when={isUser()} fallback={<AssistantMessage event={props.event} />}>
      <UserMessage event={props.event} />
    </Show>
  );
}
