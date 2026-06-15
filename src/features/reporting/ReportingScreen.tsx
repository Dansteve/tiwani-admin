"use client";

// The Reporting screen: AGGREGATE-ONLY platform analytics (Decisions.md D16, README red line 9; the DPO
// hard constraint). It shows platform health as non-identifying figures ONLY: KPI totals, then four
// charts of counts over time / by bucket. There is deliberately NO table of individuals, NO drill-to-user,
// NO row-level export, NO PII anywhere on this screen.
//
// HOW AGGREGATE-ONLY IS GUARANTEED: this screen reads ONLY the aggregate seam methods, which return count
// shapes ({ label, value } / { tier, accounts } / { week, count }) that carry NO id, name, or email. It
// never imports or calls the row-level lists (getUsers / getWaitlist / getContent). So there is no code
// path here that could render an individual, and the always-visible note states it plainly. Everything
// runs through the admin-api seam (mock today, an audited aggregate RPC tomorrow); the screen renders only
// what the seam returns and recomputes nothing.

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KpiCard } from "@/features/dashboard/KpiCard";
import { SignupTrendChart } from "@/features/dashboard/SignupTrendChart";
import { PlanDistributionChart } from "@/features/reporting/PlanDistributionChart";
import { ContentByTypeChart } from "@/features/reporting/ContentByTypeChart";
import { ActiveUsersChart } from "@/features/reporting/ActiveUsersChart";

export function ReportingScreen() {
  const metrics = useQuery({
    queryKey: ["reporting-metrics"],
    queryFn: () => adminApi.getMetrics(),
  });
  const signupTrend = useQuery({
    queryKey: ["reporting-signup-trend"],
    queryFn: () => adminApi.getSignupTrend(),
  });
  const planDistribution = useQuery({
    queryKey: ["reporting-plan-distribution"],
    queryFn: () => adminApi.getPlanDistribution(),
  });
  const contentCounts = useQuery({
    queryKey: ["reporting-content-counts"],
    queryFn: () => adminApi.getContentCounts(),
  });
  const activeUsers = useQuery({
    queryKey: ["reporting-active-users"],
    queryFn: () => adminApi.getActiveUsersTrend(),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Reporting</h1>
        <p className="text-sm text-muted-foreground">
          Platform health at a glance. Aggregate, non-identifying figures, for layout and review only.
        </p>
      </header>

      {/* The aggregate-only red line, stated on the screen so it is impossible to miss. */}
      <Alert>
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>Aggregate, non-identifying figures only. No individual records.</AlertTitle>
        <AlertDescription>
          <p className="mt-1 text-muted-foreground">
            Reporting shows counts and trends across the whole platform. It never lists an individual,
            never drills into a user, and exports no row-level data (Decisions.md D16).
          </p>
        </AlertDescription>
      </Alert>

      {/* KPI row: 1 column on phones, 2 from sm, 4 from lg. The same shape as the dashboard cards. */}
      <section
        aria-label="Platform totals"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {(metrics.data ?? []).map((metric) => (
          <KpiCard key={metric.key} metric={metric} />
        ))}
      </section>

      {/* Charts: stacked on phones, two-up from lg. Each panel is a Card with a title, an aggregate
          caption, and an EmptyState fallback. */}
      <section
        aria-label="Platform trends"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <SignupTrendChart data={signupTrend.data ?? []} />
        <ActiveUsersChart data={activeUsers.data ?? []} />
        <PlanDistributionChart data={planDistribution.data ?? []} />
        <ContentByTypeChart data={contentCounts.data ?? []} />
      </section>
    </div>
  );
}
