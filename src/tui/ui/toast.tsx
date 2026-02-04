import {
  createContext,
  useContext,
  createSignal,
  Show,
  onCleanup,
  type JSX,
  type ParentProps,
} from "solid-js";
import { useTheme } from "../context/theme";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  variant: ToastVariant;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string | Error, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue>();

export function ToastProvider(props: ParentProps) {
  const { theme } = useTheme();
  const [currentToast, setCurrentToast] = createSignal<ToastOptions | null>(
    null
  );
  let timeoutId: NodeJS.Timeout | null = null;

  function clearTimeout() {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function show(options: ToastOptions) {
    clearTimeout();
    setCurrentToast(options);

    const duration = options.duration ?? 3000;
    if (duration > 0) {
      timeoutId = globalThis.setTimeout(() => {
        setCurrentToast(null);
      }, duration);
    }
  }

  function dismiss() {
    clearTimeout();
    setCurrentToast(null);
  }

  onCleanup(() => {
    clearTimeout();
  });

  const value: ToastContextValue = {
    show,
    dismiss,
    success(message: string, title?: string) {
      show({ variant: "success", message, title });
    },
    error(message: string | Error, title?: string) {
      const msg = message instanceof Error ? message.message : message;
      show({ variant: "error", message: msg, title: title ?? "Error" });
    },
    warning(message: string, title?: string) {
      show({ variant: "warning", message, title });
    },
    info(message: string, title?: string) {
      show({ variant: "info", message, title });
    },
  };

  const getVariantColor = (variant: ToastVariant) => {
    switch (variant) {
      case "success":
        return theme.success;
      case "error":
        return theme.error;
      case "warning":
        return theme.warning;
      case "info":
        return theme.primary;
    }
  };

  const getVariantIcon = (variant: ToastVariant) => {
    switch (variant) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
    }
  };

  return (
    <ToastContext.Provider value={value}>
      <box flexDirection="column" width="100%" height="100%">
        {props.children}

        <Show when={currentToast()}>
          {(toast) => (
            <box
              position="absolute"
              bottom={1}
              right={1}
              flexDirection="row"
              gap={1}
              paddingLeft={2}
              paddingRight={2}
              paddingTop={1}
              paddingBottom={1}
              backgroundColor={theme.backgroundPanel}
              border={["top", "left", "right", "bottom"]}
              borderColor={getVariantColor(toast().variant)}
              maxWidth={60}
              onMouseUp={dismiss}
            >
              <text fg={getVariantColor(toast().variant)}>
                {getVariantIcon(toast().variant)}
              </text>
              <box flexDirection="column">
                <Show when={toast().title}>
                  <text fg={getVariantColor(toast().variant)} bold>
                    {toast().title}
                  </text>
                </Show>
                <text fg={theme.text}>{toast().message}</text>
              </box>
            </box>
          )}
        </Show>
      </box>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
