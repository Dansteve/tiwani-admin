"use client";

// The runtime owner of the data-source mode (the MOCK <-> LIVE demo toggle). It mirrors ThemeProvider:
// it reads the stored choice on mount, keeps the module-level seam store (lib/admin-api/mode.ts) in sync,
// and persists every change to localStorage. The pure model lives in lib/admin-api/mode.ts; this is only
// the React lifecycle around it.
//
// The seam (lib/admin-api/client.ts) is a plain object, so it reads the mode through getDataMode(), not
// through this context. This provider is the thing that keeps getDataMode() current: on mount it pushes
// the stored value into setDataMode, and setMode here writes localStorage + setDataMode + the React state.
//
// On a mode flip it also invalidates the TanStack Query cache, so every screen REFETCHES through the seam
// under the new mode (otherwise the cache would keep serving the old source). This provider therefore
// sits INSIDE QueryProvider (it uses useQueryClient).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  DEFAULT_DATA_MODE,
  localDataModeStore,
  readStoredMode,
  setDataMode,
  writeStoredMode,
  type DataMode,
} from "@/lib/admin-api/mode";

interface DataSourceContextValue {
  /** The data source currently read from: "mock" (default) or "live". */
  mode: DataMode;
  /** Change the source; persists, updates the seam store, and refetches every query under the new mode. */
  setMode: (mode: DataMode) => void;
}

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Start from the "mock" default for a stable first render that matches the server-rendered HTML
  // (reading storage during render would diverge between the no-op SSR store and the real client value,
  // a hydration mismatch). The mount effect below corrects it to the stored value.
  const [mode, setModeState] = useState<DataMode>(DEFAULT_DATA_MODE);

  // On mount: hydrate the stored mode and push it into the seam store so the client reads the right
  // source. Reading storage here (not during render) keeps the server and first client render identical.
  // The seam-store write is synchronous (the client reads the right source immediately); the React state
  // commit is deferred to the next frame so the effect does not trigger a render-then-rerender cascade
  // (mirrors ThemeProvider). The default already renders mock, so there is no visible flash.
  useEffect(() => {
    const stored = readStoredMode(localDataModeStore());
    setDataMode(stored);
    const frame = requestAnimationFrame(() => setModeState(stored));
    return () => cancelAnimationFrame(frame);
  }, []);

  const setMode = useCallback(
    (next: DataMode) => {
      writeStoredMode(localDataModeStore(), next);
      setDataMode(next);
      setModeState(next);
      // Refetch every query through the seam under the new source (the cache holds the old source's data).
      void queryClient.invalidateQueries();
    },
    [queryClient],
  );

  return (
    <DataSourceContext.Provider value={{ mode, setMode }}>
      {children}
    </DataSourceContext.Provider>
  );
}

/** Read the data-source controller. Throws if used outside DataSourceProvider (a wiring bug, surfaced loudly). */
export function useDataSource(): DataSourceContextValue {
  const ctx = useContext(DataSourceContext);
  if (!ctx) throw new Error("useDataSource must be used within a DataSourceProvider");
  return ctx;
}
