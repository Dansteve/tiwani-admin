// The System Health screen test. It pins: (1) the mock shape (getMockSystemHealth returns the overall
// roll-up + the services + the diagnostics, with valid state enums); (2) the screen renders every service
// card + the overall badge + every diagnostics row from the seam (and recomputes nothing); (3) the status is
// colour + label + dot, never colour alone (an sr-only status word + a visible label accompany each dot);
// and (4) no off-brand hardcoded hex / Blackbird blue leaks into the markup (the brand-token rule).

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SystemHealthScreen } from "@/features/system/SystemHealthScreen";
import {
  getMockSystemHealth,
  deriveOverallHealth,
  type ServiceStatus,
} from "@/lib/mock/system";

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SystemHealthScreen />
    </QueryClientProvider>,
  );
}

describe("mock/system", () => {
  it("returns an overall roll-up plus the services and diagnostics, all with valid states", () => {
    const health = getMockSystemHealth();
    expect(["healthy", "degraded", "down"]).toContain(health.overall);
    expect(health.services.length).toBe(6);
    expect(health.diagnostics.length).toBe(5);

    for (const service of health.services) {
      expect(typeof service.name).toBe("string");
      expect(["ok", "degraded", "down", "not_configured"]).toContain(service.status);
      expect(typeof service.label).toBe("string");
      expect(typeof service.detail).toBe("string");
    }
    for (const row of health.diagnostics) {
      expect(typeof row.name).toBe("string");
      expect(["ok", "warn", "fail"]).toContain(row.status);
      expect(typeof row.detail).toBe("string");
    }

    // The TIWANI services are modeled (not a generic reference): the Admin API is the not-deployed case.
    const names = health.services.map((s) => s.name);
    expect(names).toContain("Supabase (Postgres)");
    expect(names).toContain("Admin API");
    expect(health.services.find((s) => s.name === "Admin API")?.status).toBe("not_configured");
  });

  it("derives the overall roll-up from the service states (down > degraded > healthy)", () => {
    const base: ServiceStatus[] = [{ name: "X", status: "ok", label: "OK", detail: "" }];
    expect(deriveOverallHealth(base)).toBe("healthy");
    // A not_configured service is an expected pre-production state, NOT a fault: stays healthy.
    expect(
      deriveOverallHealth([...base, { name: "Y", status: "not_configured", label: "", detail: "" }]),
    ).toBe("healthy");
    expect(
      deriveOverallHealth([...base, { name: "Y", status: "degraded", label: "", detail: "" }]),
    ).toBe("degraded");
    expect(
      deriveOverallHealth([
        ...base,
        { name: "Y", status: "degraded", label: "", detail: "" },
        { name: "Z", status: "down", label: "", detail: "" },
      ]),
    ).toBe("down");
  });
});

describe("SystemHealthScreen", () => {
  it("renders the header and the subtitle", async () => {
    renderScreen();
    expect(
      await screen.findByRole("heading", { name: "System Health", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Infrastructure status and diagnostics/i)).toBeInTheDocument();
  });

  it("renders a card for every service from the seam", async () => {
    renderScreen();
    // Wait for the data to land (the first service name) so the loading skeleton has been replaced.
    await screen.findByText("Supabase (Postgres)");
    const region = screen.getByRole("region", { name: "Service status" });
    for (const service of getMockSystemHealth().services) {
      expect(within(region).getByText(service.name)).toBeInTheDocument();
      expect(within(region).getByText(service.detail)).toBeInTheDocument();
    }
  });

  it("renders the overall status badge (the all-healthy mock -> 'System healthy')", async () => {
    renderScreen();
    // The mock seeds all services ok (Admin API not_configured does not degrade), so the roll-up is healthy.
    expect(await screen.findByText("System healthy")).toBeInTheDocument();
  });

  it("renders a row for every diagnostic check from the seam", async () => {
    renderScreen();
    const region = await screen.findByRole("region", { name: "Diagnostics" });
    const table = within(region).getByRole("table");
    for (const row of getMockSystemHealth().diagnostics) {
      expect(within(table).getByText(row.name)).toBeInTheDocument();
      expect(within(table).getByText(row.detail)).toBeInTheDocument();
    }
    // The semantic table carries the three columns.
    for (const col of ["Check", "Status", "Detail"]) {
      expect(within(table).getByRole("columnheader", { name: col })).toBeInTheDocument();
    }
  });

  it("conveys status with a label word + an sr-only status word, never colour alone", async () => {
    renderScreen();
    // Wait for the data to land (the loading skeleton carries no status words).
    await screen.findByText("Supabase (Postgres)");
    // Every service card's status reads as a visible label AND an sr-only "Status: <label>" announcement,
    // so the dot is never the only carrier of the status.
    const srStatuses = screen.getAllByText(/^Status:/);
    expect(srStatuses.length).toBeGreaterThanOrEqual(getMockSystemHealth().services.length);
  });

  it("emits no off-brand hardcoded hex / Blackbird blue in the markup", async () => {
    const { container } = renderScreen();
    // Wait for the loaded markup (cards + diagnostics), so the hex scan covers the real content.
    await screen.findByText("Supabase (Postgres)");
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(html.toLowerCase()).not.toContain("738271");
    expect(html.toLowerCase()).not.toContain("2563eb");
    expect(html.toLowerCase()).not.toContain("3b82f6");
  });
});
