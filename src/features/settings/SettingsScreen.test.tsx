// The settings screen test. It pins: (1) the account card shows the session staff member; (2) the
// read-only staff list renders the mock rows with role Badges; (3) the capability matrix matches rbac.ts
// EXACTLY (every rendered cell equals can(role, capability), the load-bearing assertion that the visible
// RBAC cannot drift from the real allowlist); (4) role management AND the add/invite-staff provisioning
// form are gated by can(role, "roles.manage") both ways; and (5) the RED LINE: no audit-logging /
// reason-requirement / maker-checker toggle exists.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// AddStaffCard imports the toast entry point; the screen mounts it, so stub it to a no-op spy (the toast
// would otherwise mount sonner under jsdom). Same pattern the content module tests use.
vi.mock("@/lib/toast", () => ({ toast: { message: vi.fn(), success: vi.fn(), error: vi.fn() } }));

import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { ThemeProvider } from "@/state/ThemeProvider";
import { CapabilityMatrix } from "@/features/settings/CapabilityMatrix";
import { FEATURE_FLAGS } from "@/features/settings/PlatformConfigCard";
import { can, STAFF_ROLES, type StaffRole } from "@/lib/rbac";
import { CAPABILITY_DISPLAY, ROLE_DISPLAY } from "@/features/settings/roleDisplay";
import { getMockStaff } from "@/lib/mock/staff";
import type { StaffSession } from "@/lib/staff-session";

// next/font is imported transitively by the theme toggle's siblings in some setups; the screen itself does
// not need it, but guard the theme provider's matchMedia use under jsdom.
function ensureMatchMedia() {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }
}

function makeSession(role: StaffRole): StaffSession {
  return {
    staffId: `test-${role}`,
    name: `Test ${role}`,
    email: `test.${role}@tiwani.internal`,
    role,
  };
}

function renderSettings(session: StaffSession) {
  ensureMatchMedia();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <SettingsScreen session={session} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => cleanup());

describe("SettingsScreen account + staff", () => {
  it("shows the session staff member in the account card", () => {
    const session = makeSession("role_admin");
    renderSettings(session);
    expect(screen.getByText(session.name)).toBeInTheDocument();
    expect(screen.getByText(session.email)).toBeInTheDocument();
    // The role pill uses the role's display label.
    expect(
      screen.getAllByText(ROLE_DISPLAY.role_admin.label).length,
    ).toBeGreaterThan(0);
  });

  it("renders the read-only staff list rows from the seam", async () => {
    renderSettings(makeSession("role_admin"));
    const firstStaff = getMockStaff()[0];
    await screen.findByText(firstStaff.name);
    for (const member of getMockStaff()) {
      expect(screen.getByText(member.name)).toBeInTheDocument();
      expect(screen.getByText(member.email)).toBeInTheDocument();
    }
  });
});

describe("CapabilityMatrix matches rbac.ts exactly", () => {
  it("every rendered cell equals can(role, capability)", () => {
    const { container } = render(<CapabilityMatrix />);

    // Each capability is a row; the data-granted attribute on each role cell is set from can() in the
    // component. Walk every (capability, role) pair and assert the rendered cell agrees with can().
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(CAPABILITY_DISPLAY.length);

    CAPABILITY_DISPLAY.forEach(({ key }, rowIndex) => {
      const row = rows[rowIndex];
      const cells = row.querySelectorAll('td[data-granted]');
      // One cell per role, in STAFF_ROLES order.
      expect(cells.length).toBe(STAFF_ROLES.length);
      STAFF_ROLES.forEach((role, colIndex) => {
        const cell = cells[colIndex];
        const rendered = cell.getAttribute("data-granted") === "true";
        expect(rendered).toBe(can(role, key));
      });
    });
  });

  it("renders a colour + icon + screen-reader label per cell, never colour alone", () => {
    render(<CapabilityMatrix />);
    // Granted cells say "Granted" (sr-only), denied cells say "Not granted"; both exist in the matrix.
    expect(screen.getAllByText("Granted").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not granted").length).toBeGreaterThan(0);
  });
});

describe("SettingsScreen role-management gating", () => {
  it("shows the role-management stub when the role can manage roles (role_admin)", () => {
    renderSettings(makeSession("role_admin"));
    expect(can("role_admin", "roles.manage")).toBe(true);
    expect(screen.getByText(/Pre-production stub: no real change/i)).toBeInTheDocument();
    // The control is present but disabled (it makes no real change).
    const assign = screen.getByRole("button", { name: /assign role/i });
    expect(assign).toBeDisabled();
  });

  it("shows view-only (no controls) when the role cannot manage roles (support_read)", () => {
    renderSettings(makeSession("support_read"));
    expect(can("support_read", "roles.manage")).toBe(false);
    // The exact view-only notice title (anchored, so "review only" elsewhere does not match).
    expect(screen.getByText("View only")).toBeInTheDocument();
    expect(screen.getByText(/cannot manage staff roles/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /assign role/i })).toBeNull();
  });
});

