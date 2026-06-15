// The shared chart helpers are the one place the charts read colour, motion, and grid/axis defaults, so
// these pin that the series ramp resolves to the brand --chart-* TOKENS (never a hardcoded hex), the
// animation budget stays short, and the index wrap is stable. A drift here would let an off-brand colour
// or a long animation into every chart.

import { describe, it, expect } from "vitest";

import {
  CHART_SERIES,
  CHART_ANIMATION,
  CHART_AXIS_PROPS,
  CHART_GRID_PROPS,
  chartColorByIndex,
  chartGradientId,
} from "@/lib/chart";

describe("chart helpers", () => {
  it("the series ramp is the five brand --chart tokens, no hardcoded hex", () => {
    expect(CHART_SERIES).toEqual([
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ]);
    for (const color of CHART_SERIES) {
      expect(color).toMatch(/^var\(--chart-[1-5]\)$/);
      expect(color).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });

  it("chartColorByIndex wraps around the 5-step ramp (incl. negative indices)", () => {
    expect(chartColorByIndex(0)).toBe("var(--chart-1)");
    expect(chartColorByIndex(4)).toBe("var(--chart-5)");
    expect(chartColorByIndex(5)).toBe("var(--chart-1)");
    expect(chartColorByIndex(7)).toBe("var(--chart-3)");
    expect(chartColorByIndex(-1)).toBe("var(--chart-5)");
  });

  it("the animation budget is short and eased (calm motion)", () => {
    expect(CHART_ANIMATION.isAnimationActive).toBe(true);
    expect(CHART_ANIMATION.animationDuration).toBeLessThanOrEqual(300);
    expect(CHART_ANIMATION.animationEasing).toBe("ease");
  });

  it("the grid drops vertical lines and the axis hides its tick/axis lines", () => {
    expect(CHART_GRID_PROPS.vertical).toBe(false);
    expect(CHART_GRID_PROPS.strokeDasharray).toBe("3 3");
    expect(CHART_AXIS_PROPS.tickLine).toBe(false);
    expect(CHART_AXIS_PROPS.axisLine).toBe(false);
    // The tick label never falls below the 12px caption floor.
    expect(CHART_AXIS_PROPS.tick.fontSize).toBeGreaterThanOrEqual(12);
  });

  it("chartGradientId is a stable, sanitized id per key", () => {
    expect(chartGradientId("signups")).toBe("chart-gradient-signups");
    expect(chartGradientId("a b/c")).toBe("chart-gradient-a-b-c");
  });
});
