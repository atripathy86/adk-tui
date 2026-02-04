import { useKeyboard } from "@opentui/solid";
import { useTheme } from "../context/theme";
import { useDialog, type DialogContext } from "./dialog";

export interface DialogAlertProps {
  title: string;
  message: string;
  onConfirm?: () => void;
}

export function DialogAlert(props: DialogAlertProps) {
  const { theme } = useTheme();
  const dialog = useDialog();

  useKeyboard((evt) => {
    if (evt.name === "return" || evt.name === "escape") {
      evt.preventDefault();
      dialog.clear();
      props.onConfirm?.();
    }
  });

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
      <text fg={theme.primary} bold marginBottom={1}>
        {props.title}
      </text>
      <text fg={theme.text} marginBottom={2}>
        {props.message}
      </text>
      <box flexDirection="row" justifyContent="flex-end">
        <text fg={theme.textMuted}>
          Press <span style={{ fg: theme.text }}>Enter</span> to dismiss
        </text>
      </box>
    </box>
  );
}

// Static helper for promise-based usage
DialogAlert.show = (
  dialog: DialogContext,
  title: string,
  message: string
): Promise<void> => {
  return new Promise<void>((resolve) => {
    dialog.replace(
      () => (
        <DialogAlert
          title={title}
          message={message}
          onConfirm={() => resolve()}
        />
      ),
      () => resolve()
    );
  });
};
