import { createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useTheme } from "../context/theme";
import { useDialog, type DialogContext } from "./dialog";

export interface DialogConfirmProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function DialogConfirm(props: DialogConfirmProps) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const [selected, setSelected] = createSignal<"confirm" | "cancel">("confirm");

  useKeyboard((evt) => {
    if (evt.name === "left" || evt.name === "h") {
      evt.preventDefault();
      setSelected("confirm");
    } else if (evt.name === "right" || evt.name === "l") {
      evt.preventDefault();
      setSelected("cancel");
    } else if (evt.name === "tab") {
      evt.preventDefault();
      setSelected((s) => (s === "confirm" ? "cancel" : "confirm"));
    } else if (evt.name === "return") {
      evt.preventDefault();
      dialog.clear();
      if (selected() === "confirm") {
        props.onConfirm?.();
      } else {
        props.onCancel?.();
      }
    } else if (evt.name === "escape") {
      evt.preventDefault();
      dialog.clear();
      props.onCancel?.();
    } else if (evt.name === "y") {
      evt.preventDefault();
      dialog.clear();
      props.onConfirm?.();
    } else if (evt.name === "n") {
      evt.preventDefault();
      dialog.clear();
      props.onCancel?.();
    }
  });

  const confirmText = () => props.confirmText ?? "Yes";
  const cancelText = () => props.cancelText ?? "No";

  return (
    <box
      flexDirection="column"
      border={["top", "left", "right", "bottom"]}
      borderColor={theme.border}
      backgroundColor={theme.backgroundPanel}
      padding={2}
      minWidth={40}
      maxWidth={60}
    >
      <text fg={theme.warning} bold marginBottom={1}>
        {props.title}
      </text>
      <text fg={theme.text} marginBottom={2}>
        {props.message}
      </text>
      <box flexDirection="row" justifyContent="flex-end" gap={2}>
        <box
          paddingLeft={2}
          paddingRight={2}
          backgroundColor={
            selected() === "confirm" ? theme.primary : theme.backgroundElement
          }
          onMouseUp={() => {
            dialog.clear();
            props.onConfirm?.();
          }}
        >
          <text
            fg={
              selected() === "confirm"
                ? theme.selectedListItemText
                : theme.text
            }
          >
            {confirmText()}
          </text>
        </box>
        <box
          paddingLeft={2}
          paddingRight={2}
          backgroundColor={
            selected() === "cancel" ? theme.primary : theme.backgroundElement
          }
          onMouseUp={() => {
            dialog.clear();
            props.onCancel?.();
          }}
        >
          <text
            fg={
              selected() === "cancel" ? theme.selectedListItemText : theme.text
            }
          >
            {cancelText()}
          </text>
        </box>
      </box>
    </box>
  );
}

// Static helper for promise-based usage
DialogConfirm.show = (
  dialog: DialogContext,
  title: string,
  message: string
): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    dialog.replace(
      () => (
        <DialogConfirm
          title={title}
          message={message}
          onConfirm={() => resolve(true)}
          onCancel={() => resolve(false)}
        />
      ),
      () => resolve(false)
    );
  });
};
