import { createContext, useContext, createResource, JSX } from "solid-js";
import { useSDK } from "./sdk";
import { useSync, useSyncActions } from "./sync";
import type { Session, Event, Content } from "../../sdk/types";

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

      try {
        // Use streaming endpoint
        const request = {
          appName,
          userId: syncState.data.userId,
          sessionId,
          newMessage: {
            parts: [{ text }],
            role: "user",
          } as Content,
          streaming: true,
        };

        // Stream responses
        for await (const event of sdk.client.runSSE(request)) {
          sync.updateMessage(sessionId, event);

          // Check if turn is complete
          if (event.turnComplete) {
            sync.setSessionStatus(sessionId, { type: "idle" });
          }
        }

        sync.setSessionStatus(sessionId, { type: "idle" });
      } catch (error) {
        console.error("Failed to send message:", error);
        sync.setSessionStatus(sessionId, {
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
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
