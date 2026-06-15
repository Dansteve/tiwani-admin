// The data-source banner + the gated MOCK <-> LIVE toggle. It pins:
//   - the DEFAULT is mock, and the mock banner shows the honest "not real data" copy (the --warning look).
//   - flipping to live (via the toggle) swaps to the distinct "Live API" copy (the --primary / teal look),
//     so the two modes are unmistakable.
//   - the toggle is GATED: a roles.manage role (super_admin / role_admin) sees the MOCK/LIVE switch; a
//     lower role (support_read / dsar_handler / none) sees the mock banner with NO live switch (fail-closed).
//   - no off-brand hex leaks into the markup (the brand-token rule).

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PreProductionBanner } from "@/features/dashboard/PreProductionBanner";
import { DataSourceProvider } from "@/state/DataSourceProvider";
import { DATA_MODE_STORAGE_KEY, setDataMode } from "@/lib/admin-api/mode";
import type { StaffRole } from "@/lib/rbac";

function renderBanner(role: StaffRole | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DataSourceProvider>
        <PreProductionBanner role={role} />
      </DataSourceProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // Start every test from a clean default: no stored choice, the seam cell on mock.
  window.localStorage.clear();
  setDataMode("mock");
});

afterEach(() => {
  window.localStorage.clear();
  setDataMode("mock");
});

describe("PreProductionBanner: default + mock copy", () => {
  it("defaults to the mock banner copy", () => {
    renderBanner("super_admin");
    expect(screen.getByText(/Pre-production preview, mock data/i)).toBeInTheDocument();
    expect(screen.getByText(/Every figure here is synthetic/i)).toBeInTheDocument();
    // The live indicator is not shown in mock mode.
    expect(screen.queryByText(/^Live API$/)).not.toBeInTheDocument();
  });
});

describe("PreProductionBanner: client-resolved role (no prop)", () => {
  it("resolves the role from the staff session (defaulting to STUB_STAFF) when no role prop is passed", () => {
    // The layout no longer passes a server `role` prop; the banner reads useStaffRole() instead. With no
    // cookie set, the hook falls back to STUB_STAFF (super_admin), a roles.manage holder, so the toggle
    // shows. This pins the new default path (the prop is now an optional test override).
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <DataSourceProvider>
          <PreProductionBanner />
        </DataSourceProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Pre-production preview, mock data/i)).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /data source/i })).toBeInTheDocument();
  });
});

describe("PreProductionBanner: the gated toggle (roles.manage)", () => {
  it("shows the MOCK/LIVE toggle for a roles.manage role (super_admin)", () => {
    renderBanner("super_admin");
    const toggle = screen.getByRole("radiogroup", { name: /data source/i });
    expect(within(toggle).getByRole("radio", { name: "Mock" })).toBeInTheDocument();
    expect(within(toggle).getByRole("radio", { name: "Live" })).toBeInTheDocument();
    // Mock is the selected radio by default.
    expect(within(toggle).getByRole("radio", { name: "Mock" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("shows the toggle for role_admin (the other roles.manage holder)", () => {
    renderBanner("role_admin");
    expect(screen.getByRole("radiogroup", { name: /data source/i })).toBeInTheDocument();
  });

  it.each(["support_read", "dsar_handler", null] as const)(
    "hides the live switch for a non-roles.manage role (%s): mock banner, no toggle",
    (role) => {
      renderBanner(role);
      // The mock banner still shows (the honest label is for everyone).
      expect(screen.getByText(/Pre-production preview, mock data/i)).toBeInTheDocument();
      // But there is no data-source toggle (cannot switch to live).
      expect(screen.queryByRole("radiogroup", { name: /data source/i })).not.toBeInTheDocument();
    },
  );
});

describe("PreProductionBanner: mode-aware copy on flip", () => {
  it("switches to the 'Live API' copy when the Live segment is chosen", () => {
    renderBanner("super_admin");
    fireEvent.click(screen.getByRole("radio", { name: "Live" }));

    // The distinct live indicator and copy replace the mock warning.
    expect(screen.getByText(/^Live API$/)).toBeInTheDocument();
    expect(screen.getByText(/Reading from the live admin service/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pre-production preview, mock data/i)).not.toBeInTheDocument();

    // The choice persisted under the versioned key.
    expect(window.localStorage.getItem(DATA_MODE_STORAGE_KEY)).toBe("live");

    // And back to mock.
    fireEvent.click(screen.getByRole("radio", { name: "Mock" }));
    expect(screen.getByText(/Pre-production preview, mock data/i)).toBeInTheDocument();
    expect(window.localStorage.getItem(DATA_MODE_STORAGE_KEY)).toBe("mock");
  });
});

describe("PreProductionBanner: brand tokens only", () => {
  it("emits no off-brand hardcoded hex in either mode", () => {
    const { container, rerender } = renderBanner("super_admin");
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}/);

    fireEvent.click(screen.getByRole("radio", { name: "Live" }));
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}/);
    // The prototype grey-green and the Blackbird accent blue must never appear.
    expect(container.innerHTML.toLowerCase()).not.toContain("738271");
    expect(container.innerHTML.toLowerCase()).not.toContain("3b82f6");

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <DataSourceProvider>
          <PreProductionBanner role="support_read" />
        </DataSourceProvider>
      </QueryClientProvider>,
    );
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}/);
  });
});
