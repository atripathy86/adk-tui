import { createSignal, createMemo, For, Show } from "solid-js";
import { useTheme } from "../../context/theme";
import type { ParsedKey, ScrollBoxRenderable } from "@opentui/core";

export interface AutocompleteOption {
  label: string;
  value: string;
  description?: string;
  action?: () => void | Promise<void>;
}

export interface AutocompleteRef {
  visible: boolean;
  onInput: (value: string) => void;
  onKeyDown: (e: ParsedKey) => void;
  close: () => void;
}

export interface AutocompleteProps {
  options: AutocompleteOption[];
  onSelect: (option: AutocompleteOption) => void;
  ref?: (ref: AutocompleteRef) => void;
}

export function Autocomplete(props: AutocompleteProps) {
  const { theme } = useTheme();
  let scroll: ScrollBoxRenderable | undefined;
  const [visible, setVisible] = createSignal(false);
  const [filter, setFilter] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const filteredOptions = createMemo(() => {
    const query = filter().toLowerCase();
    if (!query.startsWith("/")) return [];

    const search = query.slice(1);
    return props.options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(search) ||
        opt.value.toLowerCase().includes(search)
    );
  });

  function scrollToSelected() {
    if (!scroll) return;
    const idx = selectedIndex();
    const children = scroll.getChildren();
    const target = children[idx];
    if (!target) return;
    const y = target.y - scroll.y;
    if (y >= scroll.height) {
      scroll.scrollBy(y - scroll.height + 1);
    }
    if (y < 0) {
      scroll.scrollBy(y);
      if (idx === 0) scroll.scrollTo(0);
    }
  }

  const ref: AutocompleteRef = {
    get visible() {
      return visible();
    },

    onInput(value: string) {
      if (value.startsWith("/") && value.length > 0) {
        setFilter(value.split(" ")[0] || "");
        setVisible(filteredOptions().length > 0);
        setSelectedIndex(0);
        scroll?.scrollTo(0);
      } else {
        setVisible(false);
        setFilter("");
      }
    },

    onKeyDown(e: ParsedKey) {
      if (!visible()) return;

      const options = filteredOptions();
      if (!options.length) return;

      if (e.name === "up" || (e.ctrl && e.name === "p")) {
        e.preventDefault?.();
        setSelectedIndex((i) => (i > 0 ? i - 1 : options.length - 1));
        scrollToSelected();
      } else if (e.name === "down" || (e.ctrl && e.name === "n")) {
        e.preventDefault?.();
        setSelectedIndex((i) => (i < options.length - 1 ? i + 1 : 0));
        scrollToSelected();
      } else if (e.name === "return" || e.name === "tab") {
        e.preventDefault?.();
        const selected = options[selectedIndex()];
        if (selected) {
          if (selected.action) {
            selected.action();
          }
          props.onSelect(selected);
          setVisible(false);
          setFilter("");
        }
      } else if (e.name === "escape") {
        e.preventDefault?.();
        setVisible(false);
        setFilter("");
      }
    },

    close() {
      setVisible(false);
      setFilter("");
    },
  };

  props.ref?.(ref);

  return (
    <Show when={visible() && filteredOptions().length > 0}>
      <scrollbox
        flexDirection="column"
        border={["top", "left", "right", "bottom"]}
        borderColor={theme.border}
        backgroundColor={theme.backgroundPanel}
        marginBottom={1}
        scrollbarOptions={{ visible: false }}
        ref={(r: ScrollBoxRenderable) => (scroll = r)}
      >
        <For each={filteredOptions()}>
          {(option, index) => (
            <box
              paddingLeft={1}
              paddingRight={1}
              backgroundColor={
                index() === selectedIndex()
                  ? theme.primary
                  : theme.backgroundPanel
              }
            >
              <text
                fg={
                  index() === selectedIndex()
                    ? theme.selectedListItemText
                    : theme.text
                }
              >
                /{option.label}
                <Show when={option.description}>
                  <span style={{ fg: theme.textMuted }}>
                    {" "}
                    - {option.description}
                  </span>
                </Show>
              </text>
            </box>
          )}
        </For>
      </scrollbox>
    </Show>
  );
}
