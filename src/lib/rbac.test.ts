// The RBAC scaffold is the default-deny capability allowlist (Decisions.md D16). These pin the load-
// bearing behaviour: a capability is granted ONLY when a role's grant set positively lists it, and
// EVERYTHING else fails closed (unknown role, missing grant, null/undefined). They also pin the role
// separation (no single role both reads sensitive records AND grants access), which is the security
// property the map encodes.

import { describe, it, expect } from "vitest";

import {
  can,
  parseRole,
  capabilitiesFor,
  STAFF_ROLES,
  type Capability,
  type StaffRole,
} from "@/lib/rbac";

const ALL_CAPABILITIES: Capability[] = [
  "users.read_minimised",
  "users.read_full",
  "content.read",
  "content.write",
  "reporting.read",
  "waitlist.read",
  "waitlist.manage",
  "dsar.handle",
  "staff.manage",
  "roles.manage",
];

// The expected grant truth table, written out independently of the implementation so a change to the
// map must be a deliberate change here too.
const EXPECTED: Record<StaffRole, Capability[]> = {
  support_read: ["users.read_minimised", "content.read", "reporting.read", "waitlist.read"],
  dsar_handler: [
    "users.read_minimised",
    "users.read_full",
    "dsar.handle",
    "reporting.read",
    "waitlist.read",
  ],
  role_admin: [
    "content.read",
    "content.write",
    "reporting.read",
    "waitlist.read",
    "waitlist.manage",
    "staff.manage",
    "roles.manage",
  ],
};

describe("rbac.can (default-deny allowlist)", () => {
  it("grants exactly the allowlisted capabilities per role, and denies every other", () => {
    for (const role of STAFF_ROLES) {
      const granted = new Set(EXPECTED[role]);
      for (const capability of ALL_CAPABILITIES) {
        expect(can(role, capability)).toBe(granted.has(capability));
      }
    }
  });

  it("fails closed for an unknown / missing role", () => {
    // A value that is not a StaffRole, plus null and undefined: all deny everything.
    for (const capability of ALL_CAPABILITIES) {
      expect(can("not_a_role" as StaffRole, capability)).toBe(false);
      expect(can(null, capability)).toBe(false);
      expect(can(undefined, capability)).toBe(false);
    }
  });

  it("has no wildcard: role_admin cannot read sensitive user records", () => {
    // role_admin administers access; it must NOT read records (the role-separation red-line).
    expect(can("role_admin", "users.read_minimised")).toBe(false);
    expect(can("role_admin", "users.read_full")).toBe(false);
    expect(can("role_admin", "dsar.handle")).toBe(false);
  });

  it("enforces role separation: no record-reading role can manage staff or roles", () => {
    // support_read and dsar_handler read records; neither may grant access.
    for (const role of ["support_read", "dsar_handler"] as StaffRole[]) {
      expect(can(role, "staff.manage")).toBe(false);
      expect(can(role, "roles.manage")).toBe(false);
    }
  });

  it("keeps the full sensitive record off the read-only support role", () => {
    expect(can("support_read", "users.read_minimised")).toBe(true);
    expect(can("support_read", "users.read_full")).toBe(false);
  });
});

describe("rbac.parseRole", () => {
  it("accepts the three known roles", () => {
    expect(parseRole("support_read")).toBe("support_read");
    expect(parseRole("dsar_handler")).toBe("dsar_handler");
    expect(parseRole("role_admin")).toBe("role_admin");
  });

  it("returns null for anything else (so an unknown role is treated as no role)", () => {
    expect(parseRole("admin")).toBeNull();
    expect(parseRole("")).toBeNull();
    expect(parseRole(null)).toBeNull();
    expect(parseRole(undefined)).toBeNull();
  });
});

describe("rbac.capabilitiesFor", () => {
  it("lists a role's granted capabilities and an empty list for an unknown role", () => {
    expect(new Set(capabilitiesFor("support_read"))).toEqual(new Set(EXPECTED.support_read));
    expect(capabilitiesFor(null)).toEqual([]);
    expect(capabilitiesFor("nope" as StaffRole)).toEqual([]);
  });
});
