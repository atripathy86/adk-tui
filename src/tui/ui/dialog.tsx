import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid"
import { batch, createContext, createMemo, Show, useContext, type JSX, type ParentProps } from "solid-js"
import { useTheme } from "../context/theme"
import { Renderable, RGBA } from "@opentui/core"
import { createStore } from "solid-js/store"

const DEBUG = process.env.ADK_TUI_DEBUG === "1";
function log(msg: string) {
  if (!DEBUG) return;
  const { appendFileSync } = require("fs");
  const line = `[Dialog] ${msg}\n`;
  appendFileSync("/tmp/adk-tui-debug.log", line);
}

export function Dialog(
  props: ParentProps<{
    size?: "medium" | "large"
    onClose: () => void
  }>,
) {
  const dimensions = useTerminalDimensions()
  const { theme } = useTheme()

  return (
    <box
      onMouseUp={async () => {
        props.onClose?.()
      }}
      width={dimensions().width}
      height={dimensions().height}
      alignItems="center"
      position="absolute"
      paddingTop={dimensions().height / 4}
      left={0}
      top={0}
      backgroundColor={RGBA.fromInts(0, 0, 0, 150)}
    >
      <box
        onMouseUp={async (e) => {
          e.stopPropagation()
        }}
        width={props.size === "large" ? 80 : 60}
        maxWidth={dimensions().width - 2}
        backgroundColor={theme.backgroundPanel}
        paddingTop={1}
      >
        {props.children}
      </box>
    </box>
  )
}

// Factory function type - returns JSX when called (deferred evaluation)
export type DialogFactory = () => JSX.Element

function init() {
  const [store, setStore] = createStore({
    stack: [] as {
      factory: DialogFactory
      onClose?: () => void
    }[],
    size: "medium" as "medium" | "large",
  })

  useKeyboard((evt) => {
    if (evt.name === "escape" && store.stack.length > 0) {
      const current = store.stack.at(-1)!
      current.onClose?.()
      setStore("stack", store.stack.slice(0, -1))
      evt.preventDefault()
      evt.stopPropagation()
      refocus()
    }
  })

  const renderer = useRenderer()
  let focus: Renderable | null
  function refocus() {
    setTimeout(() => {
      if (!focus) return
      if (focus.isDestroyed) return
      function find(item: Renderable) {
        for (const child of item.getChildren()) {
          if (child === focus) return true
          if (find(child)) return true
        }
        return false
      }
      const found = find(renderer.root)
      if (!found) return
      focus.focus()
    }, 1)
  }

  return {
    clear() {
      log(`dialog.clear() called, stack length before: ${store.stack.length}`);
      for (const item of store.stack) {
        if (item.onClose) item.onClose()
      }
      batch(() => {
        setStore("size", "medium")
        setStore("stack", [])
      })
      log(`dialog.clear() complete, stack length after: ${store.stack.length}`);
      refocus()
    },
    replace(factory: DialogFactory, onClose?: () => void) {
      log(`dialog.replace() called, current stack length: ${store.stack.length}`);
      if (store.stack.length === 0) {
        focus = renderer.currentFocusedRenderable
        focus?.blur()
      }
      for (const item of store.stack) {
        if (item.onClose) item.onClose()
      }
      batch(() => {
        setStore("size", "medium")
        setStore("stack", [
          {
            factory,
            onClose,
          },
        ])
      })
      log(`dialog.replace() complete, new stack length: ${store.stack.length}`);
    },
    get stack() {
      return store.stack
    },
    get size() {
      return store.size
    },
    setSize(size: "medium" | "large") {
      setStore("size", size)
    },
  }
}

export type DialogContext = ReturnType<typeof init>

const ctx = createContext<DialogContext>()

export function DialogProvider(props: ParentProps) {
  const value = init()
  const hasDialog = createMemo(() => value.stack.length > 0)
  
  return (
    <ctx.Provider value={value}>
      {props.children}
      <box position="absolute">
        <Show when={hasDialog()}>
          <Dialog onClose={() => value.clear()} size={value.size}>
            <DialogContent stack={value.stack} />
          </Dialog>
        </Show>
      </box>
    </ctx.Provider>
  )
}

function DialogContent(props: { stack: { factory: DialogFactory; onClose?: () => void }[] }) {
  const top = createMemo(() => props.stack.at(-1))
  
  return (
    <>
      {top()?.factory()}
    </>
  )
}

export function useDialog() {
  const value = useContext(ctx)
  if (!value) {
    throw new Error("useDialog must be used within a DialogProvider")
  }
  return value
}
