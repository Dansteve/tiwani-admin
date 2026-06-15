"use client";

// The always-visible data-source banner + the MOCK <-> LIVE toggle (the demo control), rendered once in
// the (admin) layout so it sits on every page. It is MODE-AWARE (reads useDataSource):
//   - "mock" (the default): the honest "this is not real data" warning, on the --warning token. The whole
//     admin foundation runs against the mock data layer (Decisions.md D16: no real user data until the
//     launch gates clear), so every screen carries this label.
//   - "live": a distinct "Live API" indicator on the calm --primary (teal) token, NOT the warning colour,
//     so the two modes are unmistakable at a glance (colour + an icon + the title text, never colour alone).
//
// The toggle is GATED: only a role with `can(role, "roles.manage")` (super_admin / role_admin) can switch
// to LIVE; a lower role sees the mock banner with no live switch. This matters MORE once the audited
// admin-api carries real data (the D16 gate): switching the source is then a privileged act. Today live
// reaches only the admin-api skeleton (/health), so a live read of a data endpoint surfaces a clean empty
// state + a toast; nothing real is exposed.

import { FlaskConical, Radio } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDataSource } from "@/state/DataSourceProvider";
import { useStaffRole } from "@/lib/use-staff-session";
import { can, type StaffRole } from "@/lib/rbac";
import type { DataMode } from "@/lib/admin-api/mode";

/** The two modes, in display order, with the label + icon the toggle and banner share. */
const MODE_OPTION: Record<DataMode, { label: string }> = {
  mock: { label: "Mock" },
  live: { label: "Live" },
};

const MODES: readonly DataMode[] = ["mock", "live"];

/**
 * The segmented MOCK / LIVE control. A radiogroup (arrow-key operable, the selected state announced), with
 * 44px-floor targets, colour + label, and an aria-label. Resolves to the brand tokens only.
 */
function DataSourceToggle() {
  const { mode, setMode } = useDataSource();

  return (
    <div
      role="radiogroup"
      aria-label="Data source"
      className="inline-flex gap-1 rounded-lg border border-border bg-secondary p-1"
    >
      {MODES.map((value) => {
        const selected = mode === value;
        const { label } = MODE_OPTION[value];
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setMode(value)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// `role` is an optional OVERRIDE (a test can pin the role directly). When omitted, the role is resolved
// CLIENT-side from the staff session cookie via useStaffRole() (the layout no longer reads cookies()
// server-side, so the (admin) tree is static-exportable). The hook reads first, the prop overrides it.
export function PreProductionBanner({ role }: { role?: StaffRole | null }) {
  const { mode } = useDataSource();
  const resolvedRole = useStaffRole();
  const effectiveRole = role === undefined ? resolvedRole : role;
  // Only a roles.manage role (super_admin / role_admin) may flip to live (fail-closed: an unknown / lower
  // role gets no switch). The frontend gate only decides what to SHOW; real enforcement is the admin-api.
  const canSwitch = can(effectiveRole, "roles.manage");

  if (mode === "live") {
    return (
      <Alert variant="default" className="mb-6 border-primary/40 bg-primary/10 text-foreground">
        <Radio aria-hidden="true" className="text-primary" />
        <AlertTitle className="text-primary">Live API</AlertTitle>
        <AlertDescription>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-foreground/90">
              Reading from the live admin service. Only /health exists today, so the data screens show an
              empty state until the audited admin-api endpoints land. Switch back to Mock for the synthetic
              demo data.
            </p>
            {canSwitch && (
              <div className="shrink-0">
                <span className="sr-only">Data source</span>
                <DataSourceToggle />
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning" className="mb-6">
      <FlaskConical aria-hidden="true" />
      <AlertTitle>Pre-production preview, mock data</AlertTitle>
      <AlertDescription>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-warning/90">
            Every figure here is synthetic. Admin is not connected to real user data. The audited admin
            service and its access gates (key rotation, DPIA, MFA, audit log, pen test) land before any
            real data is shown.
          </p>
          {canSwitch && (
            <div className="shrink-0">
              <span className="sr-only">Data source</span>
              <DataSourceToggle />
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
