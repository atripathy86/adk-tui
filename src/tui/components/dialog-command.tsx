import { createMemo } from "solid-js"
import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select"
import { useDialog } from "../ui/dialog"
import { useTheme, DEFAULT_THEMES } from "../context/theme"

export interface Command {
  id: string
  title: string
  category?: string
  description?: string
  action: () => void
}

export interface DialogCommandProps {
  commands: Command[]
  onSelect?: (command: Command) => void
}

export function DialogCommand(props: DialogCommandProps) {
  const dialog = useDialog()
  const themeCtx = useTheme()

  const builtInCommands: Command[] = [
    {
      id: "theme:switch",
      title: "Switch Theme",
      category: "Theme",
      description: "Open theme picker",
      action: () => {
        dialog.replace(<ThemePicker />)
      },
    },
    {
      id: "quit",
      title: "Quit",
      category: "Application",
      description: "Exit ADK TUI",
      action: () => {
        process.exit(0)
      },
    },
  ]

  const allCommands = createMemo(() => [...builtInCommands, ...props.commands])

  const options = createMemo<DialogSelectOption<Command>[]>(() =>
    allCommands().map((cmd) => ({
      title: cmd.title,
      value: cmd,
      category: cmd.category,
      description: cmd.description,
      onSelect: () => {
        dialog.clear()
        cmd.action()
        props.onSelect?.(cmd)
      },
    }))
  )

  return (
    <DialogSelect<Command>
      title="Command Palette"
      placeholder="Type a command..."
      options={options()}
    />
  )
}

function ThemePicker() {
  const dialog = useDialog()
  const themeCtx = useTheme()

  const themeOptions = createMemo<DialogSelectOption<string>[]>(() =>
    Object.keys(DEFAULT_THEMES).map((name) => ({
      title: name,
      value: name,
      category: "Themes",
      onSelect: () => {
        themeCtx.set(name)
        dialog.clear()
      },
    }))
  )

  return (
    <DialogSelect<string>
      title="Select Theme"
      placeholder="Search themes..."
      options={themeOptions()}
      current={themeCtx.selected}
    />
  )
}
