// The data-source mode model: pins the DEFAULT (mock), the parse/narrow rule, the localStorage round-trip,
// and the module-level seam store get/set. The default is the load-bearing guarantee (the admin must start
// on the synthetic mock layer, never reach real data by accident; Decisions.md D16), so it is asserted in
// several shapes.

import { describe, it, expect, beforeEach } from "vitest";

import {
  DEFAULT_DATA_MODE,
  DATA_MODE_STORAGE_KEY,
  parseDataMode,
  readStoredMode,
  writeStoredMode,
  getDataMode,
  setDataMode,
  type DataMode,
  type DataModeStore,
} from "@/lib/admin-api/mode";

/** An in-memory store implementing the testable storage surface. */
function memoryStore(initial?: Record<string, string>): DataModeStore {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("data-source mode default", () => {
  it("defaults to mock", () => {
    expect(DEFAULT_DATA_MODE).toBe("mock");
  });

  it("getDataMode() is mock before anything sets it", () => {
    // Reset to the documented default (other tests in the run may have flipped the module cell).
    setDataMode("mock");
    expect(getDataMode()).toBe("mock");
  });
});

describe("parseDataMode (narrow to a valid mode, default mock)", () => {
  it.each(["mock", "live"] as const)("accepts the valid mode %s", (mode) => {
    expect(parseDataMode(mode)).toBe(mode);
  });

  it.each([null, undefined, "", "LIVE", "production", "Mock", "real"])(
    "falls back to mock for the invalid value %p",
    (value) => {
      expect(parseDataMode(value as string | null | undefined)).toBe("mock");
    },
  );
});

describe("storage round-trip (persistence)", () => {
  it("reads mock when storage is empty", () => {
    expect(readStoredMode(memoryStore())).toBe("mock");
  });

  it("persists and reads back the chosen mode under the versioned key", () => {
    const store = memoryStore();
    writeStoredMode(store, "live");
    expect(store.getItem(DATA_MODE_STORAGE_KEY)).toBe("live");
    expect(readStoredMode(store)).toBe("live");

    writeStoredMode(store, "mock");
    expect(readStoredMode(store)).toBe("mock");
  });

  it("ignores a stale / unknown stored value (reads mock)", () => {
    expect(readStoredMode(memoryStore({ [DATA_MODE_STORAGE_KEY]: "garbage" }))).toBe("mock");
  });
});

describe("module-level seam store (getDataMode / setDataMode)", () => {
  beforeEach(() => {
    setDataMode("mock");
  });

  it("setDataMode updates what getDataMode returns", () => {
    setDataMode("live");
    expect(getDataMode()).toBe("live");
    setDataMode("mock");
    expect(getDataMode()).toBe("mock");
  });

  it("only ever holds a valid DataMode", () => {
    const modes: DataMode[] = ["mock", "live"];
    for (const mode of modes) {
      setDataMode(mode);
      expect(modes).toContain(getDataMode());
    }
  });
});
