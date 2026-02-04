import { createContext, useContext, createSignal, JSX } from "solid-js";

export type Route =
  | { type: "home" }
  | { type: "session"; sessionId: string };

interface RouteContextValue {
  current: () => Route;
  navigate: (route: Route) => void;
  goHome: () => void;
  goToSession: (sessionId: string) => void;
}

const RouteContext = createContext<RouteContextValue>();

export function RouteProvider(props: { children: JSX.Element }) {
  const [route, setRoute] = createSignal<Route>({ type: "home" });

  const value: RouteContextValue = {
    current() {
      return route();
    },

    navigate(newRoute: Route) {
      setRoute(newRoute);
    },

    goHome() {
      setRoute({ type: "home" });
    },

    goToSession(sessionId: string) {
      setRoute({ type: "session", sessionId });
    },
  };

  return (
    <RouteContext.Provider value={value}>
      {props.children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useRoute must be used within RouteProvider");
  return ctx;
}

// Helper to get typed route data
export function useRouteData<T extends Route["type"]>(
  type: T
): Extract<Route, { type: T }> | null {
  const route = useRoute();
  const current = route.current();
  if (current.type === type) {
    return current as Extract<Route, { type: T }>;
  }
  return null;
}
