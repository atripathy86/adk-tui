import { createMemo, createResource, Show, createSignal } from "solid-js";
import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select";
import { useDialog } from "../ui/dialog";
import { useSDK } from "../context/sdk";
import { useSync } from "../context/sync";
import { useTheme } from "../context/theme";
import type { Part } from "../../sdk/types";

interface ArtifactViewerProps {
  artifactName: string;
  sessionId: string;
}

function ArtifactViewer(props: ArtifactViewerProps) {
  const { theme } = useTheme();
  const sdk = useSDK();
  const sync = useSync();
  const dialog = useDialog();

  const [artifact] = createResource(
    () => ({
      name: props.artifactName,
      sessionId: props.sessionId,
    }),
    async ({ name, sessionId }) => {
      const appName = sync.data.currentApp;
      if (!appName) return null;

      try {
        return await sdk.client.loadArtifact(
          appName,
          sync.data.userId,
          sessionId,
          name
        );
      } catch (error) {
        console.error("Failed to load artifact:", error);
        return null;
      }
    }
  );

  const content = createMemo(() => {
    const art = artifact();
    if (!art) return "Loading...";

    if (art.text) return art.text;
    if (art.inlineData) {
      return `[Binary data: ${art.inlineData.mimeType ?? "unknown"}]`;
    }
    return JSON.stringify(art, null, 2);
  });

  return (
    <box
      flexDirection="column"
      border={["top", "left", "right", "bottom"]}
      borderColor={theme.border}
      backgroundColor={theme.backgroundPanel}
      padding={2}
      minWidth={50}
      maxWidth={80}
      maxHeight={20}
    >
      <box
        flexDirection="row"
        justifyContent="space-between"
        marginBottom={1}
      >
        <text fg={theme.primary} bold>
          {props.artifactName}
        </text>
        <text
          fg={theme.textMuted}
          onMouseUp={() => dialog.clear()}
        >
          [X]
        </text>
      </box>

      <scrollbox flexGrow={1}>
        <Show
          when={!artifact.loading}
          fallback={<text fg={theme.textMuted}>Loading...</text>}
        >
          <text fg={theme.text}>{content()}</text>
        </Show>
      </scrollbox>

      <box marginTop={1}>
        <text fg={theme.textMuted}>
          Press <span style={{ fg: theme.text }}>Escape</span> to close
        </text>
      </box>
    </box>
  );
}

interface DialogArtifactsProps {
  sessionId: string;
}

export function DialogArtifacts(props: DialogArtifactsProps) {
  const dialog = useDialog();
  const sdk = useSDK();
  const sync = useSync();

  const [artifacts] = createResource(
    () => props.sessionId,
    async (sessionId) => {
      const appName = sync.data.currentApp;
      if (!appName) return [];

      try {
        return await sdk.client.listArtifacts(
          appName,
          sync.data.userId,
          sessionId
        );
      } catch (error) {
        console.error("Failed to list artifacts:", error);
        return [];
      }
    }
  );

  const options = createMemo((): DialogSelectOption<string>[] => {
    const artifactList = artifacts() ?? [];

    if (artifactList.length === 0 && !artifacts.loading) {
      return [
        {
          title: "No artifacts",
          value: "",
          description: "This session has no artifacts",
          disabled: true,
        },
      ];
    }

    return artifactList.map((name) => ({
      title: name,
      value: name,
      category: "Artifacts",
    }));
  });

  const handleSelect = (option: DialogSelectOption<string>) => {
    if (!option.value || option.disabled) return;
    dialog.replace(() => (
      <ArtifactViewer
        artifactName={option.value}
        sessionId={props.sessionId}
      />
    ));
  };

  return (
    <DialogSelect
      title={artifacts.loading ? "Loading artifacts..." : "Artifacts"}
      placeholder="Search artifacts..."
      options={options()}
      onSelect={handleSelect}
    />
  );
}
