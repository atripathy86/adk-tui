import { TextAttributes } from "@opentui/core"
import { For } from "solid-js"
import { useTheme } from "../context/theme"

// ASCII Art for "ADK"
const LOGO_LINES = [
  "   _    ____  _  __",
  "  / \\  |  _ \\| |/ /",
  " / _ \\ | | | | ' / ",
  "/ ___ \\| |_| | . \\ ",
  "/_/   \\_\\____/|_|\\_\\"
]

export function Logo() {
  const { theme } = useTheme()
  return (
    <box flexDirection="column">
      <For each={LOGO_LINES}>
        {(line) => (
          <text fg={theme.primary} attributes={TextAttributes.BOLD} selectable={false}>
            {line}
          </text>
        )}
      </For>
    </box>
  )
}
