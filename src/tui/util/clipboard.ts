import { $ } from "bun"
import { platform, release } from "os"

/**
 * Writes text to clipboard via OSC 52 escape sequence.
 * This allows clipboard operations to work over SSH by having
 * the terminal emulator handle the clipboard locally.
 */
function writeOsc52(text: string): void {
  if (!process.stdout.isTTY) return
  const base64 = Buffer.from(text).toString("base64")
  const osc52 = `\x1b]52;c;${base64}\x07`
  const passthrough = process.env["TMUX"] || process.env["STY"]
  const sequence = passthrough ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52
  process.stdout.write(sequence)
}

/** Simple lazy initializer - caches the result of fn() on first call */
function lazy<T>(fn: () => T): () => T {
  let cached: T | undefined
  let initialized = false
  return () => {
    if (!initialized) {
      cached = fn()
      initialized = true
    }
    return cached!
  }
}

export namespace Clipboard {
  export interface Content {
    data: string
    mime: string
  }

  export async function read(): Promise<Content | undefined> {
    const os = platform()

    if (os === "darwin") {
      try {
        const result = await $`pbpaste`.nothrow().text()
        if (result) {
          return { data: result, mime: "text/plain" }
        }
      } catch {}
    }

    if (os === "win32" || release().includes("WSL")) {
      try {
        const result = await $`powershell.exe -NonInteractive -NoProfile -Command "Get-Clipboard"`.nothrow().text()
        if (result) {
          return { data: result.trim(), mime: "text/plain" }
        }
      } catch {}
    }

    if (os === "linux") {
      if (process.env["WAYLAND_DISPLAY"] && Bun.which("wl-paste")) {
        try {
          const result = await $`wl-paste`.nothrow().text()
          if (result) return { data: result, mime: "text/plain" }
        } catch {}
      }
      if (Bun.which("xclip")) {
        try {
          const result = await $`xclip -selection clipboard -o`.nothrow().text()
          if (result) return { data: result, mime: "text/plain" }
        } catch {}
      }
      if (Bun.which("xsel")) {
        try {
          const result = await $`xsel --clipboard --output`.nothrow().text()
          if (result) return { data: result, mime: "text/plain" }
        } catch {}
      }
    }
  }

  const getCopyMethod = lazy(() => {
    const os = platform()

    if (os === "darwin" && Bun.which("osascript")) {
      return async (text: string) => {
        const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
        await $`osascript -e 'set the clipboard to "${escaped}"'`.nothrow().quiet()
      }
    }

    if (os === "linux") {
      if (process.env["WAYLAND_DISPLAY"] && Bun.which("wl-copy")) {
        return async (text: string) => {
          const proc = Bun.spawn(["wl-copy"], { stdin: "pipe", stdout: "ignore", stderr: "ignore" })
          proc.stdin.write(text)
          proc.stdin.end()
          await proc.exited.catch(() => {})
        }
      }
      if (Bun.which("xclip")) {
        return async (text: string) => {
          const proc = Bun.spawn(["xclip", "-selection", "clipboard"], {
            stdin: "pipe",
            stdout: "ignore",
            stderr: "ignore",
          })
          proc.stdin.write(text)
          proc.stdin.end()
          await proc.exited.catch(() => {})
        }
      }
      if (Bun.which("xsel")) {
        return async (text: string) => {
          const proc = Bun.spawn(["xsel", "--clipboard", "--input"], {
            stdin: "pipe",
            stdout: "ignore",
            stderr: "ignore",
          })
          proc.stdin.write(text)
          proc.stdin.end()
          await proc.exited.catch(() => {})
        }
      }
    }

    if (os === "win32" || release().includes("WSL")) {
      const cmd = os === "win32" ? "powershell.exe" : "powershell.exe"
      return async (text: string) => {
        const proc = Bun.spawn(
          [
            cmd,
            "-NonInteractive",
            "-NoProfile",
            "-Command",
            "[Console]::InputEncoding = [System.Text.Encoding]::UTF8; Set-Clipboard -Value ([Console]::In.ReadToEnd())",
          ],
          {
            stdin: "pipe",
            stdout: "ignore",
            stderr: "ignore",
          },
        )
        proc.stdin.write(text)
        proc.stdin.end()
        await proc.exited.catch(() => {})
      }
    }

    // Fallback: try writing via OSC52 only
    return async (_text: string) => {}
  })

  export async function copy(text: string): Promise<void> {
    writeOsc52(text)
    await getCopyMethod()(text)
  }
}
