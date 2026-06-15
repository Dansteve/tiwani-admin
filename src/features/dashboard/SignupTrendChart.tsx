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
import type { TrendPoint } from "@/lib/mock/metrics";

// The aggregate signup-trend panel: an area chart of weekly signup COUNTS (no identities). It composes
// the shared ChartContainer + the token series ramp (--color-signups -> --chart-1, the brand teal) and
// the shared grid/axis/animation/gradient helpers, so it is token-driven, not hand-rolled. When there is
// no data it shows the shared EmptyState instead of an empty axis box. This is aggregate-only reporting
// (README red line 9): a count per week, never an individual.

const CHART_CONFIG = {
  signups: { label: "Signups", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function SignupTrendChart({ data }: { data: TrendPoint[] }) {
  const hasData = data.length > 0;
  const gradientUrl = `url(#${chartGradientId("signups")})`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Waitlist signups</CardTitle>
        <CardDescription>
          Weekly totals over the last 8 weeks. Aggregate counts only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer
            config={CHART_CONFIG}
            className="aspect-auto h-[260px] w-full"
          >
            <AreaChart
              data={data}
              margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
            >
              <defs>
                <ChartGradient id="signups" color="var(--color-signups)" />
              </defs>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey="week" {...CHART_AXIS_PROPS} />
              <YAxis width={36} {...CHART_AXIS_PROPS} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="signups"
                type="monotone"
                stroke="var(--color-signups)"
                strokeWidth={2}
                fill={gradientUrl}
                {...CHART_ANIMATION}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <EmptyState
            title="No signups yet"
            description="Weekly signup totals will appear here once the waitlist starts collecting entries."
          />
        )}
      </CardContent>
    </Card>
  );
}
