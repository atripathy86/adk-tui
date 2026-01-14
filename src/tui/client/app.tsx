import { Box, Text } from "@opentui/core";
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
    <Box 
      borderStyle="single" 
      borderColor={ctx.theme.border} 
      padding={1} 
      flexDirection="column"
      width="100%"
      height="100%"
    >
      <Box flexDirection="row" alignItems="center" gap={2} marginBottom={1}>
        <Logo />
        <Box flexDirection="column">
          <Text color={ctx.theme.primary} bold>ADK TUI Client</Text>
          <Text color={ctx.theme.secondary}>Connected to: http://ai02.labs.hpecorp.net:8087</Text>
        </Box>
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Show when={!apps.loading} fallback={<Text color={ctx.theme.textMuted}>Loading apps...</Text>}>
          <Text underline color={ctx.theme.text} marginBottom={1}>Available Apps:</Text>
          <For each={apps()}>{(app) => (
            <Text color={ctx.theme.text}>• {app}</Text>
          )}</For>
        </Show>
      </Box>

      <Box marginTop={2} flexDirection="column">
        <Text color={ctx.theme.textMuted}>
          Press {keybind.print("command_palette")} for command palette
        </Text>
        <Text color={ctx.theme.textMuted}>
          Press {keybind.print("quit")} to quit
        </Text>
      </Box>
    </Box>
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
