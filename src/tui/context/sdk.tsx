import { createContext, useContext, JSX, createSignal, createResource, Accessor, onMount, Suspense } from "solid-js";
import { adkClient, ADKClient } from "../../sdk/client";
import { getServerUrl, loadConfig, updateConfig } from "../../config";

const DEBUG = process.env.ADK_TUI_DEBUG === "1";
function log(msg: string) {
  if (!DEBUG) return;
  const { appendFileSync } = require("fs");
  const line = `[SDK] ${msg}\n`;
  appendFileSync("/tmp/adk-tui-debug.log", line);
}

interface SDKContextValue {
  client: ADKClient;
  serverUrl: Accessor<string>;
  setServerUrl: (url: string) => Promise<boolean>;
  isConnected: Accessor<boolean>;
  connectionError: Accessor<string | null>;
  refreshApps: () => void;
}

const SDKContext = createContext<SDKContextValue>();

export function SDKProvider(props: {
  children: JSX.Element;
  initialServerUrl?: string;
}) {
  const [serverUrl, setServerUrlSignal] = createSignal("");
  const [connectionError, setConnectionError] = createSignal<string | null>(null);
  const [isConnected, setIsConnected] = createSignal(false);
  const [initialized, setInitialized] = createSignal(false);

  const [apps, { refetch: refreshApps }] = createResource(serverUrl, async (url) => {
    log(`apps resource triggered with url: ${url}`);
    if (!url) {
      log(`apps: url is empty, returning []`);
      setIsConnected(false);
      setConnectionError(null);
      return [];
    }

    try {
      log(`apps: fetching from ${url}`);
      adkClient.setBaseUrl(url);
      const result = await adkClient.listApps();
      log(`apps: got ${result.length} apps: ${JSON.stringify(result)}`);
      setIsConnected(true);
      setConnectionError(null);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      log(`apps: error fetching: ${msg}`);
      setIsConnected(false);
      setConnectionError(msg);
      return [];
    }
  });

  onMount(async () => {
    log(`onMount: initialServerUrl=${props.initialServerUrl}`);
    
    try {
      if (props.initialServerUrl) {
        log(`Using CLI URL: ${props.initialServerUrl}`);
        const success = await setServerUrl(props.initialServerUrl);
        log(`CLI connection result: ${success}`);
        setInitialized(true);
        return;
      }

      log("Loading config...");
      const config = await loadConfig();
      const url = getServerUrl(config);
      log(`Config URL: ${url}`);
      if (url) {
        const normalizedUrl = url.replace(/\/+$/, "");
        log(`Connecting to saved URL: ${normalizedUrl}`);
        setServerUrlSignal(normalizedUrl);
        adkClient.setBaseUrl(normalizedUrl);
      } else {
        log("No saved server URL in config");
      }
    } finally {
      setInitialized(true);
    }
  });

  async function setServerUrl(url: string): Promise<boolean> {
    const normalizedUrl = url.replace(/\/+$/, "");
    log(`setServerUrl called with: ${normalizedUrl}`);
    
    const testClient = new ADKClient(normalizedUrl);
    const success = await testClient.testConnection();
    log(`testConnection result: ${success}`);
    
    if (success) {
      log(`Connection successful, updating state and config`);
      setServerUrlSignal(normalizedUrl);
      adkClient.setBaseUrl(normalizedUrl);
      setIsConnected(true);
      setConnectionError(null);
      refreshApps();
      try {
        await updateConfig({
          servers: [{ name: "default", url: normalizedUrl }],
          defaultServer: "default",
        });
        log(`Config saved successfully`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        log(`Failed to save config: ${msg}`);
        setConnectionError(
          `Connected, but failed to save config: ${msg}`
        );
      }
      return true;
    } else {
      const msg = `Failed to connect to ${normalizedUrl}`;
      log(msg);
      setConnectionError(msg);
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
      <Suspense fallback={<></>}>
        {initialized() && props.children}
      </Suspense>
    </SDKContext.Provider>
  );
}

export function useSDK() {
  const ctx = useContext(SDKContext);
  if (!ctx) throw new Error("useSDK must be used within SDKProvider");
  return ctx;
}
