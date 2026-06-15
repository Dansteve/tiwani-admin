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
  CHART_BAR_RADIUS,
  CHART_GRID_PROPS,
} from "@/lib/chart";
import { EmptyState } from "@/components/EmptyState";
import type { ContentTypeCount } from "@/lib/mock/metrics";

// The content-by-type panel: a vertical bar chart of the COUNT of content items in each library surface.
// Composes the shared ChartContainer + the token series ramp (--color-items -> --chart-3, brand teal-mid)
// + the shared grid/axis/animation helpers. This counts platform content, not user data, and is
// aggregate-only by construction. The EmptyState shows when there is no data; an accessible text summary
// accompanies the chart.

const CHART_CONFIG = {
  items: { label: "Items", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function ContentByTypeChart({ data }: { data: ContentTypeCount[] }) {
  const hasData = data.length > 0;
  const total = data.reduce((sum, point) => sum + point.items, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Content by type</CardTitle>
        <CardDescription>
          Published and draft items per library surface. Aggregate counts only.
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
                margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis
                  dataKey="type"
                  interval={0}
                  tickFormatter={(value: string) => value.split(" ")[0]}
                  {...CHART_AXIS_PROPS}
                />
                <YAxis width={36} allowDecimals={false} {...CHART_AXIS_PROPS} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="items"
                  fill="var(--color-items)"
                  radius={CHART_BAR_RADIUS}
                  {...CHART_ANIMATION}
                />
              </BarChart>
            </ChartContainer>
            <p className="sr-only">
              Content items by type, {total.toLocaleString()} total.{" "}
              {data
                .map((point) => `${point.type}: ${point.items.toLocaleString()}`)
                .join("; ")}
              .
            </p>
          </>
        ) : (
          <EmptyState
            title="No content yet"
            description="The count of content items by type will appear here once the library has entries."
          />
        )}
      </CardContent>
    </Card>
  );
}
