import { createContext, useContext, JSX, createSignal, createResource, Accessor } from "solid-js";
import { adkClient, ADKClient, DEFAULT_ADK_URL } from "../../sdk/client";

interface SDKContextValue {
  client: ADKClient;
  serverUrl: Accessor<string>;
  setServerUrl: (url: string) => Promise<boolean>;
  isConnected: Accessor<boolean>;
  connectionError: Accessor<string | null>;
  refreshApps: () => void;
}

const SDKContext = createContext<SDKContextValue>();

export function SDKProvider(props: { children: JSX.Element }) {
  const [serverUrl, setServerUrlSignal] = createSignal(DEFAULT_ADK_URL);
  const [connectionError, setConnectionError] = createSignal<string | null>(null);
  const [isConnected, setIsConnected] = createSignal(false);

  const [apps, { refetch: refreshApps }] = createResource(
    serverUrl,
    async (url) => {
      try {
        adkClient.setBaseUrl(url);
        const result = await adkClient.listApps();
        setIsConnected(true);
        setConnectionError(null);
        return result;
      } catch (e) {
        setIsConnected(false);
        setConnectionError(e instanceof Error ? e.message : "Connection failed");
        return [];
      }
    }
  );

  async function setServerUrl(url: string): Promise<boolean> {
    const normalizedUrl = url.replace(/\/+$/, "");
    
    const testClient = new ADKClient(normalizedUrl);
    const success = await testClient.testConnection();
    
    if (success) {
      setServerUrlSignal(normalizedUrl);
      adkClient.setBaseUrl(normalizedUrl);
      setIsConnected(true);
      setConnectionError(null);
      refreshApps();
      return true;
    } else {
      setConnectionError(`Failed to connect to ${normalizedUrl}`);
      return false;
    }
  }

  const value: SDKContextValue = {
    client: adkClient,
    serverUrl,
    setServerUrl,
    isConnected,
    connectionError,
    refreshApps,
  };

  return (
    <SDKContext.Provider value={value}>
      {props.children}
    </SDKContext.Provider>
  );
}

export function useSDK() {
  const ctx = useContext(SDKContext);
  if (!ctx) throw new Error("useSDK must be used within SDKProvider");
  return ctx;
}
