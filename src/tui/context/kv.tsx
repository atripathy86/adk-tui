import { createContext, useContext, JSX } from "solid-js";

// Simple in-memory KV for now
const kvStore = new Map<string, any>();

export const KVContext = createContext({
  get: (key: string) => kvStore.get(key),
  set: (key: string, val: any) => kvStore.set(key, val)
});

export function KVProvider(props: { children: JSX.Element }) {
  return (
    <KVContext.Provider value={{ get: kvStore.get.bind(kvStore), set: kvStore.set.bind(kvStore) }}>
      {props.children}
    </KVContext.Provider>
  );
}

export function useKV() {
  return useContext(KVContext);
}
