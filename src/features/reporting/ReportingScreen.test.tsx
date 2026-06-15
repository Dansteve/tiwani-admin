// The reporting screen test. It pins two things: (1) the screen composes the aggregate analytics (the KPI
// cards + the four chart panels from the seam), and (2) the screen is AGGREGATE-ONLY (Decisions.md D16,
// the DPO red line): no table of individuals, no row-level PII, no email, no synthetic-individual marker
// anywhere in the rendered markup. The second set is the load-bearing safety assertion: it is what
// guarantees reporting can never leak an individual.

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ReportingScreen } from "@/features/reporting/ReportingScreen";
import { getMockUsers } from "@/lib/mock/users";
import { getMockWaitlist } from "@/lib/mock/waitlist";

// jsdom has no layout, so recharts' ResponsiveContainer needs a measured box + a ResizeObserver stub.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 300,
  });
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

function renderReporting() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ReportingScreen />
    </QueryClientProvider>,
  );
}

describe("ReportingScreen", () => {
  it("renders the KPI totals from the seam", async () => {
    renderReporting();
    await screen.findByText("Total Coordinators");
    const totals = screen.getByRole("region", { name: "Platform totals" });
    for (const label of [
      "Total Coordinators",
      "Waitlist signups",
      "Active subscriptions",
      "Content items",
    ]) {
      expect(within(totals).getByText(label)).toBeInTheDocument();
    }
    // Shown exactly as the seam returned them (not recomputed).
    expect(within(totals).getByText("1,284")).toBeInTheDocument();
  });

  it("renders the four aggregate chart panels", async () => {
    const { container } = renderReporting();
    const trends = await screen.findByRole("region", { name: "Platform trends" });
    for (const title of [
      "Waitlist signups",
      "Active users",
      "Plan-tier distribution",
      "Content by type",
    ]) {
      expect(within(trends).getByText(title)).toBeInTheDocument();
    }
    // The four ChartContainers mount once their data resolves (so the panels drew charts, not empties).
    await vi.waitFor(() => {
      expect(container.querySelectorAll('[data-slot="chart"]').length).toBe(4);
    });
  });

  it("states the aggregate-only constraint on the screen", async () => {
    renderReporting();
    expect(
      await screen.findByText(
        /Aggregate, non-identifying figures only\. No individual records\./i,
      ),
    ).toBeInTheDocument();
  });

  it("is aggregate-only: no table of individuals anywhere", async () => {
    renderReporting();
    await screen.findByText("Total Coordinators");
    // The dashboard has an activity table; reporting deliberately has NONE (no row-level surface).
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("is aggregate-only: renders no individual / PII markers from the row-level mocks", async () => {
    const { container } = renderReporting();
    await screen.findByText("Total Coordinators");
    // Let every chart's async data land so nothing identifying could appear late.
    await vi.waitFor(() => {
      expect(container.querySelectorAll('[data-slot="chart"]').length).toBe(4);
    });
    const html = container.innerHTML;
    // No email address pattern at all (a hard proxy for "no individual record on the page").
    expect(html).not.toMatch(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
    // None of the synthetic individuals from the row-level mocks (users / waitlist) can appear here:
    // reporting never calls those seam methods.
    for (const user of getMockUsers()) {
      expect(html).not.toContain(user.displayName);
      expect(html).not.toContain(user.email);
    }
    for (const entry of getMockWaitlist()) {
      expect(html).not.toContain(entry.email);
    }
  });

  it("emits no off-brand hardcoded hex in the rendered markup", async () => {
    const { container } = renderReporting();
    await screen.findByText("Total Coordinators");
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(html.toLowerCase()).not.toContain("738271");
    expect(html.toLowerCase()).not.toContain("2563eb");
    expect(html.toLowerCase()).not.toContain("3b82f6");
  });
});
