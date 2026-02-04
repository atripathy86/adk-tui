# ADK TUI Implementation Plan

Comprehensive implementation of all features outlined in NextSteps.md to bring ADK TUI to feature parity with OpenCode's TUI experience.

---

## Overview

**Total new files**: 24
**Files to modify**: 3
**Implementation order**: Following NextSteps.md recommendations

---

## Sprint 1: SDK Foundation

### 1.1 Create TypeScript Types for ADK API
**Create**: `src/sdk/types.ts`

Define types based on OpenAPI spec at `adk_openapi.json`:
- `ADKSession`, `ADKEvent`, `ADKContent`, `ADKPart`
- `ADKFunctionCall`, `ADKFunctionResponse`
- `AgentRunRequest`, `ADKEventActions`

### 1.2 Expand SDK Client
**Modify**: `src/sdk/client.ts`

Add methods:
```
Session CRUD:
- createSession(), createSessionWithId()
- getSession(), deleteSession(), listSessions()

Agent Execution:
- run() - blocking execution
- runSSE() - streaming via AsyncIterable

Artifacts:
- listArtifacts(), loadArtifact(), listArtifactVersions()
```

### 1.3 Create SSE Client
**Create**: `src/sdk/sse.ts`

SSE implementation using native fetch with ReadableStream for `/run_sse` endpoint.

---

## Sprint 2: Chat Prompt Component

### 2.1 Prompt History Provider
**Create**: `src/tui/components/prompt/history.ts`

Store pattern with up/down arrow history navigation.

### 2.2 Autocomplete Component
**Create**: `src/tui/components/prompt/autocomplete.tsx`

Slash command completion (prefix: `/`).

### 2.3 Main Prompt Component
**Create**: `src/tui/components/prompt/index.tsx`

Multi-line textarea with:
- History navigation (up/down)
- Enter to submit, Shift+Enter for newline
- Themed border styling
- Focus management via PromptRef

---

## Sprint 3: Session Management

### 3.1 Update Sync Context
**Modify**: `src/tui/context/sync.tsx`

Add to state:
- `currentSession`, `currentApp`, `userId`
- `messages: Record<string, ADKEvent[]>`
- `session_status: Record<string, "idle" | "busy" | "retry">`

### 3.2 Session Context
**Create**: `src/tui/context/session.tsx`

Methods: `create()`, `switch()`, `delete()`, `refresh()`, `sendMessage()`

### 3.3 Session List Dialog
**Create**: `src/tui/components/dialog-session-list.tsx`

Using DialogSelect with fuzzy search, delete keybind.

### 3.4 App Selector Dialog
**Create**: `src/tui/components/dialog-app.tsx`

Select which ADK app to interact with.

---

## Sprint 4: Chat Timeline & Routes

### 4.1 Route Context
**Create**: `src/tui/context/route.tsx`

Simple routing: `{ type: "home" }` | `{ type: "session", sessionID }`

### 4.2 Home Route
**Create**: `src/tui/routes/home.tsx`

Logo, centered prompt, keybind hints.

### 4.3 Session View
**Create**: `src/tui/routes/session/index.tsx`

Layout: Header + scrollable Timeline + Prompt.

### 4.4 Message Components
**Create**: `src/tui/routes/session/message.tsx`

UserMessage (left border) vs AssistantMessage (parts rendering).

### 4.5 Tool Call Display
**Create**: `src/tui/routes/session/tool-call.tsx`

Collapsible function call details with args preview.

### 4.6 Sidebar
**Create**: `src/tui/routes/session/sidebar.tsx`

Agent name, session info, quick actions.

---

## Sprint 5: Streaming Integration

### 5.1 Streaming Text Component
**Create**: `src/tui/components/streaming-text.tsx`

Incremental text display with markdown rendering.

### 5.2 Integrate SSE with Session
**Modify**: Session context to handle streaming responses, update messages reactively.

---

## Sprint 6: Polish & UX

### 6.1 Dialog Alert
**Create**: `src/tui/ui/dialog-alert.tsx`

Static `.show()` returning `Promise<void>`.

### 6.2 Dialog Confirm
**Create**: `src/tui/ui/dialog-confirm.tsx`

Static `.show()` returning `Promise<boolean>`.

### 6.3 Toast System
**Create**: `src/tui/ui/toast.tsx`

Provider + `toast.show()`, `toast.error()` with auto-dismiss.

### 6.4 Spinner Component
**Create**: `src/tui/ui/spinner.tsx`

Animated spinner for loading states.

---

## Sprint 7: Advanced Features

### 7.1 Artifacts Viewer
**Create**: `src/tui/components/dialog-artifacts.tsx`

List and view session artifacts.

### 7.2 Configuration System
**Create**: `src/config/index.ts`

Support `~/.config/adk-tui/config.json` for:
- Server endpoints
- Default theme, app, userId
- Custom keybinds

---

## Sprint 8: Technical Debt

### 8.1 Remove Placeholders
- Delete `src/global/index.ts` (empty)
- Delete `src/util/filesystem.ts` (empty)

### 8.2 Error Boundary
**Create**: `src/tui/ui/error-boundary.tsx`

### 8.3 Cleanup on Exit
**Modify**: `src/index.tsx` - Handle SIGINT, abort pending streams.

---

## File Summary

| Sprint | New Files | Modified Files |
|--------|-----------|----------------|
| 1 | types.ts, sse.ts | client.ts |
| 2 | prompt/index.tsx, history.ts, autocomplete.tsx | - |
| 3 | session.tsx, dialog-session-list.tsx, dialog-app.tsx | sync.tsx |
| 4 | route.tsx, home.tsx, session/index.tsx, message.tsx, tool-call.tsx, sidebar.tsx | - |
| 5 | streaming-text.tsx | session.tsx |
| 6 | dialog-alert.tsx, dialog-confirm.tsx, toast.tsx, spinner.tsx | - |
| 7 | dialog-artifacts.tsx, config/index.ts | - |
| 8 | error-boundary.tsx | index.tsx |

---

## Key Reference Files

- **OpenCode prompt**: `opencode/packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx`
- **OpenCode dialogs**: `opencode/packages/opencode/src/cli/cmd/tui/dialog-*.tsx`
- **ADK OpenAPI**: `adk-tui/adk_openapi.json`
- **Existing patterns**: `adk-tui/src/tui/ui/dialog-select.tsx`

---

## Verification

After implementation:
1. `bun run build` - Verify clean build
2. `./adk-tui` - Launch and verify:
   - Logo displays, connects to server
   - `Ctrl+P` opens command palette
   - Can select app, create session
   - Can send messages and see streaming responses
   - `<leader>s` shows session list
   - Theme switching works
   - Escape closes dialogs