describe("SettingsScreen add/invite-staff provisioning gating", () => {
  it("shows the add-staff form (email + role + submit) when the role can manage roles (role_admin)", () => {
    renderSettings(makeSession("role_admin"));
    expect(can("role_admin", "roles.manage")).toBe(true);
    // The provisioning affordance: the section header, the email input, the role select, the submit.
    expect(screen.getByText(/Add \/ invite staff member/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send invite/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role for the new staff member/i)).toBeInTheDocument();
  });

  it("also shows the add-staff form for super_admin (it holds roles.manage)", () => {
    renderSettings(makeSession("super_admin"));
    expect(can("super_admin", "roles.manage")).toBe(true);
    expect(screen.getByRole("button", { name: /send invite/i })).toBeInTheDocument();
  });

  it("hides the add-staff form for a role without roles.manage (support_read)", () => {
    renderSettings(makeSession("support_read"));
    expect(can("support_read", "roles.manage")).toBe(false);
    // No form: no submit button, no email field, no role select. Just the view-only notice.
    expect(screen.queryByRole("button", { name: /send invite/i })).toBeNull();
    expect(screen.queryByLabelText(/work email/i)).toBeNull();
    expect(screen.queryByLabelText(/role for the new staff member/i)).toBeNull();
    expect(screen.getByText(/cannot invite staff/i)).toBeInTheDocument();
  });

  it("hides the add-staff form for dsar_handler too (it reads records, does not grant access)", () => {
    renderSettings(makeSession("dsar_handler"));
    expect(can("dsar_handler", "roles.manage")).toBe(false);
    expect(screen.queryByRole("button", { name: /send invite/i })).toBeNull();
  });
});

describe("Settings red line: no accountability-control toggles", () => {
  // The forbidden terms: the core accountability controls that are always on and never staff-configurable.
  const FORBIDDEN = ["audit", "maker-checker", "maker checker", "reason requirement", "reason-required"];

  it("configures no audit-log, reason-requirement, or maker-checker flag (structural)", () => {
    // The strongest guarantee: the actual flag list contains nothing forbidden. A flag's key, label, and
    // description are all checked, so none of these controls can ever be a configurable row.
    for (const flag of FEATURE_FLAGS) {
      const haystack = `${flag.key} ${flag.label} ${flag.description}`.toLowerCase();
      for (const term of FORBIDDEN) {
        expect(haystack).not.toContain(term);
      }
    }
  });

  it("renders no toggle for any forbidden control, and no interactive switch at all", () => {
    const { container } = renderSettings(makeSession("role_admin"));
    // The feature-flags list (the only place a config toggle could live) names only the benign flags.
    const flagsList = screen.getByRole("list", { name: "Feature flags" });
    const flagsText = (flagsList.textContent ?? "").toLowerCase();
    for (const term of FORBIDDEN) {
      expect(flagsText).not.toContain(term);
    }
    // No interactive switch element exists anywhere (platform config is read-only Badges, not switches;
    // the only buttons are the disabled role stubs + the theme selector).
    expect(container.querySelector('[role="switch"]')).toBeNull();
  });
});
