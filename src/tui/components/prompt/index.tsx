import type { TextareaRenderable, ParsedKey } from "@opentui/core";
import { createSignal, Show } from "solid-js";
import { useTheme } from "../../context/theme";
import { useKeybind } from "../../context/keybind";
import { usePromptHistory, type PromptInfo } from "./history";
import { Autocomplete, type AutocompleteRef, type AutocompleteOption } from "./autocomplete";

export type PromptProps = {
  sessionID?: string;
  disabled?: boolean;
  placeholder?: string;
  onSubmit?: (text: string) => void;
  ref?: (ref: PromptRef) => void;
  commands?: AutocompleteOption[];
};

export type PromptRef = {
  focused: boolean;
  value: string;
  focus(): void;
  blur(): void;
  clear(): void;
  submit(): void;
};

const DEFAULT_PLACEHOLDER = "Ask anything...";

export function Prompt(props: PromptProps) {
  let input: TextareaRenderable;
  let autocomplete: AutocompleteRef;

  const keybind = useKeybind();
  const { theme } = useTheme();
  const history = usePromptHistory();

  const [value, setValue] = createSignal("");
  const [isFocused, setIsFocused] = createSignal(false);

  const defaultCommands: AutocompleteOption[] = [
    { label: "help", value: "help", description: "Show available commands" },
    { label: "clear", value: "clear", description: "Clear the conversation" },
    { label: "session", value: "session", description: "Session management" },
  ];

  const commands = () => props.commands ?? defaultCommands;

  function submit() {
    if (props.disabled) return;
    if (autocomplete?.visible) return;

    const text = value().trim();
    if (!text) return;

    history.append({ input: text });
    props.onSubmit?.(text);
    setValue("");
    input?.clear();
  }

  function handleKeyDown(e: ParsedKey) {
    if (props.disabled) {
      e.preventDefault?.();
      return;
    }

    // Let autocomplete handle keys first
    if (autocomplete?.visible) {
      autocomplete.onKeyDown(e);
      if (e.name === "return" || e.name === "tab" || e.name === "escape") {
        return;
      }
    }

    // Submit on Enter (without shift)
    if (e.name === "return" && !e.shift) {
      e.preventDefault?.();
      submit();
      return;
    }

    // History navigation (only when at start/end of input)
    if (keybind.match("history_previous", e) || e.name === "up") {
      if (input?.cursorOffset === 0 || !value()) {
        const item = history.move(-1, value());
        if (item) {
          setValue(item.input);
          input?.setText(item.input);
          input.cursorOffset = 0;
          e.preventDefault?.();
          return;
        }
      }
    }

    if (keybind.match("history_next", e) || e.name === "down") {
      if (input?.cursorOffset === value().length || !value()) {
        const item = history.move(1, value());
        if (item) {
          setValue(item.input);
          input?.setText(item.input);
          input.cursorOffset = item.input.length;
          e.preventDefault?.();
          return;
        }
      }
    }
  }

  const ref: PromptRef = {
    get focused() {
      return isFocused();
    },
    get value() {
      return value();
    },
    focus() {
      input?.focus();
    },
    blur() {
      input?.blur();
    },
    clear() {
      setValue("");
      input?.clear();
    },
    submit() {
      submit();
    },
  };

  props.ref?.(ref);

  const borderColor = () => {
    if (keybind.leader) return theme.border;
    if (props.disabled) return theme.textMuted;
    return theme.primary;
  };

  return (
    <box flexDirection="column" width="100%">
      <Autocomplete
        options={commands()}
        onSelect={(option) => {
          setValue(`/${option.value} `);
          input?.setText(`/${option.value} `);
          input?.gotoBufferEnd();
        }}
        ref={(r) => (autocomplete = r)}
      />
      <box
        border={["left"]}
        borderColor={borderColor()}
        customBorderChars={{
          vertical: "┃",
          bottomLeft: "╹",
          topLeft: " ",
          horizontalUp: " ",
          horizontalDown: " ",
          cross: " ",
          verticalLeft: " ",
          verticalRight: " ",
          horizontal: " ",
          topRight: " ",
          bottomRight: " ",
          topT: " ",
          bottomT: " ",
          leftT: " ",
          rightT: " ",
        }}
      >
        <box
          paddingLeft={2}
          paddingRight={2}
          paddingTop={1}
          paddingBottom={1}
          backgroundColor={theme.backgroundPanel}
          flexGrow={1}
        >
          <textarea
            placeholder={props.placeholder ?? DEFAULT_PLACEHOLDER}
            textColor={keybind.leader ? theme.textMuted : theme.text}
            focusedTextColor={keybind.leader ? theme.textMuted : theme.text}
            minHeight={1}
            maxHeight={6}
            onContentChange={() => {
              const text = input?.plainText ?? "";
              setValue(text);
              autocomplete?.onInput(text);
            }}
            onKeyDown={handleKeyDown}
            onSubmit={submit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            ref={(r: TextareaRenderable) => {
              input = r;
              setTimeout(() => {
                if (!input || input.isDestroyed) return;
                input.cursorColor = theme.text;
                input.focus();
              }, 10);
            }}
            focusedBackgroundColor={theme.backgroundPanel}
            cursorColor={theme.text}
          />
        </box>
      </box>
      <Show when={!props.disabled}>
        <box
          flexDirection="row"
          justifyContent="space-between"
          paddingLeft={1}
          paddingTop={1}
        >
          <text fg={theme.textMuted}>
            <Show when={props.sessionID}>
              <span style={{ fg: theme.primary }}>ADK</span>
            </Show>
            <Show when={!props.sessionID}>
              Press <span style={{ fg: theme.text }}>Enter</span> to submit
            </Show>
          </text>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.text }}>/</span> commands
          </text>
        </box>
      </Show>
    </box>
  );
}

export { PromptHistoryProvider, usePromptHistory } from "./history";
export type { PromptInfo } from "./history";
