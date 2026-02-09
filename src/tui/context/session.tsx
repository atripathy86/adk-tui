import { createContext, useContext, createResource, JSX } from "solid-js";
import { useSDK } from "./sdk";
import { useSync, useSyncActions } from "./sync";
import type { Session, Event, Content, Part } from "../../sdk/types";

const DEBUG = process.env.ADK_TUI_DEBUG === "1";
function log(msg: string) {
  if (!DEBUG) return;
  const { appendFileSync } = require("fs");
  appendFileSync("/tmp/adk-tui-debug.log", `[Session] ${msg}\n`);
}

interface SessionContextValue {
  // Current session getter
  current: () => Session | null;
  // Session list
  list: () => Session[];
  // Loading state
  loading: () => boolean;
  // Actions
  create: () => Promise<Session | null>;
  switch: (sessionId: string) => Promise<void>;
  delete: (sessionId: string) => Promise<void>;
  refresh: () => Promise<void>;
  // Message sending
  sendMessage: (text: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>();

export function SessionProvider(props: { children: JSX.Element }) {
  const sdk = useSDK();
  const syncState = useSync();
  const sync = useSyncActions();

  // Fetch sessions when app changes
  const [sessionsResource, { refetch }] = createResource(
    () => syncState.data.currentApp,
    async (appName) => {
      if (!appName) return [];
      try {
        const sessions = await sdk.client.listSessions(
          appName,
          syncState.data.userId
        );
        sync.setSessions(sessions);
        return sessions;
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        return [];
      }
    }
  );

  /**
   * Merge parts from a new event into an accumulator event.
   * This consolidates streaming chunks from the same author into one message.
   */
  function mergeParts(accumulated: Part[], incoming: Part[]): Part[] {
    const result = [...accumulated];
    for (const part of incoming) {
      if (part.text !== undefined) {
        // Find the last text part and append, or add new
        const lastTextIdx = result.findLastIndex((p) => p.text !== undefined && !p.functionCall && !p.functionResponse);
        if (lastTextIdx >= 0) {
          result[lastTextIdx] = { ...result[lastTextIdx], text: (result[lastTextIdx].text ?? "") + part.text };
        } else {
          result.push(part);
        }
      } else {
        // Non-text parts (functionCall, functionResponse, etc.) are added directly
        result.push(part);
      }
    }
    return result;
  }

  /**
   * Send via SSE streaming. Consolidates events from the same author
   * into a single message, accumulating text parts.
   *
   * Uses a dedicated streaming signal for live updates (bypasses store
   * array reactivity issues). Only commits to the store when an author
   * group is finalized or the stream ends.
   */
  async function sendStreaming(sessionId: string, request: any) {
    let displayId = `stream-${sessionId}-${Date.now()}`;
    let currentAuthor: string | null = null;
    let accumulatedParts: Part[] = [];
    let lastEvent: Event | null = null;

    for await (const event of sdk.client.runSSE(request)) {
      const author = event.author;
      const eventParts = event.content?.parts ?? [];

      log(`SSE event id=${event.id} author=${author} partial=${event.partial} turnComplete=${event.turnComplete} parts=${JSON.stringify(eventParts.map(p => ({ text: p.text?.slice(0, 80), fc: p.functionCall?.name, fr: p.functionResponse?.name })))}`);

      if (author !== currentAuthor) {
        // Author changed — commit the previous group to the store
        if (currentAuthor !== null) {
          const finalizedEvent: Event = {
            id: displayId,
            author: currentAuthor,
            invocationId: "",
            timestamp: Date.now() / 1000,
            content: { parts: accumulatedParts },
            partial: false,
            actions: { stateDelta: {}, artifactDelta: {} },
          };
          sync.setStreamingEvent(sessionId, null);
          sync.addMessage(sessionId, finalizedEvent);
          displayId = `stream-${sessionId}-${Date.now()}`;
        }
        currentAuthor = author;
        accumulatedParts = [...eventParts];
      } else if (event.partial === true) {
        // Streaming delta — accumulate into the current message
        accumulatedParts = mergeParts(accumulatedParts, eventParts);
      } else {
        // Complete event (partial=false or undefined) — finalize this segment.
        // Its parts supersede accumulated parts of the same type.
        const hasText = eventParts.some(p => p.text !== undefined);
        const hasFc = eventParts.some(p => p.functionCall);

        let result = accumulatedParts.filter(p => {
          if (hasText && p.text !== undefined) return false;
          if (hasFc && p.functionCall) return false;
          return true;
        });
        result.push(...eventParts);
        accumulatedParts = result;
      }

      lastEvent = event;

      // Update the streaming signal (direct signal, no store array)
      const displayEvent: Event = {
        ...event,
        id: displayId,
        content: {
          ...event.content,
          parts: accumulatedParts,
        },
        partial: true,
      };
      sync.setStreamingEvent(sessionId, displayEvent);

      // Yield to the event loop so the renderer can paint between events
      await new Promise(resolve => setTimeout(resolve, 0));

      if (event.turnComplete) {
        // Commit final message to store and clear streaming signal
        sync.setStreamingEvent(sessionId, null);
        sync.addMessage(sessionId, { ...displayEvent, partial: false });
        sync.setSessionStatus(sessionId, { type: "idle" });
      }
    }

    // Stream ended — commit the final message to the store
    if (lastEvent && currentAuthor) {
      const finalEvent: Event = {
        ...lastEvent,
        id: displayId,
        author: currentAuthor,
        content: { ...lastEvent.content, parts: accumulatedParts },
        partial: false,
      };
      sync.setStreamingEvent(sessionId, null);
      sync.addMessage(sessionId, finalEvent);
    }

    sync.setSessionStatus(sessionId, { type: "idle" });
  }

  /**
   * Send via non-streaming /run endpoint.
   * All events arrive at once — add them all to the message list.
   */
  async function sendNonStreaming(sessionId: string, request: any) {
    const events = await sdk.client.run({ ...request, streaming: false });
    for (const event of events) {
      sync.updateMessage(sessionId, event);
    }
    sync.setSessionStatus(sessionId, { type: "idle" });
  }

  function handleSendError(sessionId: string, error: unknown) {
    console.error("Failed to send message:", error);
    sync.setSessionStatus(sessionId, {
      type: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const value: SessionContextValue = {
    current() {
      const sessionId = syncState.data.currentSessionId;
      if (!sessionId) return null;
      return (
        syncState.data.sessions.find((s) => s.id === sessionId) ?? null
      );
    },

    list() {
      return syncState.data.sessions;
    },

    loading() {
      return sessionsResource.loading;
    },

    async create() {
      const appName = syncState.data.currentApp;
      if (!appName) {
        console.error("No app selected");
        return null;
      }

      try {
        const session = await sdk.client.createSession(
          appName,
          syncState.data.userId
        );
        sync.addSession(session);
        sync.setCurrentSession(session.id);
        sync.setMessages(session.id, session.events || []);
        sync.setSessionStatus(session.id, { type: "idle" });
        return session;
      } catch (error) {
        console.error("Failed to create session:", error);
        return null;
      }
    },

    async switch(sessionId: string) {
      const appName = syncState.data.currentApp;
      if (!appName) return;

      try {
        // Fetch full session details including events
        const session = await sdk.client.getSession(
          appName,
          syncState.data.userId,
          sessionId
        );

        // Update session in list
        sync.setSessions(
          syncState.data.sessions.map((s) =>
            s.id === sessionId ? session : s
          )
        );

        // Set as current and load messages
        sync.setCurrentSession(sessionId);
        sync.setMessages(sessionId, session.events || []);

        if (!syncState.data.sessionStatus[sessionId]) {
          sync.setSessionStatus(sessionId, { type: "idle" });
        }
      } catch (error) {
        console.error("Failed to switch session:", error);
      }
    },

    async delete(sessionId: string) {
      const appName = syncState.data.currentApp;
      if (!appName) return;

      try {
        await sdk.client.deleteSession(
          appName,
          syncState.data.userId,
          sessionId
        );
        sync.removeSession(sessionId);
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    },

    async refresh() {
      await refetch();
    },

    async sendMessage(text: string) {
      const appName = syncState.data.currentApp;
      let sessionId = syncState.data.currentSessionId;
      const useStreaming = syncState.data.config.streaming;

      if (!appName) {
        console.error("No app selected");
        return;
      }

      // Create session if none exists
      if (!sessionId) {
        const session = await value.create();
        if (!session) return;
        sessionId = session.id;
      }

      // Create user message event
      const userEvent: Event = {
        id: `user-${Date.now()}`,
        author: "user",
        invocationId: "",
        timestamp: Date.now() / 1000,
        content: {
          parts: [{ text }],
          role: "user",
        },
        actions: {
          stateDelta: {},
          artifactDelta: {},
        },
      };

      // Add user message immediately
      sync.addMessage(sessionId, userEvent);
      sync.setSessionStatus(sessionId, { type: "busy" });

      const request = {
        appName,
        userId: syncState.data.userId,
        sessionId,
        newMessage: {
          parts: [{ text }],
          role: "user",
        } as Content,
        streaming: useStreaming,
      };

      if (useStreaming) {
        try {
          await sendStreaming(sessionId, request);
        } catch (sseError) {
          // Fallback to non-streaming if SSE fails
          console.error("SSE failed, falling back to non-streaming:", sseError);
          try {
            await sendNonStreaming(sessionId, request);
          } catch (error) {
            handleSendError(sessionId, error);
          }
        }
      } else {
        try {
          await sendNonStreaming(sessionId, request);
        } catch (error) {
          handleSendError(sessionId, error);
        }
      }
    },
  };

  return (
    <SessionContext.Provider value={value}>
      {props.children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
