"use client";

// The dashboard overview: the board-ready "basic reporting / visibility" cut. A row of KPI cards, an
// aggregate signup-trend chart, a recent-activity table, and the always-visible pre-production banner. It
// reads through the admin-api client (src/lib/admin-api/client.ts) via TanStack Query, exactly the
// pattern the real screens will use, so the seam is exercised now; the client currently delegates to the
// MOCK adapters (Decisions.md D16). When the audited admin-api lands, only the client body changes, not
// this screen. Everything shown is aggregate-only (counts, no identified individuals; README red line 9).

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api/client";
import { PreProductionBanner } from "@/features/dashboard/PreProductionBanner";
import { KpiCard } from "@/features/dashboard/KpiCard";
import { ActivityPanel } from "@/features/dashboard/ActivityPanel";
import { SignupTrendChart } from "@/features/dashboard/SignupTrendChart";

export function DashboardScreen() {
  const metrics = useQuery({ queryKey: ["metrics"], queryFn: () => adminApi.getMetrics() });
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => adminApi.getActivity() });
  const signupTrend = useQuery({
    queryKey: ["signup-trend"],
    queryFn: () => adminApi.getSignupTrend(),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Overview</h1>
        <p className="text-sm text-muted-foreground">
          A snapshot of the platform. Synthetic figures, for layout and review only.
        </p>
      </header>

      <PreProductionBanner />

      {/* KPI row: 1 column on phones, 2 from sm, 4 from lg. The cards share one shape so they align. */}
      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(metrics.data ?? []).map((metric) => (
          <KpiCard key={metric.key} metric={metric} />
        ))}
      </section>

      {/* The trend chart + the activity table. Stacked on phones, side by side from lg (chart wider). */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-label="Signup trend" className="lg:col-span-2">
          <SignupTrendChart data={signupTrend.data ?? []} />
        </section>
        <section aria-label="Recent activity" className="lg:col-span-1">
          <ActivityPanel items={activity.data ?? []} />
        </section>
      </div>
    </div>
  );
}
