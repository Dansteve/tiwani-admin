// =============================================================================================
// STAFF SESSION (STUB, pre-production). NOT real authentication.
//
// Decisions.md D16: staff identity is a SEPARATE, DISTINCT auth audience from the family Supabase
// Auth. A family JWT and a staff JWT sharing one issuer is one token-confusion bug away from crossing
// the product's most important boundary, so the two MUST NOT share an issuer, a token, or a cookie.
//
// THIS FILE IS A PLACEHOLDER. It sets and reads a plain session cookie so the middleware gate and the
// sign-in / sign-out flow are wired end-to-end against a MOCK staff session. It does NO real auth:
//   - any credentials "succeed" (the sign-in form is non-functional, a shell).
//   - there is NO password check, NO IdP, NO MFA, NO token validation, NO signature.
//
// It is REPLACED, before this app touches one row of real data, by the real separate staff IdP (a
// distinct Supabase project OR WorkOS / Clerk) with ENFORCED MFA (AAL2) at the IdP, validated by the
// audited tiwani-admin-api's `get_current_staff` dependency (a SIBLING of, never a flag on, the family
// `get_current_user`). The launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test) are
// owner-tracked (admin-track/Backlog.md) and HARD-BLOCK pointing this app at real user data.
// =============================================================================================

import { SUPER_ADMIN_EMAIL, type StaffRole } from "@/lib/rbac";

/** The stub session cookie name. Deliberately distinct from any family-app cookie (separate audience). */
export const STAFF_SESSION_COOKIE = "tiwani_staff_session";

/** The minimal stub session payload. The real session carries a validated, MFA-asserted staff identity. */
export interface StaffSession {
  /** A synthetic staff identifier. Obviously fake in the stub. */
  staffId: string;
  /** The display name shown in the shell. */
  name: string;
  /** The synthetic staff email. */
  email: string;
  /**
   * The stub role. Real role resolution comes from the `staff_member` row + its grants, resolved by the
   * admin-api. Wired here so the RBAC shape exists end-to-end; NOT a real authorization decision.
   */
  role: StaffRole;
}

/**
 * The single stub staff identity every "sign-in" resolves to: the bootstrap super admin (the sole platform
 * operator FOR NOW, SUPER_ADMIN_EMAIL in rbac.ts). The role is `super_admin` so the RBAC scaffold threads a
 * concrete, full-capability role through the back office while the team is one person. This is STILL a stub
 * (no password check, no IdP, no MFA, no token validation, as the header note says): it only fixes WHICH
 * identity the placeholder session represents. Real, MFA-asserted staff identity comes from the separate
 * staff IdP + the audited admin-api (D16); nothing real until the launch gates clear.
 */
export const STUB_STAFF: StaffSession = {
  staffId: "stub-super-admin-0001",
  name: "Dansteve (super admin)",
  email: SUPER_ADMIN_EMAIL,
  role: "super_admin",
};

/**
 * Encode the stub session for the cookie value. base64(JSON), NOT a signed/encrypted token: this is a
 * placeholder, not a security boundary. The real session is a validated IdP token, never a self-made blob.
 */
export function encodeStaffSession(session: StaffSession): string {
  const json = JSON.stringify(session);
  // btoa exists in the edge/runtime and the browser; Buffer is the Node fallback for tests.
  if (typeof btoa === "function") return btoa(json);
  return Buffer.from(json, "utf8").toString("base64");
}

/** Decode a stub session cookie value, or null if it is absent / unparseable. */
export function decodeStaffSession(value: string | undefined | null): StaffSession | null {
  if (!value) return null;
  try {
    const json =
      typeof atob === "function"
        ? atob(value)
        : Buffer.from(value, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Partial<StaffSession>;
    if (
      typeof parsed.staffId === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.role === "string"
    ) {
      return parsed as StaffSession;
    }
    return null;
  } catch {
    return null;
  }
}
