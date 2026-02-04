import { createStore, produce } from "solid-js/store";
import { createSimpleContext } from "../../context/helper";

export type PromptInfo = {
  input: string;
};

const MAX_HISTORY_ENTRIES = 50;

export const { use: usePromptHistory, provider: PromptHistoryProvider } = createSimpleContext({
  name: "PromptHistory",
  init: () => {
    const [store, setStore] = createStore({
      index: 0,
      history: [] as PromptInfo[],
    });

    return {
      move(direction: 1 | -1, currentInput: string) {
        if (!store.history.length) return undefined;

        const current = store.history.at(store.index);
        if (!current) return undefined;

        // Don't navigate if user has typed something different
        if (current.input !== currentInput && currentInput.length) return undefined;

        setStore(
          produce((draft) => {
            const next = store.index + direction;
            if (Math.abs(next) > store.history.length) return;
            if (next > 0) return;
            draft.index = next;
          })
        );

        if (store.index === 0) {
          return { input: "" };
        }

        return store.history.at(store.index);
      },

      append(item: PromptInfo) {
        if (!item.input.trim()) return;

        setStore(
          produce((draft) => {
            // Don't add duplicates
            const last = draft.history.at(-1);
            if (last?.input === item.input) {
              draft.index = 0;
              return;
            }

            draft.history.push({ input: item.input });

            if (draft.history.length > MAX_HISTORY_ENTRIES) {
              draft.history = draft.history.slice(-MAX_HISTORY_ENTRIES);
            }

            draft.index = 0;
          })
        );
      },

      list() {
        return store.history;
      },

      reset() {
        setStore("index", 0);
      },
    };
  },
});
