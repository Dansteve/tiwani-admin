// Display metadata for the staff roles and capabilities, kept in ONE place so the account card, the staff
// list, and the capability matrix all label them identically. This is presentation only: the source of
// truth for what a role can DO is rbac.ts (STAFF_ROLES, the Capability set, can() / capabilitiesFor()).
// Nothing here grants anything; it only maps a role / capability key to a human label and a Badge variant.

import type { ComponentProps } from "react";

import type { Badge } from "@/components/ui/badge";
import type { Capability, StaffRole } from "@/lib/rbac";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

/** A role's human label + the Badge variant it renders with (brand-token variants only). */
export const ROLE_DISPLAY: Record<StaffRole, { label: string; variant: BadgeVariant }> = {
  support_read: { label: "Support (read-only)", variant: "secondary" },
  dsar_handler: { label: "Rights handler", variant: "warning" },
  role_admin: { label: "Role admin", variant: "default" },
};

/**
 * The full Capability set, in a fixed display order, paired with a short human label. The keys are the
 * SAME Capability union from rbac.ts (a compile error here if rbac.ts adds or renames one), so the matrix
 * iterates this list and resolves each cell with can(role, capability). One entry per capability, no
 * more and no less, is asserted by a test against capabilitiesFor across all roles.
 */
export const CAPABILITY_DISPLAY: { key: Capability; label: string }[] = [
  { key: "users.read_minimised", label: "Read minimised user view" },
  { key: "users.read_full", label: "Read full user record" },
  { key: "content.read", label: "Read content" },
  { key: "content.write", label: "Write content" },
  { key: "reporting.read", label: "Read reporting" },
  { key: "waitlist.read", label: "Read waitlist" },
  { key: "waitlist.manage", label: "Manage waitlist" },
  { key: "dsar.handle", label: "Handle DSAR / erasure" },
  { key: "staff.manage", label: "Manage staff" },
  { key: "roles.manage", label: "Manage roles" },
];
