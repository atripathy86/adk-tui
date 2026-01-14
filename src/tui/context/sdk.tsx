import { createContext, useContext, JSX } from "solid-js";
import { adkClient, ADKClient } from "../../sdk/client";

const SDKContext = createContext<ADKClient>(adkClient);

export function SDKProvider(props: { children: JSX.Element }) {
  return (
    <SDKContext.Provider value={adkClient}>
      {props.children}
    </SDKContext.Provider>
  );
}

export function useSDK() {
  const ctx = useContext(SDKContext);
  if (!ctx) throw new Error("useSDK must be used within SDKProvider");
  return ctx;
}
