import { createContext, useContext, type ParentProps } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { useKeybind } from "./keybind"
import { useDialog } from "../ui/dialog"
import { DialogCommand, type Command } from "../components/dialog-command"

const DEBUG = process.env.ADK_TUI_DEBUG === "1";
function log(msg: string) {
  if (!DEBUG) return;
  const { appendFileSync } = require("fs");
  const line = `[Command] ${msg}\n`;
  appendFileSync("/tmp/adk-tui-debug.log", line);
}

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
    log("openCommandPalette() called");
    dialog.replace(() => <DialogCommand commands={commands} />)
  }

  useKeyboard((evt) => {
    if (keybind.match("command_palette", evt)) {
      log("command_palette keybind matched");
      evt.preventDefault()
      openCommandPalette()
      return
    }

    if (keybind.match("theme_list", evt)) {
      log("theme_list keybind matched");
      evt.preventDefault()
      dialog.replace(() => <DialogCommand commands={commands} />)
      return
    }

    if (keybind.match("quit", evt)) {
      log("quit keybind matched");
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
