import React from "react";

// Shared chart helpers. The single place the admin charts read the series ramp, the bar radius, the
// grid/axis defaults, the animation budget, the gradient defs, and the empty state. Every chart panel
// composes these with the ChartContainer chokepoint in components/ui/chart.tsx instead of hand-rolling
// raw Recharts props.
//
// Colour is token-only: the series ramp reads var(--chart-1..5) from styles/theme.css (light and .dark
// both defined), which are the TIWANI palette (teal, coral, teal-mid, amber, deep teal). No hardcoded
// hex lives here, and there are no finance semantics (no income/expense colours): this is not a fintech
// app.

// The 5-step categorical series ramp, straight from the token layer. This is the one definition; charts
// reference it rather than inlining colour arrays.
export const CHART_SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

// Series colour for an index, wrapping around the 5-step ramp.
export function chartColorByIndex(index: number): string {
  const safeIndex =
    ((index % CHART_SERIES.length) + CHART_SERIES.length) % CHART_SERIES.length;
  return CHART_SERIES[safeIndex];
}

// Rounded bar corners. Vertical bars round the top; horizontal (layout="vertical") bars round the
// trailing end. One value, not per page.
export const CHART_BAR_RADIUS: [number, number, number, number] = [6, 6, 0, 0];
export const CHART_BAR_RADIUS_HORIZONTAL: [number, number, number, number] = [
  0, 6, 6, 0,
];

// Short, budgeted animation (calm motion, never long). Spread onto every Bar/Line/Area/Pie so motion is
// consistent.
export const CHART_ANIMATION = {
  isAnimationActive: true,
  animationDuration: 250,
  animationEasing: "ease" as const,
};

// CartesianGrid defaults: a subtle dashed horizontal grid, vertical lines dropped. The colour is not set
// here on purpose: omitting stroke lets Recharts inject its #ccc default, which the ChartContainer rule
// in chart.tsx restyles to --border/50. Setting stroke would defeat that.
export const CHART_GRID_PROPS = {
  strokeDasharray: "3 3",
  vertical: false,
} as const;

// Axis defaults: hidden tick/axis lines for a cleaner look; the tick text is recoloured to
// --muted-foreground by the ChartContainer rule, sized at the small label size here.
export const CHART_AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 12 },
} as const;

// Stable gradient id for a series key, so each AreaChart can reference its own <linearGradient>.
export function chartGradientId(key: string): string {
  return `chart-gradient-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

// A vertical linear gradient fading a token colour from topOpacity at the top to transparent at the
// bottom: the soft fill under a trend area. Render inside a chart's <defs> and reference the fill as
// url(#<chartGradientId(id)>).
export function ChartGradient({
  id,
  color,
  topOpacity = 0.35,
  bottomOpacity = 0,
}: {
  id: string;
  color: string;
  topOpacity?: number;
  bottomOpacity?: number;
}): React.ReactElement {
  const gradientId = chartGradientId(id);
  return React.createElement(
    "linearGradient",
    { id: gradientId, x1: "0", y1: "0", x2: "0", y2: "1" },
    React.createElement("stop", {
      offset: "5%",
      stopColor: color,
      stopOpacity: topOpacity,
    }),
    React.createElement("stop", {
      offset: "95%",
      stopColor: color,
      stopOpacity: bottomOpacity,
    }),
  );
}

// The shared empty state, shown in place of an empty axis box when a chart has no data for the current
// selection.
export function ChartEmpty({
  message = "No data for this selection",
  height = 300,
}: {
  message?: string;
  height?: number | string;
}): React.ReactElement {
  return React.createElement(
    "div",
    {
      className:
        "flex items-center justify-center text-sm text-muted-foreground",
      style: { height },
    },
    message,
  );
}
