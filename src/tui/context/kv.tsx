import { createContext, useContext, JSX } from "solid-js";

const kvStore = new Map<string, any>();

export const KVContext = createContext({
  get: <T,>(key: string, defaultValue?: T): T | undefined => {
    const val = kvStore.get(key);
    return val !== undefined ? val : defaultValue;
  },
  set: (key: string, val: any) => kvStore.set(key, val)
});

export function KVProvider(props: { children: JSX.Element }) {
  const value = {
    get: <T,>(key: string, defaultValue?: T): T | undefined => {
      const val = kvStore.get(key);
      return val !== undefined ? val : defaultValue;
    },
    set: (key: string, val: any) => kvStore.set(key, val)
  };
  
  return (
    <KVContext.Provider value={value}>
      {props.children}
    </KVContext.Provider>
  );
}

export function useKV() {
  return useContext(KVContext);
}
