import { createMemo } from "solid-js"
import { useSync, type KeybindsConfig } from "./sync"
import { Keybind } from "../../util/keybind"
import { pipe, mapValues } from "remeda"
import type { ParsedKey, Renderable } from "@opentui/core"
import { createStore } from "solid-js/store"
import { useKeyboard, useRenderer } from "@opentui/solid"
import { createSimpleContext } from "./helper"

export const { use: useKeybind, provider: KeybindProvider } = createSimpleContext({
  name: "Keybind",
  init: () => {
    const sync = useSync()
    const keybinds = createMemo(() => {
      return pipe(
        sync.data.config.keybinds ?? {},
        mapValues((value) => value ? Keybind.parse(value) : []),
      )
    })
    const [store, setStore] = createStore({
      leader: false,
    })
    const renderer = useRenderer()

    let focus: Renderable | null
    let timeout: NodeJS.Timeout
    function leader(active: boolean) {
      if (active) {
        setStore("leader", true)
        focus = renderer.currentFocusedRenderable
        focus?.blur()
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          if (!store.leader) return
          leader(false)
          if (focus) {
            focus.focus()
          }
        }, 2000)
        return
      }

      if (!active) {
        if (focus && !renderer.currentFocusedRenderable) {
          focus.focus()
        }
        setStore("leader", false)
      }
    }

    useKeyboard(async (evt) => {
      if (!store.leader && result.match("leader", evt)) {
        leader(true)
        return
      }

      if (store.leader && evt.name) {
        setImmediate(() => {
          if (focus && renderer.currentFocusedRenderable === focus) {
            focus.focus()
          }
          leader(false)
        })
      }
    })

    const result = {
      get all() {
        return keybinds()
      },
      get leader() {
        return store.leader
      },
      parse(evt: ParsedKey): Keybind.Info {
        if (evt.name === "\x1F") {
          return Keybind.fromParsedKey({ ...evt, name: "_", ctrl: true }, store.leader)
        }
        return Keybind.fromParsedKey(evt, store.leader)
      },
      match(key: keyof KeybindsConfig, evt: ParsedKey) {
        const keybind = keybinds()[key]
        if (!keybind) return false
        const parsed: Keybind.Info = result.parse(evt)
        for (const k of keybind) {
          if (Keybind.match(k, parsed)) {
            return true
          }
        }
        return false
      },
      print(key: keyof KeybindsConfig) {
        const first = keybinds()[key]?.at(0)
        if (!first) return ""
        const printResult = Keybind.toString(first)
        const leaderKeys = keybinds().leader
        if (leaderKeys && leaderKeys[0]) {
          return printResult.replace("<leader>", Keybind.toString(leaderKeys[0]))
        }
        return printResult
      },
    }
    return result
  },
})
