"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  CHART_ANIMATION,
  CHART_AXIS_PROPS,
  CHART_BAR_RADIUS_HORIZONTAL,
  CHART_GRID_PROPS,
} from "@/lib/chart";
import { EmptyState } from "@/components/EmptyState";
import type { PlanDistributionPoint } from "@/lib/mock/metrics";

// The plan-tier distribution panel: a horizontal bar chart of the COUNT of accounts on each subscription
// tier. Composes the shared ChartContainer + the token series ramp (--color-accounts -> --chart-1, brand
// teal) + the shared grid/axis/animation helpers, so it is token-driven, not hand-rolled. Aggregate-only
// (README red line 9): a count per tier bucket, never an account. The EmptyState shows when there is no
// data. The bars carry an accessible text summary alongside the chart for screen readers.

const CHART_CONFIG = {
  accounts: { label: "Accounts", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PlanDistributionChart({ data }: { data: PlanDistributionPoint[] }) {
  const hasData = data.length > 0;
  const total = data.reduce((sum, point) => sum + point.accounts, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Plan-tier distribution</CardTitle>
        <CardDescription>
          Accounts by subscription tier. Aggregate counts only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <ChartContainer
              config={CHART_CONFIG}
              className="aspect-auto h-[260px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={data}
                layout="vertical"
                margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
              >
                <CartesianGrid {...CHART_GRID_PROPS} horizontal={false} vertical />
                <XAxis type="number" {...CHART_AXIS_PROPS} />
                <YAxis
                  type="category"
                  dataKey="tier"
                  width={84}
                  {...CHART_AXIS_PROPS}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="accounts"
                  fill="var(--color-accounts)"
                  radius={CHART_BAR_RADIUS_HORIZONTAL}
                  {...CHART_ANIMATION}
                />
              </BarChart>
            </ChartContainer>
            {/* The accessible text alternative to the chart: the same aggregate numbers, for screen
                readers and as a fallback. */}
            <p className="sr-only">
              Accounts by plan tier, {total.toLocaleString()} total.{" "}
              {data
                .map((point) => `${point.tier}: ${point.accounts.toLocaleString()}`)
                .join("; ")}
              .
            </p>
          </>
        ) : (
          <EmptyState
            title="No plan data yet"
            description="The breakdown of accounts by subscription tier will appear here once there are active subscriptions."
          />
        )}
      </CardContent>
    </Card>
  );
}
