"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  CHART_GRID_PROPS,
  ChartGradient,
  chartGradientId,
} from "@/lib/chart";
import { EmptyState } from "@/components/EmptyState";
import type { ActiveUsersPoint } from "@/lib/mock/metrics";

// The active-users panel: an area chart of the weekly-active COUNT of Coordinators over time. Mirrors the
// dashboard's SignupTrendChart (same shared ChartContainer + gradient + grid/axis/animation helpers), but
// on a different series colour (--color-active -> --chart-3). Aggregate-only (README red line 9): a count
// per week, never an identity. The EmptyState shows when there is no data; an accessible text summary
// accompanies the chart.

const CHART_CONFIG = {
  active: { label: "Active users", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function ActiveUsersChart({ data }: { data: ActiveUsersPoint[] }) {
  const hasData = data.length > 0;
  const gradientUrl = `url(#${chartGradientId("active")})`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Active users</CardTitle>
        <CardDescription>
          Weekly-active Coordinators over the last 8 weeks. Aggregate counts only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <ChartContainer
              config={CHART_CONFIG}
              className="aspect-auto h-[260px] w-full"
            >
              <AreaChart
                accessibilityLayer
                data={data}
                margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <ChartGradient id="active" color="var(--color-active)" />
                </defs>
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="week" {...CHART_AXIS_PROPS} />
                <YAxis width={40} {...CHART_AXIS_PROPS} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="activeUsers"
                  name="active"
                  type="monotone"
                  stroke="var(--color-active)"
                  strokeWidth={2}
                  fill={gradientUrl}
                  {...CHART_ANIMATION}
                />
              </AreaChart>
            </ChartContainer>
            <p className="sr-only">
              Weekly-active Coordinators over the last 8 weeks.{" "}
              {data
                .map((point) => `${point.week}: ${point.activeUsers.toLocaleString()}`)
                .join("; ")}
              .
            </p>
          </>
        ) : (
          <EmptyState
            title="No activity yet"
            description="Weekly-active Coordinator totals will appear here once accounts are active."
          />
        )}
      </CardContent>
    </Card>
  );
}
