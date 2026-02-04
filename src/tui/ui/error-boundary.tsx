import {
  createSignal,
  onError,
  Show,
  type JSX,
  type ParentProps,
} from "solid-js";
import { useTheme } from "../context/theme";

export interface ErrorBoundaryProps extends ParentProps {
  fallback?: (error: Error, reset: () => void) => JSX.Element;
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  const [error, setError] = createSignal<Error | null>(null);

  onError((err) => {
    console.error("ErrorBoundary caught error:", err);
    setError(err instanceof Error ? err : new Error(String(err)));
  });

  const reset = () => {
    setError(null);
  };

  return (
    <Show
      when={!error()}
      fallback={
        props.fallback ? (
          props.fallback(error()!, reset)
        ) : (
          <DefaultErrorFallback error={error()!} reset={reset} />
        )
      }
    >
      {props.children}
    </Show>
  );
}

interface DefaultErrorFallbackProps {
  error: Error;
  reset: () => void;
}

function DefaultErrorFallback(props: DefaultErrorFallbackProps) {
  const { theme } = useTheme();

  return (
    <box
      flexDirection="column"
      padding={2}
      border={["top", "left", "right", "bottom"]}
      borderColor={theme.error}
      backgroundColor={theme.backgroundPanel}
    >
      <text fg={theme.error} bold marginBottom={1}>
        Something went wrong
      </text>
      <text fg={theme.text} marginBottom={1}>
        {props.error.message}
      </text>
      <Show when={props.error.stack}>
        <box
          marginTop={1}
          marginBottom={1}
          paddingLeft={1}
          border={["left"]}
          borderColor={theme.border}
        >
          <text fg={theme.textMuted}>
            {props.error.stack
              ?.split("\n")
              .slice(0, 5)
              .join("\n")}
          </text>
        </box>
      </Show>
      <box
        marginTop={1}
        paddingLeft={2}
        paddingRight={2}
        backgroundColor={theme.primary}
        onMouseUp={props.reset}
      >
        <text fg={theme.selectedListItemText}>Try Again</text>
      </box>
    </box>
  );
}
