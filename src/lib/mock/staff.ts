// MOCK DATA, pre-production. NOT real staff records. Replaced by the audited tiwani-admin-api (D16)
// behind the launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test).
//
// Synthetic staff members for the Settings "staff list" (a read-only view). The real list comes from the
// staff_member table resolved by the admin-api; this is the stand-in so the screen and the role Badges
// render end-to-end. The FIRST row is the bootstrap super admin (SUPER_ADMIN_EMAIL, the founder's real
// address, intended): it is the sole operator for now. Every OTHER row is obviously synthetic (a demo name
// + an internal .internal email, the same convention as STUB_STAFF) so no one mistakes it for a real
// account. Roles come from the rbac.ts StaffRole set.

import { SUPER_ADMIN_EMAIL, type StaffRole } from "@/lib/rbac";

/** A single synthetic staff member (the read-only Settings list). */
export interface StaffMember {
  id: string;
  /** A synthetic display name. Obviously fake. */
  name: string;
  /** A synthetic internal email. */
  email: string;
  /** The staff role (drives the role Badge + maps to the rbac.ts grant set). */
  role: StaffRole;
}

const MOCK_STAFF: StaffMember[] = [
  {
    id: "staff-super-0001",
    name: "Dansteve (super admin)",
    email: SUPER_ADMIN_EMAIL,
    role: "super_admin",
  },
  {
    id: "staff-0001",
    name: "Demo Admin (stub)",
    email: "demo.admin@tiwani.internal",
    role: "role_admin",
  },
  {
    id: "staff-0002",
    name: "Demo Support (stub)",
    email: "demo.support@tiwani.internal",
    role: "support_read",
  },
  {
    id: "staff-0003",
    name: "Demo Rights Handler (stub)",
    email: "demo.rights@tiwani.internal",
    role: "dsar_handler",
  },
  {
    id: "staff-0004",
    name: "Demo Support Two (stub)",
    email: "demo.support2@tiwani.internal",
    role: "support_read",
  },
];

/** Return the synthetic staff list (read-only). */
export function getMockStaff(): StaffMember[] {
  return MOCK_STAFF;
}
