import { createContext, useContext, type ParentProps } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { useKeybind } from "./keybind"
import { useDialog } from "../ui/dialog"
import { DialogCommand, type Command } from "../components/dialog-command"

// const logFile = "/tmp/adk-tui-debug.log"
// function log(msg: string) {
//   appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`)
// }

interface CommandContextValue {
  open: () => void
  commands: Command[]
}

const CommandContext = createContext<CommandContextValue>()

export function CommandProvider(props: ParentProps<{ additionalCommands?: Command[] }>) {
  const keybind = useKeybind()
  const dialog = useDialog()

  const commands: Command[] = props.additionalCommands ?? []

  function openCommandPalette() {
    dialog.replace(() => <DialogCommand commands={commands} />)
  }

  useKeyboard((evt) => {
    if (keybind.match("command_palette", evt)) {
      evt.preventDefault()
      openCommandPalette()
      return
    }

    if (keybind.match("theme_list", evt)) {
      evt.preventDefault()
      dialog.replace(() => <DialogCommand commands={commands} />)
      return
    }

    if (keybind.match("quit", evt)) {
      process.exit(0)
    }
  })

  const value: CommandContextValue = {
    open: openCommandPalette,
    commands,
  }

  return (
    <CommandContext.Provider value={value}>
      {props.children}
    </CommandContext.Provider>
  )
}

export function useCommand() {
  const ctx = useContext(CommandContext)
  if (!ctx) throw new Error("useCommand must be used within CommandProvider")
  return ctx
}
