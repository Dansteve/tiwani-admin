import { Check, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { can, STAFF_ROLES, type Capability, type StaffRole } from "@/lib/rbac";
import { CAPABILITY_DISPLAY, ROLE_DISPLAY } from "@/features/settings/roleDisplay";

// The capability matrix: a grid of roles x capabilities that makes the default-deny RBAC visible to the
// board. Every cell is computed DIRECTLY from rbac.ts via can(role, capability), so it cannot drift from
// the real allowlist (a test asserts each rendered cell equals can() for that pair). Capabilities come
// from CAPABILITY_DISPLAY (the same Capability union as rbac.ts) and roles from STAFF_ROLES.
//
// Each cell is colour + icon + screen-reader text, never colour alone (accessibility): a granted cell is
// the --success token + a check + "Granted"; a denied cell is muted + a dash + "Not granted". The cell's
// title also names it for a pointer hover.

function CapabilityCell({ role, capability }: { role: StaffRole; capability: Capability }) {
  const granted = can(role, capability);
  const roleLabel = ROLE_DISPLAY[role].label;
  const text = granted ? "Granted" : "Not granted";

  return (
    <td
      data-slot="table-cell"
      data-granted={granted}
      className="px-3 py-2.5 text-center align-middle"
    >
      <span
        className={
          granted
            ? "inline-flex size-6 items-center justify-center rounded-full bg-success/15 text-success"
            : "inline-flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
        title={`${roleLabel}: ${text}`}
      >
        {granted ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Minus className="size-4" aria-hidden="true" />
        )}
        <span className="sr-only">{text}</span>
      </span>
    </td>
  );
}

export function CapabilityMatrix({ roles = STAFF_ROLES }: { roles?: readonly StaffRole[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Capability matrix</CardTitle>
        <CardDescription className="text-base">
          What each role can do. Generated directly from the access rules (a default-deny allowlist):
          a check is a granted capability, a dash is denied. The audited admin service enforces these
          server-side (Decisions.md D16).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">Capability</TableHead>
                {roles.map((role) => (
                  <TableHead key={role} className="text-center">
                    {ROLE_DISPLAY[role].label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAPABILITY_DISPLAY.map(({ key, label }) => (
                <TableRow key={key}>
                  <TableCell className="font-medium text-foreground">
                    <span className="flex flex-col">
                      <span>{label}</span>
                      <span className="text-xs font-normal text-muted-foreground">{key}</span>
                    </span>
                  </TableCell>
                  {roles.map((role) => (
                    <CapabilityCell key={role} role={role} capability={key} />
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
