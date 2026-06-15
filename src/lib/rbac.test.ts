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
  // super_admin is the bootstrap sole-operator: it holds EVERY capability (see rbac.ts SUPER_ADMIN_EMAIL).
  super_admin: [...ALL_CAPABILITIES],
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

// The three OPERATIONAL roles, on which strict separation of duties is asserted. super_admin is the
// deliberate bootstrap exception (it consolidates every duty while the team is one person), so it is
// excluded here; a separate test pins that super_admin holds everything.
const OPERATIONAL_ROLES: StaffRole[] = ["support_read", "dsar_handler", "role_admin"];

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

  it("enforces role separation: no record-reading OPERATIONAL role can manage staff or roles", () => {
    // support_read and dsar_handler read records; neither may grant access. super_admin is intentionally
    // EXCLUDED (it is the bootstrap exception, asserted to hold both below), so the strict separation is
    // pinned only for the operational roles.
    for (const role of ["support_read", "dsar_handler"] as StaffRole[]) {
      expect(can(role, "staff.manage")).toBe(false);
      expect(can(role, "roles.manage")).toBe(false);
    }
  });

  it("keeps reads-records and grants-access disjoint across the THREE operational roles", () => {
    // The security property the map encodes for the operational roles: a role that can read any record
    // (minimised or full) must NOT also grant access, and vice versa. Pinned over OPERATIONAL_ROLES only;
    // super_admin is the documented bootstrap exception and is exempt.
    const READS: Capability[] = ["users.read_minimised", "users.read_full", "dsar.handle"];
    const GRANTS_ACCESS: Capability[] = ["staff.manage", "roles.manage"];
    for (const role of OPERATIONAL_ROLES) {
      const reads = READS.some((c) => can(role, c));
      const grantsAccess = GRANTS_ACCESS.some((c) => can(role, c));
      // Never both at once.
      expect(reads && grantsAccess).toBe(false);
    }
  });

  it("keeps the full sensitive record off the read-only support role", () => {
    expect(can("support_read", "users.read_minimised")).toBe(true);
    expect(can("support_read", "users.read_full")).toBe(false);
  });

  it("grants super_admin EVERY capability (the bootstrap sole-operator exception)", () => {
    // super_admin consolidates every duty while the team is one person (rbac.ts SUPER_ADMIN_EMAIL). It is
    // the ONE role allowed to both read records AND grant access; the accountability controls (reason,
    // audit-before-data, search-first) still bind it, they just are not expressed in this capability map.
    for (const capability of ALL_CAPABILITIES) {
      expect(can("super_admin", capability)).toBe(true);
    }
    // Concretely: it both reads records and grants access (the consolidation the other roles forbid).
    expect(can("super_admin", "users.read_full")).toBe(true);
    expect(can("super_admin", "roles.manage")).toBe(true);
  });
});

describe("rbac.parseRole", () => {
  it("accepts the four known roles", () => {
    expect(parseRole("super_admin")).toBe("super_admin");
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
