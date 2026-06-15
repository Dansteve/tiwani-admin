// The stub staff session (Decisions.md D16). These pin the encode/decode round-trip (the middleware and
// the sign-in flow rely on a cookie value that decodes back to a valid session) and that a missing /
// garbage cookie decodes to null (so the gate treats it as "no session"). The cookie NAME is asserted
// distinct, because the red line is a SEPARATE auth audience from the family app.

import { describe, it, expect, afterEach } from "vitest";

import {
  STAFF_SESSION_COOKIE,
  STUB_STAFF,
  encodeStaffSession,
  decodeStaffSession,
  readStaffSessionFromDocument,
  writeStaffSessionToDocument,
  clearStaffSessionFromDocument,
} from "@/lib/staff-session";
import { SUPER_ADMIN_EMAIL } from "@/lib/rbac";

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

  it("ships the bootstrap super-admin identity (the sole operator, for now)", () => {
    // The stub is no longer a generic demo row: it is the bootstrap super admin (rbac.ts SUPER_ADMIN_EMAIL).
    // It is STILL a placeholder session (no real auth); this only pins WHICH identity it stands in for.
    expect(STUB_STAFF.role).toBe("super_admin");
    expect(STUB_STAFF.email).toBe(SUPER_ADMIN_EMAIL);
    expect(STUB_STAFF.name).toMatch(/super admin/i);
  });
});

// The CLIENT cookie helpers: the static-export sign-in path writes the session cookie in the browser (no
// server action under output: "export") and the client gate / role hook read it back. These pin the
// document.cookie round-trip and the absent / clear cases (jsdom provides document.cookie).
describe("staff-session: client cookie helpers (static-export path)", () => {
  afterEach(() => {
    // Clear the cookie between tests so one case does not leak into the next.
    clearStaffSessionFromDocument();
  });

  it("round-trips the session through document.cookie (write -> read)", () => {
    writeStaffSessionToDocument(STUB_STAFF);
    // The cookie is present under the separate-audience name.
    expect(document.cookie).toContain(`${STAFF_SESSION_COOKIE}=`);
    // And reads back to the same identity (the value reuses the one encode/decode codec).
    expect(readStaffSessionFromDocument()).toEqual(STUB_STAFF);
  });

  it("reads null when no session cookie is set (the gate treats it as no session)", () => {
    clearStaffSessionFromDocument();
    expect(readStaffSessionFromDocument()).toBeNull();
  });

  it("clears the session cookie (the sign-out path)", () => {
    writeStaffSessionToDocument(STUB_STAFF);
    expect(readStaffSessionFromDocument()).not.toBeNull();
    clearStaffSessionFromDocument();
    expect(readStaffSessionFromDocument()).toBeNull();
  });
});
