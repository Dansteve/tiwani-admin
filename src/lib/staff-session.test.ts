// The stub staff session (Decisions.md D16). These pin the encode/decode round-trip (the middleware and
// the sign-in flow rely on a cookie value that decodes back to a valid session) and that a missing /
// garbage cookie decodes to null (so the gate treats it as "no session"). The cookie NAME is asserted
// distinct, because the red line is a SEPARATE auth audience from the family app.

import { describe, it, expect } from "vitest";

import {
  STAFF_SESSION_COOKIE,
  STUB_STAFF,
  encodeStaffSession,
  decodeStaffSession,
} from "@/lib/staff-session";

describe("staff-session", () => {
  it("uses a cookie name distinct from the family app (a separate auth audience)", () => {
    expect(STAFF_SESSION_COOKIE).toBe("tiwani_staff_session");
    // It must not be a generic / family-shared session name.
    expect(STAFF_SESSION_COOKIE).not.toBe("session");
    expect(STAFF_SESSION_COOKIE).not.toMatch(/supabase/i);
  });

  it("round-trips a session through encode -> decode", () => {
    const encoded = encodeStaffSession(STUB_STAFF);
    expect(typeof encoded).toBe("string");
    expect(decodeStaffSession(encoded)).toEqual(STUB_STAFF);
  });

  it("decodes a missing or garbage cookie to null (the gate reads it as no session)", () => {
    expect(decodeStaffSession(undefined)).toBeNull();
    expect(decodeStaffSession(null)).toBeNull();
    expect(decodeStaffSession("")).toBeNull();
    expect(decodeStaffSession("not-base64-or-json")).toBeNull();
  });

  it("decodes to null when a required field is missing", () => {
    const partial = Buffer.from(JSON.stringify({ staffId: "x" }), "utf8").toString("base64");
    expect(decodeStaffSession(partial)).toBeNull();
  });

  it("ships an obviously synthetic stub identity (not a real account)", () => {
    expect(STUB_STAFF.email).toMatch(/\.internal$/);
    expect(STUB_STAFF.name).toMatch(/stub/i);
  });
});
