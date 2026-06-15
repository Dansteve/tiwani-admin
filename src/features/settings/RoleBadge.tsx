import { Badge } from "@/components/ui/badge";
import type { StaffRole } from "@/lib/rbac";
import { ROLE_DISPLAY } from "@/features/settings/roleDisplay";

// The staff-role pill. ONE place every role is shown (the account card, the staff list, the matrix
// header), so a role always reads the same. It is a Badge (it carries the role label as text), so colour
// is never the only signal. Variants come from ROLE_DISPLAY, which maps to brand-token Badge variants.

export function RoleBadge({ role }: { role: StaffRole }) {
  const display = ROLE_DISPLAY[role];
  return <Badge variant={display.variant}>{display.label}</Badge>;
}
