import { createMemo } from "solid-js";
import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select";
import { useDialog } from "../ui/dialog";
import { useSession } from "../context/session";
import { useSync } from "../context/sync";
import { useKeybind } from "../context/keybind";

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Older than 7 days - show date
  return date.toLocaleDateString();
}

function getSessionTitle(events: any[]): string {
  // Try to get the first user message as title
  const firstUserEvent = events.find(
    (e) => e.author === "user" && e.content?.parts?.[0]?.text
  );

  if (firstUserEvent?.content?.parts?.[0]?.text) {
    const text = firstUserEvent.content.parts[0].text;
    return text.length > 50 ? text.slice(0, 50) + "..." : text;
  }

  return "New Session";
}

export function DialogSessionList() {
  const dialog = useDialog();
  const session = useSession();
  const sync = useSync();
  const keybind = useKeybind();

  const options = createMemo((): DialogSelectOption<string>[] => {
    const sessions = sync.data.sessions;

    if (sessions.length === 0) {
      return [
        {
          title: "No sessions yet",
          value: "",
          description: "Start a new conversation",
          disabled: true,
        },
      ];
    }

    // Sort by last update time, newest first
    const sorted = [...sessions].sort(
      (a, b) => b.lastUpdateTime - a.lastUpdateTime
    );

    return sorted.map((s) => ({
      title: getSessionTitle(s.events),
      value: s.id,
      description: s.id.slice(0, 8),
      footer: formatTimestamp(s.lastUpdateTime),
      category: formatTimestamp(s.lastUpdateTime).includes("ago")
        ? "Recent"
        : "Older",
    }));
  });

  const handleSelect = async (option: DialogSelectOption<string>) => {
    if (!option.value || option.disabled) return;
    await session.switch(option.value);
    dialog.clear();
  };

  const handleDelete = async (option: DialogSelectOption<string>) => {
    if (!option.value || option.disabled) return;
    await session.delete(option.value);
    // Refresh the dialog
  };

  return (
    <DialogSelect
      title="Sessions"
      placeholder="Search sessions..."
      options={options()}
      current={sync.data.currentSessionId ?? undefined}
      onSelect={handleSelect}
      keybind={[
        {
          keybind: keybind.all.session_delete?.[0] ?? {
            name: "d",
            ctrl: false,
            meta: false,
            shift: false,
            super: false,
            leader: true,
          },
          title: "delete",
          onTrigger: handleDelete,
        },
      ]}
    />
  );
}
