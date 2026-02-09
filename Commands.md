# ADK TUI Commands Reference

Comparison of OpenCode TUI commands vs ADK TUI implementation.

## Implemented Commands

| Command | OpenCode Equivalent | Category | Description | Keybind |
|---------|---------------------|----------|-------------|---------|
| `/app` | `/agents` | App | Select ADK app | `<leader>a` |
| `/sessions` | `/sessions` (`/resume`, `/continue`) | Session | Switch between sessions | `<leader>s` |
| `/new` | `/new` (`/clear`) | Session | Start new session | `<leader>n` |
| `/delete` | _(no equivalent)_ | Session | Delete current session | `<leader>d` |
| `/connect` | `/connect` | Server | Connect to ADK server | - |
| `/copy` | `/copy` | Clipboard | Copy last assistant message | `<leader>y` |
| `/copy-all` | _(no equivalent)_ | Clipboard | Copy full session transcript | `<leader>c` |
| `/theme` | `/themes` | Application | Switch color theme | `<leader>t` |
| `/status` | `/status` | Application | View connection and session info | `<leader>i` |
| `/streaming` | _(no equivalent)_ | Application | Toggle streaming/non-streaming mode | - |
| `/help` | `/help` | Application | Show help and keybindings | - |
| `/quit` | `/exit` (`/quit`, `/q`) | Application | Exit application | `ctrl+c` |

### Additional Features (not slash commands)

| Feature | Trigger | Description |
|---------|---------|-------------|
| Copy on select | Mouse select + release | Auto-copies selected text to clipboard |
| Command palette | `ctrl+p` | Fuzzy-search all commands |
| Leader key | `ctrl+x` | Activates leader mode for keybind chords |

## Not Implemented (with rationale)

### Server-side constraints (no ADK API support)

| OpenCode Command | Why Not Applicable |
|------------------|-------------------|
| `/models` | ADK server controls the model. The client has no model-switching API; models are configured in the agent's Python code server-side. |
| `/share` / `/unshare` | OpenCode has a sharing backend that generates URLs. ADK has no session sharing API. |
| `/rename` | ADK sessions have IDs only, no titles. There is no rename API endpoint. |
| `/fork` | Requires message-level branching. ADK sessions are linear and immutable; there is no fork-session API. |
| `/compact` / `/summarize` | OpenCode sends a "summarize yourself" prompt to the LLM. ADK agents are server-controlled; the client cannot inject arbitrary meta-instructions. |
| `/undo` / `/redo` | OpenCode tracks message reverts locally. ADK events are immutable on the server; there is no delete-event or revert API. |

### OpenCode-specific concepts (no ADK equivalent)

| OpenCode Command | Why Not Applicable |
|------------------|-------------------|
| `/mcps` | MCP (Model Context Protocol) servers are an OpenCode concept for local tool integration. ADK tools are defined and managed server-side in agent code. |
| `/skills` | OpenCode skills are pre-built prompt templates. ADK has no equivalent concept; agent capabilities are defined server-side. |
| `/editor` | Opens `$EDITOR` for multi-line input composition. ADK TUI's prompt already supports multi-line via Shift+Enter. Nice-to-have but not critical. |

### Display toggles (low priority)

| OpenCode Command | Why Not Applicable |
|------------------|-------------------|
| `/timestamps` | Toggle timestamp display. Could implement but low priority; timestamps are always shown in ADK TUI. |
| `/thinking` | Toggle thinking/reasoning blocks. ADK responses don't typically include CoT thinking blocks. |
| `/timeline` | OpenCode-specific navigation for branched message history. ADK sessions are linear. |

### Covered by existing commands

| OpenCode Command | ADK TUI Equivalent |
|------------------|-------------------|
| `/agents` | `/app` - ADK "agents" are apps, selected via `/app`. |
| `/export` | `/copy-all` - Copies full transcript to clipboard. File export could be added later. |

## Streaming vs Non-Streaming

ADK provides two endpoints for agent execution:

| Mode | Endpoint | Behavior |
|------|----------|----------|
| **Streaming** (default) | `POST /run_sse` | Server-Sent Events stream. Events arrive incrementally as the agent processes. Text parts are consolidated into a single message per author. Shows a partial indicator while streaming. |
| **Non-streaming** | `POST /run` | Blocking JSON response. Returns `Event[]` all at once. All events are added to the timeline when the response completes. |

Both endpoints accept the same `AgentRunRequest` body. The `streaming` field in the request is metadata; the endpoint URL determines the behavior.

**Fallback:** If SSE streaming fails (e.g., server doesn't support it), the client automatically retries with the non-streaming `/run` endpoint.

Toggle via `/streaming` command or in the command palette.

## Command Architecture

Commands are registered in `src/tui/components/dialog-command.tsx` via `useBuiltInCommands()`. Each command has:

- `id` - Unique identifier (e.g., `"session:list"`)
- `title` - Slash command name shown in autocomplete (e.g., `"/sessions"`)
- `category` - Grouping in the command palette
- `description` - Help text
- `action` - Async handler function

Commands are accessible via:
1. **Slash autocomplete** - Type `/` in the prompt input
2. **Command palette** - Press `ctrl+p` and search
3. **Keybinds** - Direct keyboard shortcuts (where configured)
