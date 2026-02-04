import { createSignal, Show } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { TextAttributes } from "@opentui/core"
import { useDialog } from "../ui/dialog"
import { useTheme } from "../context/theme"
import { useSDK } from "../context/sdk"
import { DialogApp } from "./dialog-app"

const DEBUG = process.env.ADK_TUI_DEBUG === "1";
function log(msg: string) {
  if (!DEBUG) return;
  const { appendFileSync } = require("fs");
  const line = `[DialogConnect] ${msg}\n`;
  appendFileSync("/tmp/adk-tui-debug.log", line);
}

export function DialogConnect() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const sdk = useSDK()
  
  const [url, setUrl] = createSignal(sdk.serverUrl())
  const [error, setError] = createSignal<string | null>(null)
  const [connecting, setConnecting] = createSignal(false)

  async function handleConnect() {
    const targetUrl = url().trim()
    log(`handleConnect called with: ${targetUrl}`)
    
    if (!targetUrl) {
      setError("URL cannot be empty")
      return
    }

    try {
      new URL(targetUrl)
    } catch {
      setError("Invalid URL format - must be http://... or https://...")
      return
    }

    setConnecting(true)
    setError(null)

    try {
      log(`Calling sdk.setServerUrl`)
      const success = await sdk.setServerUrl(targetUrl)
      log(`setServerUrl returned: ${success}`)

      if (success) {
        log(`Connection successful, showing app dialog`)
        dialog.replace(() => <DialogApp />)
      } else {
        const err = sdk.connectionError() || "Connection failed"
        log(`Connection failed: ${err}`)
        setError(err)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed"
      log(`Exception during connect: ${msg}`)
      setError(msg)
    } finally {
      setConnecting(false)
    }
  }

  useKeyboard((evt) => {
    if (evt.name === "return" && !connecting()) {
      evt.preventDefault()
      handleConnect()
    }
  })

  return (
    <box gap={1} paddingBottom={1}>
      <box paddingLeft={4} paddingRight={4}>
        <box flexDirection="row" justifyContent="space-between">
          <text fg={theme.text} attributes={TextAttributes.BOLD}>
            Connect to ADK Server
          </text>
          <text fg={theme.textMuted}>esc</text>
        </box>
        
        <box paddingTop={1}>
          <text fg={theme.textMuted}>
            Enter the ADK server URL to connect:
          </text>
        </box>

        <box paddingTop={1} paddingBottom={1}>
          <input
            onInput={(e) => {
              setUrl(e)
              setError(null)
            }}
            value={url()}
            focusedBackgroundColor={theme.backgroundPanel}
            cursorColor={theme.primary}
            focusedTextColor={theme.text}
            ref={(r) => setTimeout(() => r.focus(), 1)}
            placeholder="http://your-adk-server:8087"
          />
        </box>

        <Show when={error()}>
          <box paddingBottom={1}>
            <text fg={theme.danger}>{error()}</text>
          </box>
        </Show>

        <Show when={connecting()}>
          <box paddingBottom={1}>
            <text fg={theme.warning}>Connecting...</text>
          </box>
        </Show>

        <box flexDirection="row" gap={2}>
          <text fg={theme.textMuted}>
            Press <text fg={theme.text} attributes={TextAttributes.BOLD}>Enter</text> to connect
          </text>
          <text fg={theme.textMuted}>•</text>
          <text fg={theme.textMuted}>
            <text fg={theme.text} attributes={TextAttributes.BOLD}>Esc</text> to cancel
          </text>
        </box>
      </box>
    </box>
  )
}
