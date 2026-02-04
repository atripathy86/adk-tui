import { createContext, useContext, JSX } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { Session, Event } from "../../sdk/types";

export type KeybindsConfig = {
  leader?: string;
  quit?: string;
  command_palette?: string;
  session_list?: string;
  session_new?: string;
  session_delete?: string;
  model_list?: string;
  agent_list?: string;
  theme_list?: string;
  status_view?: string;
  history_previous?: string;
  history_next?: string;
  [key: string]: string | undefined;
};

export type SessionStatus = {
  type: "idle" | "busy" | "error" | "retry";
  message?: string;
};

interface SyncState {
  ready: boolean;
  status: "loading" | "partial" | "complete";
  data: {
    config: {
      theme?: string;
      keybinds?: KeybindsConfig;
    };
    // Current app and user
    currentApp: string | null;
    userId: string;
    // Sessions
    sessions: Session[];
    currentSessionId: string | null;
    // Messages per session
    messages: Record<string, Event[]>;
    // Session status (idle, busy, error)
    sessionStatus: Record<string, SessionStatus>;
    // Available providers/models
    provider: any[];
  };
}

const SyncContext = createContext<{
  state: SyncState;
  setCurrentApp: (appName: string | null) => void;
  setCurrentSession: (sessionId: string | null) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  setMessages: (sessionId: string, events: Event[]) => void;
  addMessage: (sessionId: string, event: Event) => void;
  updateMessage: (sessionId: string, event: Event) => void;
  setSessionStatus: (sessionId: string, status: SessionStatus) => void;
}>();

export function SyncProvider(props: { children: JSX.Element }) {
  const defaultKeybinds: KeybindsConfig = {
    leader: "ctrl+x",
    quit: "ctrl+c",
    command_palette: "ctrl+p",
    session_list: "<leader>s",
    session_new: "<leader>n",
    session_delete: "<leader>d",
    model_list: "<leader>m",
    agent_list: "<leader>a",
    theme_list: "<leader>t",
    status_view: "<leader>i",
    history_previous: "up",
    history_next: "down",
  };

  const [state, setState] = createStore<SyncState>({
    ready: true,
    status: "complete",
    data: {
      config: {
        theme: "opencode",
        keybinds: defaultKeybinds,
      },
      currentApp: null,
      userId: "default-user",
      sessions: [],
      currentSessionId: null,
      messages: {},
      sessionStatus: {},
      provider: [],
    },
  });

  const actions = {
    setCurrentApp(appName: string | null) {
      setState("data", "currentApp", appName);
    },

    setCurrentSession(sessionId: string | null) {
      setState("data", "currentSessionId", sessionId);
    },

    setSessions(sessions: Session[]) {
      setState("data", "sessions", sessions);
    },

    addSession(session: Session) {
      setState(
        produce((draft) => {
          draft.data.sessions.push(session);
        })
      );
    },

    removeSession(sessionId: string) {
      setState(
        produce((draft) => {
          draft.data.sessions = draft.data.sessions.filter(
            (s) => s.id !== sessionId
          );
          if (draft.data.currentSessionId === sessionId) {
            draft.data.currentSessionId = null;
          }
          delete draft.data.messages[sessionId];
          delete draft.data.sessionStatus[sessionId];
        })
      );
    },

    setMessages(sessionId: string, events: Event[]) {
      setState("data", "messages", sessionId, events);
    },

    addMessage(sessionId: string, event: Event) {
      setState(
        produce((draft) => {
          if (!draft.data.messages[sessionId]) {
            draft.data.messages[sessionId] = [];
          }
          draft.data.messages[sessionId].push(event);
        })
      );
    },

    updateMessage(sessionId: string, event: Event) {
      setState(
        produce((draft) => {
          if (!draft.data.messages[sessionId]) {
            draft.data.messages[sessionId] = [];
          }
          const messages = draft.data.messages[sessionId];
          const existingIndex = messages.findIndex((m) => m.id === event.id);
          if (existingIndex >= 0) {
            messages[existingIndex] = event;
          } else {
            messages.push(event);
          }
        })
      );
    },

    setSessionStatus(sessionId: string, status: SessionStatus) {
      setState("data", "sessionStatus", sessionId, status);
    },
  };

  return (
    <SyncContext.Provider value={{ state, ...actions }}>
      {props.children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx.state;
}

export function useSyncActions() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSyncActions must be used within SyncProvider");
  return ctx;
}
