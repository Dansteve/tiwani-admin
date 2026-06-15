// The dashboard render test. It pins that the board-ready overview composes the three panels from the
// mock seam: the KPI cards (labels + values the api returned), the aggregate trend chart container, and
// the recent-activity table. It also asserts the screen renders only what the seam returned (it never
// recomputes a number) and that no off-brand hex leaks into the markup (the brand-token rule). The chart
// itself is exercised in jsdom via the ChartContainer; recharts measures to 0 there, so we assert the
// chart container is present, not its drawn geometry.

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DashboardScreen } from "@/features/dashboard/DashboardScreen";

// jsdom has no layout, so ResponsiveContainer would warn about a 0x0 box. Give it a measured size so the
// chart renders cleanly in the test.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 300,
  });
  // recharts uses ResizeObserver; jsdom does not ship it.
  if (!("ResizeObserver" in globalThis)) {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  }
});

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <DashboardScreen />
    </QueryClientProvider>,
  );
}

describe("DashboardScreen", () => {
  it("renders the four KPI cards with the mock labels and values", async () => {
    renderDashboard();
    // Wait for the seam's async data to land, then assert the cards.
    await screen.findByText("Total Coordinators");
    const kpiSection = screen.getByRole("region", { name: "Key metrics" });
    for (const label of [
      "Total Coordinators",
      "Waitlist signups",
      "Active subscriptions",
      "Content items",
    ]) {
      expect(within(kpiSection).getByText(label)).toBeInTheDocument();
    }
    // The values are shown exactly as the seam returned them (not recomputed).
    expect(within(kpiSection).getByText("1,284")).toBeInTheDocument();
    expect(within(kpiSection).getByText("3,907")).toBeInTheDocument();
  });

  it("renders the aggregate signup-trend chart panel and its container", async () => {
    const { container } = renderDashboard();
    const chartSection = await screen.findByRole("region", { name: "Signup trend" });
    expect(within(chartSection).getByText("Waitlist signups")).toBeInTheDocument();
    expect(
      within(chartSection).getByText(/Aggregate counts only/i),
    ).toBeInTheDocument();
    // The ChartContainer mounts (data-slot="chart") once the trend data resolves, so the panel rendered
    // the chart, not the empty state.
    await vi.waitFor(() => {
      expect(container.querySelector('[data-slot="chart"]')).not.toBeNull();
    });
  });

  it("renders the recent-activity table with the mock rows", async () => {
    renderDashboard();
    // Wait for a mock row to land (the panel shows the empty state until the activity query resolves).
    await screen.findByText(/New waitlist signup \(child care\)/);
    const activitySection = screen.getByRole("region", { name: "Recent activity" });
    expect(within(activitySection).getByText("Recent activity")).toBeInTheDocument();
    expect(within(activitySection).getByRole("table")).toBeInTheDocument();
  });

  it("keeps the pre-production banner visible", async () => {
    renderDashboard();
    expect(
      await screen.findByText(/Pre-production preview, mock data/i),
    ).toBeInTheDocument();
  });

  it("emits no off-brand hardcoded hex in the rendered markup", async () => {
    const { container } = renderDashboard();
    await screen.findByText("Total Coordinators");
    const html = container.innerHTML;
    // No raw 6-digit hex at all (the brand tokens resolve via Tailwind classes / CSS vars).
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}/);
    // The prototype grey-green and the Blackbird / AccountMaster accent blue must never appear.
    expect(html.toLowerCase()).not.toContain("738271");
    expect(html.toLowerCase()).not.toContain("2563eb");
    expect(html.toLowerCase()).not.toContain("3b82f6");
  });
});
