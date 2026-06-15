// The data-source mode: the pure, framework-agnostic model for the MOCK <-> LIVE toggle (the demo
// control). It mirrors features/theme/theme.ts: the preference type, the resolve/parse rule, and a
// testable storage surface live here once, with no React and no framework.
//
// Why a module-level current-mode CELL as well as the localStorage helpers: the admin-api client
// (lib/admin-api/client.ts) is a plain object, not a React hook, so it cannot read the provider's
// context. The cell below is the bridge: the DataSourceProvider keeps it in sync (its setMode calls
// setDataMode + writes localStorage), and the client reads it via getDataMode() at call time. The
// default is "mock", so a non-browser render, a first paint, and the seam all start on the mock data
// (Decisions.md D16: live reaches only the admin-api skeleton today, no real user data).

/** The data source the admin reads from. "mock" is the clearly-labeled synthetic layer (the default). */
export type DataMode = "mock" | "live";

/** The default the app starts on everywhere: the mock data layer (no real data, D16). */
export const DEFAULT_DATA_MODE: DataMode = "mock";

// Versioned key: bump the version if the stored shape ever changes so a stale value is ignored.
export const DATA_MODE_STORAGE_KEY = "tiwani.admin.datasource.v1";

/** Narrow an arbitrary stored string to a valid mode, falling back to the default ("mock"). */
export function parseDataMode(value: string | null | undefined): DataMode {
  return value === "mock" || value === "live" ? value : DEFAULT_DATA_MODE;
}

/** The minimal storage surface used here (the subset of localStorage we need), so the logic is testable. */
export interface DataModeStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Read the stored mode (returns the default when absent or unreadable). */
export function readStoredMode(store: DataModeStore): DataMode {
  return parseDataMode(store.getItem(DATA_MODE_STORAGE_KEY));
}

/** Persist the mode; idempotent and best-effort. */
export function writeStoredMode(store: DataModeStore, mode: DataMode): void {
  store.setItem(DATA_MODE_STORAGE_KEY, mode);
}

/**
 * The durable localStorage, or a no-op store when there is no window (SSR / tests without jsdom) or
 * storage is unavailable (private mode, quota, a SecurityError). Keeps the mode logic working without
 * guarding `typeof window` at each call site; a failed read simply reports the default.
 */
export function localDataModeStore(): DataModeStore {
  if (typeof window === "undefined") {
    return { getItem: () => null, setItem: () => {} };
  }
  try {
    const ls = window.localStorage;
    return {
      getItem: (key) => {
        try {
          return ls.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          ls.setItem(key, value);
        } catch {
          // Best-effort: if we cannot persist, the choice is lost on reload, which is harmless.
        }
      },
    };
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}

// The module-level current mode the seam reads. Starts on the default; the provider hydrates it from
// localStorage on mount and updates it on every toggle. It is a plain cell (not React state) precisely
// because the client object that consumes it is not a component.
let currentMode: DataMode = DEFAULT_DATA_MODE;

/** The mode the seam should read RIGHT NOW. Defaults to "mock" until the provider hydrates it. */
export function getDataMode(): DataMode {
  return currentMode;
}

/** Set the current mode the seam reads. The DataSourceProvider calls this from its setMode (and on mount). */
export function setDataMode(mode: DataMode): void {
  currentMode = mode;
}
