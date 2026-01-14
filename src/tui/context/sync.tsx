import { createContext, useContext, JSX } from "solid-js";
import { createStore } from "solid-js/store";

export type KeybindsConfig = {
  leader?: string;
  quit?: string;
  command_palette?: string;
  session_list?: string;
  session_new?: string;
  model_list?: string;
  agent_list?: string;
  theme_list?: string;
  status_view?: string;
  [key: string]: string | undefined;
}

interface SyncState {
  ready: boolean;
  status: "loading" | "partial" | "complete";
  data: {
    config: {
      theme?: string;
      keybinds?: KeybindsConfig;
    };
    session: any[];
    provider: any[];
  };
}

const SyncContext = createContext<SyncState>();

export function SyncProvider(props: { children: JSX.Element }) {
  const defaultKeybinds: KeybindsConfig = {
    leader: "ctrl+x",
    quit: "ctrl+c",
    command_palette: "ctrl+p",
    session_list: "<leader>s",
    session_new: "<leader>n",
    model_list: "<leader>m",
    agent_list: "<leader>a",
    theme_list: "<leader>t",
    status_view: "<leader>i",
  };

  const [state] = createStore<SyncState>({ 
    ready: true,
    status: "complete",
    data: {
      config: {
        theme: "opencode",
        keybinds: defaultKeybinds,
      },
      session: [],
      provider: [],
    }
  });
  
  return (
    <SyncContext.Provider value={state}>
      {props.children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
