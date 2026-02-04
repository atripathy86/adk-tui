# ADK TUI

A terminal user interface (TUI) client for ADK (Agent Development Kit) servers, built using the same architecture and look-and-feel as [OpenCode](https://github.com/anomalyco/opencode).

## Overview

ADK TUI provides a rich terminal-based interface for interacting with ADK agents. It connects to any ADK webserver endpoint and allows you to manage sessions, run agents, and view results - all from your terminal.

## Current Status

**Version**: 0.0.1 (Prototype)

### What's Working

- **TUI Rendering Engine**: Full terminal UI powered by `@opentui/solid` and SolidJS
- **ADK Server Connection**: Connects to ADK webserver (set via `/connect` command)
- **App Discovery**: Fetches and displays available apps from the `/list-apps` endpoint
- **Theme System**: 32 built-in themes with theme switcher
- **Command Palette**: `Ctrl+P` opens searchable command palette
- **Keybind System**: Full keyboard shortcut support with leader key
- **Dialog System**: Modal dialogs with fuzzy search filtering
- **Dark/Light Mode**: Automatic terminal background detection
- **Logo Display**: Custom ADK ASCII art branding

### Project Structure

```
adk-tui/
├── src/
│   ├── index.tsx              # Entry point
│   ├── sdk/
│   │   └── client.ts          # ADK API client
│   ├── util/
│   │   └── keybind.ts         # Keybind parsing utilities
│   └── tui/
│       ├── client/
│       │   └── app.tsx        # Main application component
│       ├── components/
│       │   ├── logo.tsx       # ADK logo component
│       │   └── dialog-command.tsx  # Command palette
│       ├── context/
│       │   ├── theme.tsx      # Theme provider & color system
│       │   ├── theme/         # 32 theme JSON files
│       │   ├── sdk.tsx        # SDK context provider
│       │   ├── sync.tsx       # State synchronization & keybind config
│       │   ├── kv.tsx         # Key-value storage
│       │   ├── keybind.tsx    # Keyboard shortcut handling
│       │   ├── command.tsx    # Command palette provider
│       │   └── helper.tsx     # Context utilities
│       └── ui/
│           ├── dialog.tsx     # Modal dialog system
│           └── dialog-select.tsx  # Searchable select dialog
├── package.json
├── tsconfig.json
├── NextSteps.md               # Development roadmap
└── test-sdk.ts                # SDK connection test
```

## Installation

### Prerequisites

- [Bun](https://bun.sh/) v1.0+ (JavaScript runtime)
- A running ADK server endpoint

### Setup

```bash
# Clone or copy the adk-tui directory
cd adk-tui

# Install dependencies
bun install

# Run in development mode
bun run dev

# Build standalone binary
bun run build
```

## Usage

### Running the TUI

```bash
# Run compiled binary
./adk-tui

# Run and connect to a server immediately
./adk-tui http://localhost:8087

# Or run in development mode
bun run dev
```

### Debug Mode

To enable detailed logging for troubleshooting:

```bash
# Enable debug logging
ADK_TUI_DEBUG=1 ./adk-tui

# View debug logs (in a separate terminal)
tail -f /tmp/adk-tui-debug.log
```

Debug logs include:
- Terminal and environment information
- Component rendering lifecycle
- TTY status checks
- Initialization flow
- Error details

### Testing SDK Connection

```bash
bun run test-sdk.ts
```

Expected output:
```
Testing ADK Client connection...
Successfully fetched apps: [ "adk_cli", "hello_agent" ]
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+P` | Open command palette |
| `Ctrl+C` | Quit application |
| `Ctrl+X` | Leader key (prefix for compound shortcuts) |
| `Ctrl+X` then `t` | Open theme switcher |
| `Ctrl+X` then `s` | Open session list (planned) |
| `Ctrl+X` then `n` | New session (planned) |
| `Escape` | Close current dialog |

### Command Palette

Press `Ctrl+P` to open the command palette. Available commands:

- **Switch Theme** - Opens theme picker with 32 themes
- **Quit** - Exit the application

Type to fuzzy-search commands.

## Configuration

### Changing the ADK Server Endpoint

Use the `/connect` command in the command palette to set the server URL. The selected URL is saved to your config at `~/.config/adk-tui/config.json` and used on next launch.

You can also pass a server URL as the first CLI argument to connect immediately:

```bash
./adk-tui http://localhost:8087
```

### Changing the Default Theme

Edit `src/tui/context/sync.tsx` and modify the default theme:

```typescript
data: {
  config: {
    theme: "dracula"  // or any theme name from context/theme/
  }
}
```

### Customizing Keybinds

Edit `src/tui/context/sync.tsx` and modify the `defaultKeybinds` object:

```typescript
const defaultKeybinds: KeybindsConfig = {
  leader: "ctrl+x",
  quit: "ctrl+c",
  command_palette: "ctrl+p",
  theme_list: "<leader>t",
  // ... add more keybinds
};
```

### Available Themes

| Theme | Description |
|-------|-------------|
| `opencode` | Default OpenCode theme |
| `dracula` | Popular dark theme |
| `catppuccin` | Soothing pastel theme |
| `catppuccin-frappe` | Catppuccin variant |
| `catppuccin-macchiato` | Catppuccin variant |
| `nord` | Arctic, north-bluish color palette |
| `gruvbox` | Retro groove color scheme |
| `tokyonight` | Clean dark theme inspired by Tokyo |
| `rosepine` | Soho vibes |
| `solarized` | Precision colors for machines and people |
| `github` | GitHub-inspired theme |
| `monokai` | Sublime Text classic |
| `one-dark` | Atom One Dark |
| `material` | Material Design colors |
| `ayu` | Simple, bright colors |
| `vesper` | Minimal dark theme |
| `vercel` | Vercel-inspired theme |
| ... | 15 more themes available |

## ADK API Endpoints Used

The client currently uses these ADK endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/list-apps` | GET | List available ADK applications |
| `/apps/{app}/users/{user}/sessions` | GET | List sessions (planned) |
| `/run` | POST | Run agent (planned) |
| `/run_sse` | POST | Run agent with SSE streaming (planned) |

## Architecture

ADK TUI follows the same client-server architecture as OpenCode:

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐
│                 │ ◄────────────────► │                 │
│   ADK TUI       │                    │   ADK Server    │
│   (Terminal)    │     /list-apps     │   (Backend)     │
│                 │     /run           │                 │
│  @opentui/solid │     /run_sse       │                 │
│  + SolidJS      │                    │                 │
└─────────────────┘                    └─────────────────┘
```

### Key Technologies

- **@opentui/core**: Terminal rendering primitives (Box, Text, etc.)
- **@opentui/solid**: SolidJS bindings for OpenTUI
- **SolidJS**: Reactive UI framework
- **Bun**: JavaScript runtime and bundler
- **Zod**: Runtime type validation
- **remeda**: Utility functions
- **fuzzysort**: Fuzzy search for command palette

## Troubleshooting

### TUI crashes immediately

Check that your terminal supports the required escape sequences. The TUI uses:
- Kitty keyboard protocol
- 24-bit color (truecolor)
- Mouse tracking

Try running in a modern terminal like:
- iTerm2 (macOS)
- Kitty
- Alacritty
- Windows Terminal

### Cannot connect to ADK server

1. Verify the server is running: `curl http://your-adk-server:8087/list-apps`
2. Check network connectivity
3. Ensure no firewall is blocking the connection

### Theme colors look wrong

Your terminal may not support 24-bit color. Check with:
```bash
echo $COLORTERM  # Should output "truecolor" or "24bit"
```

## Roadmap

See [NextSteps.md](./NextSteps.md) for the detailed development roadmap. Key upcoming features:

1. **Chat Prompt Input** - Multi-line text input with history
2. **Session Management** - Create, list, switch between sessions
3. **Agent Execution** - Send messages and stream responses
4. **Chat Timeline** - Display conversation history
5. **Artifacts Viewer** - View agent-generated artifacts

## License

MIT

## Acknowledgments

- Built on the [OpenCode](https://github.com/anomalyco/opencode) TUI architecture
- Uses [OpenTUI](https://github.com/anomalyco/opentui) for terminal rendering
- Theme files adapted from OpenCode's theme system
