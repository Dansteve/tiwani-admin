"use client";

// The System Health screen: an operational status surface (infrastructure status + diagnostics). It mirrors
// the dashboard / reporting screens: it reads through the admin-api seam (src/lib/admin-api/client.ts) via
// TanStack Query, so the seam is exercised now; the client currently delegates to the MOCK adapter (synthetic
// states, no real telemetry; Decisions.md D16). The live form is the audited admin-api's `/system/health`
// aggregation; when it lands, only the client body changes, not this screen.
//
// It is READ-ONLY and visible to all staff roles (no write-gating): it carries no family-user data, only
// infrastructure status. Status is ALWAYS colour + label + dot, never colour alone (the accessibility rule):
// the overall roll-up is a labelled Badge with a leading icon, each service card is a brand-token dot + the
// label word + the detail, and the diagnostics cell is a dot + the label word. The (admin) layout renders the
// mock/live banner, so it is not repeated here.

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, XCircle, type LucideIcon } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import type { OverallHealth } from "@/lib/mock/system";
import {
  overallStatusToken,
  diagnosticStatusToken,
} from "@/features/system/statusTokens";
import { ServiceStatusCard } from "@/features/system/ServiceStatusCard";
import { StatusDot } from "@/features/system/StatusDot";

/** The leading icon for the overall badge (icon, so the Badge is colour + label + icon, not colour alone). */
const OVERALL_ICON: Record<OverallHealth, LucideIcon> = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  down: XCircle,
};

function OverallBadge({ overall }: { overall: OverallHealth }) {
  const token = overallStatusToken(overall);
  const Icon = OVERALL_ICON[overall];
  return (
    <Badge variant={token.variant} className="px-3 py-1 text-sm">
      <Icon aria-hidden="true" />
      {token.label}
    </Badge>
  );
}

export function SystemHealthScreen() {
  const health = useQuery({
    queryKey: ["system-health"],
    queryFn: () => adminApi.getSystemHealth(),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">System Health</h1>
          <p className="text-sm text-muted-foreground">
            Infrastructure status and diagnostics. Synthetic states, for layout and review only.
          </p>
        </div>
        {health.data ? <OverallBadge overall={health.data.overall} /> : null}
      </header>

      {health.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Could not load system health"
          description="The status endpoint is not available right now. Switch the data source back to mock, or try again."
        />
      ) : health.isLoading ? (
        // A calm skeleton row of placeholder cards so the page does not jump when the data lands.
        <section aria-label="Service status" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse p-5" aria-hidden="true" />
          ))}
        </section>
      ) : (
        <>
          {/* Service cards: 1 column on phones, 2 from sm, 3 from lg (mirrors the KPI-card grid). */}
          <section
            aria-label="Service status"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {(health.data?.services ?? []).map((service) => (
              <ServiceStatusCard key={service.name} service={service} />
            ))}
          </section>

          {/* Diagnostics: a semantic table (Check / Status / Detail), the status cell a dot + label word. */}
          <section aria-label="Diagnostics" className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Diagnostics</h2>
            <Card className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Check</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(health.data?.diagnostics ?? []).map((row) => {
                    const token = diagnosticStatusToken(row.status);
                    return (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                        <TableCell>
                          <StatusDot dotClass={token.dotClass} label={token.label} />
                        </TableCell>
                        <TableCell className="whitespace-normal text-muted-foreground">
                          {row.detail}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
