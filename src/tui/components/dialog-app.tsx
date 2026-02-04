import { createMemo, createResource } from "solid-js";
import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select";
import { useDialog } from "../ui/dialog";
import { useSDK } from "../context/sdk";
import { useSync, useSyncActions } from "../context/sync";
import { useRoute } from "../context/route";

const DEBUG = process.env.ADK_TUI_DEBUG === "1";
function log(msg: string) {
  if (!DEBUG) return;
  const { appendFileSync } = require("fs");
  const line = `[DialogApp] ${msg}\n`;
  appendFileSync("/tmp/adk-tui-debug.log", line);
}

export function DialogApp() {
  log("DialogApp created");
  const dialog = useDialog();
  const sdk = useSDK();
  const syncState = useSync();
  const sync = useSyncActions();
  const route = useRoute();

  log(`DialogApp: serverUrl=${sdk.serverUrl()}`);

  const [apps] = createResource(
    () => sdk.serverUrl(),
    async (url) => {
      log(`DialogApp resource triggered with url: ${url}`);
      if (!url) {
        log(`DialogApp: url empty, returning []`);
        return [];
      }
      try {
        log(`DialogApp: fetching apps from ${url}`);
        const result = await sdk.client.listApps();
        log(`DialogApp: got ${result.length} apps`);
        return result;
      } catch (error) {
        log(`DialogApp: error fetching: ${error}`);
        console.error("Failed to list apps:", error);
        return [];
      }
    }
  );

  const options = createMemo((): DialogSelectOption<string>[] => {
    log(`DialogApp options memo evaluated`);
    
    // Don't render any selectable options while loading - only show a placeholder
    if (apps.loading) {
      return [];
    }
    
    const appList = apps() ?? [];

    if (appList.length === 0) {
      return [
        {
          title: "No apps available",
          value: "",
          description: sdk.serverUrl()
            ? "No apps returned by server"
            : "Use /connect to set an ADK server",
          disabled: true,
        },
      ];
    }

    return appList.map((app) => ({
      title: app,
      value: app,
      category: "Apps",
    }));
  });

  const handleSelect = (option: DialogSelectOption<string>) => {
    log(`DialogApp handleSelect: ${JSON.stringify(option)}`);
    if (!option.value || option.disabled) return;
    sync.setCurrentApp(option.value);
    // Clear current session when switching apps
    sync.setCurrentSession(null);
    sync.setSessions([]);
    dialog.clear();
    // Navigate to home when changing apps
    route.goHome();
  };

  log("DialogApp rendering");
  return (
    <DialogSelect
      title={apps.loading ? "Loading apps..." : "Select App"}
      placeholder="Search apps..."
      options={options()}
      current={syncState.data.currentApp ?? undefined}
      onSelect={handleSelect}
    />
  );
}
