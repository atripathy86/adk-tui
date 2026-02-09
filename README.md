# ADK TUI

A terminal user interface for [ADK](https://google.github.io/adk-docs/) (Agent Development Kit) servers, built with [SolidJS](https://www.solidjs.com/) and [OpenTUI](https://github.com/anomalyco/opentui). Inspired by the [OpenCode](https://github.com/anomalyco/opencode) TUI.

## Features

- **Chat with ADK agents** — send messages and stream responses in real time
- **Session management** — create, list, switch, and delete sessions
- **Streaming & non-streaming** — SSE streaming with automatic fallback to `/run`
- **Command palette** — fuzzy-searchable commands via `Ctrl+P` or `/` autocomplete
- **32 built-in themes** — switch on the fly with `/theme`
- **Clipboard integration** — copy messages, transcripts, or selected text (OSC52 + native)
- **Leader key chords** — Vim-style `Ctrl+X` leader key for quick access
- **Artifacts viewer** — browse agent-generated artifacts

## Quick Start

```bash
# Prerequisites: Bun v1.0+
bun install
bun run build
./adk-tui http://localhost:8087
```

Or in development mode:

```bash
bun run dev
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+P` | Command palette |
| `Ctrl+C` | Quit |
| `Ctrl+X` | Leader key |
| `<leader>a` | Select app |
| `<leader>s` | Session list |
| `<leader>n` | New session |
| `<leader>d` | Delete session |
| `<leader>t` | Switch theme |
| `<leader>i` | Status info |
| `<leader>y` | Copy last assistant message |
| `<leader>c` | Copy full transcript |
| `Escape` | Close dialog |

## Commands

| Command | Description |
|---------|-------------|
| `/app` | Select ADK app |
| `/sessions` | Switch between sessions |
| `/new` | Start new session |
| `/delete` | Delete current session |
| `/connect` | Connect to ADK server |
| `/copy` | Copy last assistant message |
| `/copy-all` | Copy full session transcript |
| `/theme` | Switch color theme |
| `/status` | View connection and session info |
| `/streaming` | Toggle streaming/non-streaming mode |
| `/help` | Show help and keybindings |
| `/quit` | Exit application |

See [Commands.md](./Commands.md) for a detailed comparison with OpenCode commands.

## Streaming

ADK TUI supports both response modes:

| Mode | Endpoint | Behavior |
|------|----------|----------|
| **Streaming** (default) | `POST /run_sse` | Server-Sent Events; responses appear incrementally |
| **Non-streaming** | `POST /run` | Blocking JSON; all events arrive at once |

Toggle with `/streaming`. If SSE fails, the client automatically falls back to `/run`.

## ADK API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/list-apps` | GET | Discover available apps |
| `/apps/{app}/users/{user}/sessions` | GET/POST | List or create sessions |
| `/apps/{app}/users/{user}/sessions/{id}` | GET/DELETE | Get or delete a session |
| `/run` | POST | Run agent (non-streaming) |
| `/run_sse` | POST | Run agent (SSE streaming) |
| `/apps/{app}/users/{user}/sessions/{id}/artifacts` | GET | List artifacts |

## Project Structure

```
src/
├── index.tsx                           # Entry point
├── config/index.ts                     # Config file (~/.config/adk-tui)
├── sdk/
│   ├── client.ts                       # ADK API client (REST + SSE)
│   └── types.ts                        # TypeScript types from ADK OpenAPI
├── tui/
│   ├── client/app.tsx                  # Root app component & providers
│   ├── components/
│   │   ├── dialog-app.tsx              # App selector
│   │   ├── dialog-artifacts.tsx        # Artifacts browser
│   │   ├── dialog-command.tsx          # Command palette
│   │   ├── dialog-connect.tsx          # Server connection
│   │   ├── dialog-help.tsx             # Help & keybindings
│   │   ├── dialog-session-list.tsx     # Session list
│   │   ├── dialog-status.tsx           # Status panel
│   │   ├── logo.tsx                    # ASCII logo
│   │   └── prompt/                     # Chat input (autocomplete, history)
│   ├── context/
│   │   ├── session.tsx                 # Session CRUD + message sending
│   │   ├── sync.tsx                    # Central state store
│   │   ├── sdk.tsx                     # SDK provider
│   │   ├── route.tsx                   # Client-side routing
│   │   ├── theme.tsx                   # Theme system (32 themes)
│   │   ├── keybind.tsx                 # Keyboard shortcut handling
│   │   ├── command.tsx                 # Command registration
│   │   ├── kv.tsx                      # Key-value storage
│   │   └── helper.tsx                  # Context utilities
│   ├── routes/
│   │   ├── home.tsx                    # Home screen
│   │   └── session/
│   │       ├── index.tsx               # Session view (chat timeline)
│   │       └── message.tsx             # Message rendering (text, tool calls)
│   ├── ui/                             # Reusable UI primitives
│   │   ├── dialog.tsx                  # Modal dialog system
│   │   ├── dialog-select.tsx           # Searchable select
│   │   ├── dialog-alert.tsx            # Alert dialog
│   │   ├── dialog-confirm.tsx          # Confirmation dialog
│   │   ├── toast.tsx                   # Toast notifications
│   │   ├── spinner.tsx                 # Loading spinner
│   │   └── error-boundary.tsx          # Error boundary
│   └── util/
│       └── clipboard.ts               # Clipboard (OSC52 + native)
```

## Debug Mode

```bash
ADK_TUI_DEBUG=1 ./adk-tui

# In another terminal:
tail -f /tmp/adk-tui-debug.log
```

## Development Notes

- Build uses Bun + esbuild with `babel-preset-solid` for JSX transformation
- `jsxImportSource` is set to `@opentui/solid` in tsconfig.json
- TypeScript is `noEmit` — type checking is separate from the build

## Troubleshooting

**TUI crashes immediately** — use a modern terminal (iTerm2, Kitty, Alacritty, Windows Terminal) that supports Kitty keyboard protocol and 24-bit color.

**Cannot connect** — verify the ADK server: `curl http://your-server:8087/list-apps`

**Theme colors wrong** — check `echo $COLORTERM` outputs `truecolor` or `24bit`.

## License

MIT

## Acknowledgments

- [OpenCode](https://github.com/anomalyco/opencode) — TUI architecture and theme system
- [OpenTUI](https://github.com/anomalyco/opentui) — Terminal rendering engine
