import { createResource, Show, For, onMount, createSignal } from "solid-js";
import { adkClient } from "../../sdk/client";
import { ThemeProvider, useTheme } from "../context/theme";
import { SDKProvider } from "../context/sdk";
import { KVProvider } from "../context/kv";
import { SyncProvider } from "../context/sync";
import { KeybindProvider, useKeybind } from "../context/keybind";
import { DialogProvider } from "../ui/dialog";
import { CommandProvider } from "../context/command";
import { Logo } from "../components/logo";

function MainContent() {
  const [apps] = createResource(async () => {
    return await adkClient.listApps();
  });
  
  const ctx = useTheme();
  const keybind = useKeybind();

  return (
    <box 
      borderStyle="single" 
      borderColor={ctx.theme.border} 
      padding={1} 
      flexDirection="column"
      width="100%"
      height="100%"
    >
      <box flexDirection="row" alignItems="center" gap={2} marginBottom={1}>
        <Logo />
        <box flexDirection="column">
          <text fg={ctx.theme.primary} bold>ADK TUI Client</text>
          <text fg={ctx.theme.secondary}>Connected to: http://ai02.labs.hpecorp.net:8087</text>
        </box>
      </box>
      
      <box marginTop={1} flexDirection="column">
        <Show when={!apps.loading} fallback={<text fg={ctx.theme.textMuted}>Loading apps...</text>}>
          <text underline fg={ctx.theme.text} marginBottom={1}>Available Apps:</text>
          <For each={apps()}>{(app) => (
            <text fg={ctx.theme.text}>• {app}</text>
          )}</For>
        </Show>
      </box>

      <box marginTop={2} flexDirection="column">
        <text fg={ctx.theme.textMuted}>
          Press {keybind.print("command_palette")} for command palette
        </text>
        <text fg={ctx.theme.textMuted}>
          Press {keybind.print("quit")} to quit
        </text>
      </box>
    </box>
  );
}

function AppWithCommands() {
  return (
    <CommandProvider>
      <MainContent />
    </CommandProvider>
  );
}

export default function App() {
  const [ready, setReady] = createSignal(false);
  
  onMount(() => {
    setReady(true);
  });

  return (
    <KVProvider>
      <SyncProvider>
        <SDKProvider>
          <ThemeProvider mode="dark">
            <KeybindProvider>
              <DialogProvider>
                <Show when={ready()}>
                  <AppWithCommands />
                </Show>
              </DialogProvider>
            </KeybindProvider>
          </ThemeProvider>
        </SDKProvider>
      </SyncProvider>
    </KVProvider>
  );
}
