// =============================================================================================
// RBAC SCAFFOLD: a default-deny capability allowlist (Decisions.md D16, admin-track Backlog A0.2).
//
// Modeled on the family api's entitlement gate (tiwani-api app/services/entitlements.py), which is an
// ALLOWLIST that FAILS CLOSED: a capability is granted ONLY if it is positively listed for the role.
// An unknown role, a role with no grant for the capability, or an unknown capability all resolve to
// DENY. There is no blocklist (a forgotten blocklist entry would silently grant access), and there is no
// "admin can do everything" wildcard (role_admin's grants are enumerated, so a new capability is denied
// to everyone until it is deliberately added).
//
// SCOPE OF THIS FILE: the SHAPE only. This is the client-side scaffold so the roles + capabilities + the
// fail-closed `can()` exist and are tested. It is NOT the security boundary: real enforcement lives in
// the audited tiwani-admin-api (every privileged read is a default-deny, reason-required, audit-logged
// RPC), per D16. The frontend never holds the service-role key and never reads real data; this `can()`
// only decides which affordances to SHOW. The role-separation rule (no single role both reads records
// AND grants access) is reflected in the grant map below and pinned by a test.
// =============================================================================================

/**
 * The staff roles (admin-track Backlog A0.2). The three operational roles are deliberately separated so
 * no single one both reads sensitive records AND administers access (strict separation of duties):
 *   - support_read   read-only, field-minimised support views (the least-privilege default).
 *   - dsar_handler   data-rights handling (DSAR / erasure workflows), reason-required + maker-checker.
 *   - role_admin     administers staff + roles; does NOT read sensitive user records.
 *   - super_admin    the bootstrap platform owner (see SUPER_ADMIN_EMAIL). For now, while TIWANI is a
 *                    sole-operator, this role CONSOLIDATES every duty (it is the one exception to the
 *                    separation above). It is a "for now" arrangement, NOT the target end-state.
 */
export type StaffRole = "support_read" | "dsar_handler" | "role_admin" | "super_admin";

/** The full set of roles, for iteration / validation. */
export const STAFF_ROLES: readonly StaffRole[] = [
  "super_admin",
  "support_read",
  "dsar_handler",
  "role_admin",
];

/**
 * The bootstrap super-admin email: the sole platform operator (the founder) FOR NOW. The `super_admin`
 * role is granted to this identity while the team is one person, so duties are consolidated rather than
 * split. This is a pre-production constant: real staff identity comes from the separate staff IdP and the
 * audited admin-api (D16), and the accountability controls (reason-required, audit-before-data,
 * search-first) STILL apply to this role. Separating duties across multiple staff is the target once the
 * team grows, and that split must be reviewed with the DPO before this app ever touches real data.
 */
export const SUPER_ADMIN_EMAIL = "dansteveadekanbi@gmail.com";

/**
 * The capabilities a staff action can require. Enumerable and falsifiable (never a vague "advanced"),
 * mirroring the entitlement-key discipline. Each is a named, auditable operation:
 *   - users.read_minimised          field-minimised support view (account status, plan/subscription).
 *   - users.read_full               the FULL sensitive record (Card content, context_note, LCI, alerts):
 *                                   a HIGHER-privilege, reason-required, separately-logged read (D16).
 *   - content.read / content.write  the Strategy Library / governed-copy content surface.
 *   - reporting.read                aggregate, non-identifying platform metrics (the dashboard).
 *   - waitlist.read / waitlist.manage   the lowest-sensitivity surface (E1).
 *   - dsar.handle                   run a DSAR / erasure workflow (the audited account.py wrapper).
 *   - staff.manage / roles.manage   administer staff members and their role grants.
 */
export type Capability =
  | "users.read_minimised"
  | "users.read_full"
  | "content.read"
  | "content.write"
  | "reporting.read"
  | "waitlist.read"
  | "waitlist.manage"
  | "dsar.handle"
  | "staff.manage"
  | "roles.manage";

/**
 * The ALLOWLIST: the capabilities POSITIVELY granted to each role. Anything not listed is denied (fail
 * closed). Note the role separation, pinned by a test:
 *   - support_read reads minimised views + reads (not writes) content + reads waitlist; it CANNOT read
 *     the full sensitive record, handle DSARs, or manage staff/roles.
 *   - dsar_handler reads minimised + reads full (with reason, enforced server-side) + handles DSARs; it
 *     does NOT manage staff/roles or write content.
 *   - role_admin manages staff + roles + content + reads reporting; it does NOT read sensitive user
 *     records (no users.read_full, no users.read_minimised), so "grants access" and "reads records" are
 *     never the same role.
 *   - super_admin is the bootstrap sole-operator (SUPER_ADMIN_EMAIL): it holds EVERY capability, the one
 *     deliberate exception to "no role both reads records AND grants access". It exists because the team
 *     is one person FOR NOW; it does NOT relax the accountability controls. The same default-deny,
 *     reason-required, audit-before-data, search-first discipline still binds it (a super_admin record
 *     read is still a reason-bound, logged action, never a standing un-audited population browse). The
 *     target is to SPLIT these duties across separate staff as the team grows, reviewed with the DPO
 *     before any real data. A test EXEMPTS super_admin from the disjointness check (and explains why),
 *     while still asserting the strict separation for the other three.
 */
const GRANTS: Record<StaffRole, ReadonlySet<Capability>> = {
  // The bootstrap owner: every capability, consolidated, while TIWANI is sole-operator (see the note
  // above and SUPER_ADMIN_EMAIL). Enumerated, not a wildcard, so a NEW capability is still denied to it
  // until deliberately added here too (the fail-closed discipline holds even for super_admin).
  super_admin: new Set<Capability>([
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
  ]),
  support_read: new Set<Capability>([
    "users.read_minimised",
    "content.read",
    "reporting.read",
    "waitlist.read",
  ]),
  dsar_handler: new Set<Capability>([
    "users.read_minimised",
    "users.read_full",
    "dsar.handle",
    "reporting.read",
    "waitlist.read",
  ]),
  role_admin: new Set<Capability>([
    "content.read",
    "content.write",
    "reporting.read",
    "waitlist.read",
    "waitlist.manage",
    "staff.manage",
    "roles.manage",
  ]),
};

/** Narrow an arbitrary string to a known role, or null (so an unknown role is treated as no role). */
export function parseRole(value: string | null | undefined): StaffRole | null {
  return value === "support_read" ||
    value === "dsar_handler" ||
    value === "role_admin" ||
    value === "super_admin"
    ? value
    : null;
}

/**
 * The gate: true ONLY when `role` is positively granted `capability`. Fails closed on everything else:
 *   - an unknown / missing role (the value is not a StaffRole)  -> false.
 *   - a known role with no grant for the capability             -> false.
 * There is no wildcard and no blocklist; a capability is denied until a role's grant set lists it.
 */
export function can(role: StaffRole | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  const grants = GRANTS[role];
  if (!grants) return false;
  return grants.has(capability);
}

/** The capabilities granted to a role, as a new array (empty for an unknown role). For display / debug. */
export function capabilitiesFor(role: StaffRole | null | undefined): Capability[] {
  if (!role) return [];
  const grants = GRANTS[role];
  return grants ? Array.from(grants) : [];
}
