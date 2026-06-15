"use client";

import { FlaskConical } from "lucide-react";

import { STAFF_ROLES, type StaffRole } from "@/lib/rbac";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// The "Preview as role" control (pre-production stub). There is NO real staff auth in this app yet
// (Decisions.md D16), so the board cannot log in as different roles to see how the affordances change.
// This control fakes that, ONLY for the demo: it changes the role the Users subtree evaluates `can()`
// against, so the reviewer can watch the "Reveal full record" affordance appear for dsar_handler and
// vanish for support_read. It is UNMISTAKABLY labelled a stub: it is NOT a privilege grant, it grants no
// real access (the frontend holds no data and no service-role key), and it is replaced by the real
// validated staff role from the admin-api before this app ever touches real data.

/** Friendly labels for the role options (the raw role keys are shown too, so the mapping is explicit). */
const ROLE_LABEL: Record<StaffRole, string> = {
  support_read: "support_read (read-only support)",
  dsar_handler: "dsar_handler (data-rights, can reveal)",
  role_admin: "role_admin (access admin, no record reads)",
};

export function RolePreview({
  role,
  onRoleChange,
}: {
  role: StaffRole;
  onRoleChange: (role: StaffRole) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-4">
      <div className="flex items-center gap-2">
        <FlaskConical aria-hidden="true" className="size-4 shrink-0 text-warning" />
        <span className="text-sm font-semibold text-foreground">
          Preview as role (pre-production stub)
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Not a real privilege. This only changes which affordances are shown so you can see the access
        model. Real role enforcement lives in the audited admin service.
      </p>
      <div className="flex flex-col gap-1.5 sm:max-w-sm">
        <Label htmlFor="role-preview">Viewing as</Label>
        <Select value={role} onValueChange={(value) => onRoleChange(value as StaffRole)}>
          <SelectTrigger id="role-preview" aria-label="Preview as role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAFF_ROLES.map((option) => (
              <SelectItem key={option} value={option}>
                {ROLE_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
