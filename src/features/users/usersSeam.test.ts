// The Users seam + mock pin the field-minimisation and the reason-required contract at the data layer
// (the DPO red lines, Decisions.md D16): the minimised detail carries no sensitive fields; the full record
// carries the synthetic profile + context-note PRESENCE only (never the body); the note body is a SEPARATE
// gated function; and both gated reads refuse an empty reason. A regression here weakens the privacy
// boundary in the layer that the screens depend on.

import { describe, it, expect } from "vitest";

import {
  getMockUserDetail,
  getMockUserFullRecord,
  getMockContextNote,
} from "@/lib/mock/users";
import { adminApi } from "@/lib/admin-api/client";

describe("mock/users detail (minimised, synthetic)", () => {
  it("getMockUserDetail returns the minimised summary, with no sensitive fields", () => {
    const detail = getMockUserDetail("u-0001");
    expect(detail).not.toBeNull();
    // Minimised fields only.
    expect(Object.keys(detail ?? {}).sort()).toEqual(
      ["displayName", "email", "id", "joined", "planTier", "recipientCount", "status"].sort(),
    );
    // None of the sensitive record fields leak onto the summary.
    expect(detail).not.toHaveProperty("recipients");
    expect(detail).not.toHaveProperty("contextNotePresent");
  });

  it("returns null for an unknown id", () => {
    expect(getMockUserDetail("nope")).toBeNull();
  });
});

describe("mock/users full record (the higher-privilege reveal)", () => {
  it("carries the synthetic profile + context-note PRESENCE only, never the note body", () => {
    const record = getMockUserFullRecord("u-0001");
    expect(record).not.toBeNull();
    expect(typeof record?.contextNotePresent).toBe("boolean");
    // Presence is a boolean; the note text is NOT anywhere on the record object.
    expect(JSON.stringify(record)).not.toContain("Synthetic context note");
    // The synthetic recipient profile is structured codes, an LCI number, an alert level.
    const first = record?.recipients[0];
    expect(first?.supportLevelCode).toMatch(/^SL-/);
    expect(first?.tagCodes.every((t) => t.startsWith("TAG-"))).toBe(true);
    expect(typeof first?.lci).toBe("number");
    expect(["none", "watch", "concern", "action"]).toContain(first?.alertLevel);
  });
});

describe("mock/users context note (the separate, further-gated reveal)", () => {
  it("getMockContextNote returns synthetic text where a note is present, null otherwise", () => {
    expect(getMockContextNote("u-0001")).toMatch(/Synthetic context note/);
    // u-0002 has contextNotePresent=false, so no body.
    expect(getMockContextNote("u-0002")).toBeNull();
  });
});

describe("adminApi reason-required gating (belt-and-braces at the seam)", () => {
  it("getUserFullRecord rejects an empty / whitespace reason", async () => {
    await expect(adminApi.getUserFullRecord("u-0001", "")).rejects.toThrow(/reason/i);
    await expect(adminApi.getUserFullRecord("u-0001", "   ")).rejects.toThrow(/reason/i);
  });

  it("getContextNote rejects an empty / whitespace reason", async () => {
    await expect(adminApi.getContextNote("u-0001", "")).rejects.toThrow(/reason/i);
    await expect(adminApi.getContextNote("u-0001", "  ")).rejects.toThrow(/reason/i);
  });

  it("returns the data once a non-empty reason is given", async () => {
    const record = await adminApi.getUserFullRecord("u-0001", "TICKET-1");
    expect(record?.summary.id).toBe("u-0001");
    const note = await adminApi.getContextNote("u-0001", "TICKET-1");
    expect(note).toMatch(/Synthetic context note/);
  });
});
