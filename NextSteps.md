# Next Steps for ADK TUI

This document outlines the planned development phases to bring ADK TUI to feature parity with OpenCode's TUI experience.

---

## Completed Work

### Build System Fixed ✅
**Date**: Jan 26, 2026

The TUI now builds and runs correctly. The JSX runtime issues have been resolved.

**What was done**:
- Created custom `scripts/solid-plugin.ts` with `delegateEvents: false` to prevent browser-only DOM event delegation code
- Added `build.ts` using Bun.build() API (matches OpenCode's approach)
- Pinned `solid-js` to 1.9.9 to match `@opentui/solid` peer dependency
- Fixed KV context `get()` to support default values

**Root cause**: `babel-preset-solid` generates `delegateEvents()` calls for DOM event delegation which requires `window.document` (browser-only). The `@opentui/solid` library handles events differently via `node.on()`.

### Core Infrastructure ✅
- Theme system with 32 themes (`src/tui/context/theme.tsx`)
- Dialog system (`src/tui/ui/dialog.tsx`, `src/tui/ui/dialog-select.tsx`)
- Command palette (`src/tui/components/dialog-command.tsx`)
- Keybind system (`src/tui/context/keybind.tsx`)
- ADK SDK client (`src/sdk/client.ts`)
- All context providers wired up

### Working Features ✅
- TUI renders with ADK logo
- Connects to ADK server and lists available apps
- Theme switching works
- Keybind display works

---

## Phase 1: Core Interaction (High Priority)

### 1.1 Command Palette & Keybindings
**Status**: ✅ Keybind context ported and wired

**Remaining Tasks**:
- [ ] Test command palette dialog (`Ctrl+P`)
- [ ] Verify all keybindings work:
  - `Ctrl+C` - Exit / Cancel operation
  - `Ctrl+P` - Open command palette
  - `Ctrl+N` - New session
  - `Ctrl+L` - Clear screen
  - `Ctrl+T` - Switch theme

### 1.2 Chat Prompt Input
**Status**: Not started

**Tasks**:
- [ ] Create multi-line text input component
- [ ] Implement prompt history (up/down arrows)
- [ ] Add autocomplete for commands (prefix: `/`)
- [ ] Support paste from clipboard
- [ ] Implement vim-like keybindings (optional)

**Files to create**:
- `src/tui/components/prompt/index.tsx` - Main prompt component
- `src/tui/components/prompt/textarea.tsx` - Text input primitive
- `src/tui/components/prompt/history.ts` - Prompt history provider
- `src/tui/components/prompt/autocomplete.tsx` - Autocomplete dropdown

### 1.3 Session Management
**Status**: Not started

**Tasks**:
- [ ] Create session list view (home screen)
- [ ] Implement session creation (new chat)
- [ ] Add session switching
- [ ] Display session history/titles
- [ ] Wire to ADK sessions API (`/apps/{app}/users/{user}/sessions`)

**Files to create**:
- `src/tui/routes/home.tsx` - Home screen with session list
- `src/tui/components/dialog-session-list.tsx` - Session picker dialog

---

## Phase 2: Agent Communication (High Priority)

### 2.1 Expand ADK SDK Client
**Status**: Basic client exists

**Tasks**:
- [ ] Add session CRUD operations
- [ ] Implement `/run` endpoint for agent execution
- [ ] Implement `/run_sse` for streaming responses
- [ ] Add artifact retrieval (`/artifacts`)
- [ ] Add eval endpoints (if needed)

**Files to modify**:
- `src/sdk/client.ts` - Add all ADK API methods

**ADK Endpoints to implement**:
```typescript
// Sessions
GET  /apps/{app}/users/{user}/sessions
POST /apps/{app}/users/{user}/sessions
GET  /apps/{app}/users/{user}/sessions/{session}
DELETE /apps/{app}/users/{user}/sessions/{session}

// Agent Execution
POST /run         - Run agent (blocking)
POST /run_sse     - Run agent (streaming)

// Artifacts
GET /apps/{app}/users/{user}/sessions/{session}/artifacts
GET /apps/{app}/users/{user}/sessions/{session}/artifacts/{name}
```

### 2.2 Streaming Response Handler
**Status**: Not started

**Tasks**:
- [ ] Create SSE (Server-Sent Events) client for `/run_sse`
- [ ] Parse streaming chunks
- [ ] Display incremental text as it arrives
- [ ] Handle tool calls and function results
- [ ] Show typing indicators / spinners

**Files to create**:
- `src/sdk/sse.ts` - SSE client implementation
- `src/tui/components/streaming-text.tsx` - Incremental text display

---

## Phase 3: Chat Interface (Medium Priority)

### 3.1 Session View / Chat Timeline
**Status**: Not started

**Tasks**:
- [ ] Create scrollable message timeline
- [ ] Render user messages vs agent responses differently
- [ ] Display tool calls with collapsible details
- [ ] Show timestamps
- [ ] Implement message selection/copying

**Files to create**:
- `src/tui/routes/session/index.tsx` - Main session view
- `src/tui/routes/session/timeline.tsx` - Message timeline
- `src/tui/routes/session/message.tsx` - Individual message component
- `src/tui/routes/session/tool-call.tsx` - Tool call display

### 3.2 Sidebar
**Status**: Not started

**Tasks**:
- [ ] Show current agent name
- [ ] Show current model (if applicable)
- [ ] Display session info (ID, created time)
- [ ] Quick action buttons

**Files to create**:
- `src/tui/routes/session/sidebar.tsx`

---

## Phase 4: Polish & UX (Medium Priority)

### 4.1 Dialogs
**Status**: ✅ Base dialog system ported

**Remaining Tasks**:
- [ ] Implement app selector dialog
- [ ] Add confirmation dialogs
- [ ] Create alert/error dialogs

**Files to create**:
- `src/tui/ui/dialog-alert.tsx` - Alert dialog
- `src/tui/components/dialog-app.tsx` - App selector

### 4.2 Toast Notifications
**Status**: Not started

**Tasks**:
- [ ] Port toast system from OpenCode
- [ ] Show success/error/info toasts
- [ ] Auto-dismiss with configurable duration

**Files to create**:
- `src/tui/ui/toast.tsx`

### 4.3 Loading States & Spinners
**Status**: Not started

**Tasks**:
- [ ] Add loading spinners for async operations
- [ ] Show progress indicators where appropriate
- [ ] Implement skeleton loading states

**Files to create**:
- `src/tui/ui/spinner.tsx`

---

## Phase 5: Advanced Features (Lower Priority)

### 5.1 Artifacts Viewer
**Tasks**:
- [ ] List session artifacts
- [ ] Display artifact content
- [ ] Support different artifact types (text, JSON, etc.)

### 5.2 Eval Results (if needed)
**Tasks**:
- [ ] Display eval sets
- [ ] Show eval results
- [ ] Run evals from TUI

### 5.3 Multi-Server Support
**Tasks**:
- [ ] Allow configuring multiple ADK endpoints
- [ ] Server switcher in command palette
- [ ] Per-server session management

### 5.4 Configuration File
**Tasks**:
- [ ] Support `~/.config/adk-tui/config.json`
- [ ] Persist theme preference
- [ ] Store server endpoints
- [ ] Custom keybindings

---

## Implementation Order Recommendation

For the fastest path to a usable product:

1. **Phase 1.2** (Chat Prompt) - Users need to input text
2. **Phase 2.1** (SDK expansion) - Need API to send prompts
3. **Phase 2.2** (Streaming) - See responses as they come
4. **Phase 3.1** (Chat Timeline) - Display the conversation
5. **Phase 1.1** (Keybindings) - Better UX
6. **Phase 1.3** (Sessions) - Manage conversations
7. **Phase 4.x** (Polish) - Nice to have

---

## Technical Debt to Address

- [ ] Remove placeholder files (`src/global/index.ts`, `src/util/filesystem.ts`)
- [ ] Clean up unused imports in ported files
- [ ] Add proper TypeScript types for ADK API responses
- [ ] Write unit tests for SDK client
- [ ] Add error boundaries throughout the app
- [ ] Implement proper cleanup on exit

---

## Build & Run

```bash
# Install dependencies
bun install

# Build executable
bun run build

# Run the TUI
./adk-tui

# Development mode (without compiling)
bun run dev
```

---

## Contributing

When implementing these features:

1. **Follow OpenCode patterns**: Look at the corresponding OpenCode file for reference
2. **Use SolidJS idioms**: Signals, createEffect, createResource, etc.
3. **Keep themes working**: Test with multiple themes
4. **Test keyboard navigation**: TUI apps need solid keyboard support

---

## Resources

- [OpenCode Source](https://github.com/anomalyco/opencode) - Reference implementation
- [OpenTUI Docs](https://github.com/anomalyco/opentui) - TUI framework docs
- [SolidJS Tutorial](https://www.solidjs.com/tutorial) - Reactivity model
- [ADK OpenAPI Spec](http://ai02.labs.hpecorp.net:8087/openapi.json) - API reference
