// The Users module render tests pin the DPO red lines AS BEHAVIOUR (Decisions.md D16):
//   - search-first: NO rows render until a query is typed (no standing whole-population browse).
//   - RBAC gating: support_read cannot SEE the "Reveal full record" affordance; dsar_handler can.
//   - reason-required: the reveal is blocked while the reason is empty (the confirm is disabled).
//   - context_note presence-not-contents: the note BODY never appears until its own gated action runs.
//   - audit-before-data: recordAudit is called BEFORE the full-record fetch resolves.
// A regression in any of these is a privacy / compliance bug, so they are pinned here, not left to QA.

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// jsdom does not implement the Pointer Capture API or scrollIntoView that Radix Select calls when its
// trigger is opened. Shim them so the RolePreview <Select> can be exercised in the test (these are inert
// no-ops outside a real browser; they do not change any product behaviour).
beforeAll(() => {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
    HTMLElement.prototype.setPointerCapture = () => {};
    HTMLElement.prototype.releasePointerCapture = () => {};
  }
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {};
  }
});

// sonner's toast is a side effect we do not need in the test; stub it so it is a no-op spy.
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Drive the previewed role from the test by stubbing the session stub the screen seeds from. role_admin
// would default the preview to support_read; dsar_handler defaults it to dsar_handler. The screen still
// exposes the RolePreview control, so a test can also switch the role in-UI.
const sessionMock = vi.hoisted(() => ({ role: "support_read" as string }));
vi.mock("@/lib/staff-session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/staff-session")>();
  return {
    ...actual,
    get STUB_STAFF() {
      return { ...actual.STUB_STAFF, role: sessionMock.role };
    },
  };
});

import { UsersScreen } from "@/features/users/UsersScreen";
import { adminApi } from "@/lib/admin-api/client";

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <UsersScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  sessionMock.role = "support_read";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UsersScreen search-first (no standing whole-population browse)", () => {
  it("lists NO coordinators until a query is entered", async () => {
    const user = userEvent.setup();
    renderScreen();

    // The search-first prompt is shown; no table, no rows.
    expect(await screen.findByText("Search to begin")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("Demo Coordinator A")).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "Coordinator A");

    // Now the matching row appears and the prompt is gone.
    expect(await screen.findByText("Demo Coordinator A")).toBeInTheDocument();
    expect(screen.queryByText("Search to begin")).not.toBeInTheDocument();
  });
});

describe("UsersScreen RBAC gating of the full-record reveal", () => {
  it("support_read can open the minimised detail but CANNOT see the reveal affordance", async () => {
    const user = userEvent.setup();
    sessionMock.role = "support_read";
    renderScreen();

    await user.type(screen.getByRole("searchbox"), "Coordinator A");
    await user.click(await screen.findByText("Demo Coordinator A"));

    // The minimised summary dialog is open.
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Minimised support summary. The full record is a separate, reason-required, logged reveal.")).toBeInTheDocument();
    // No reveal affordance for support_read; the honest "minimised only" note instead.
    expect(within(dialog).queryByRole("button", { name: /reveal full record/i })).not.toBeInTheDocument();
    expect(within(dialog).getByText(/can view the minimised summary only/i)).toBeInTheDocument();
  });

  it("dsar_handler CAN see the reveal affordance", async () => {
    const user = userEvent.setup();
    sessionMock.role = "dsar_handler";
    renderScreen();

    await user.type(screen.getByRole("searchbox"), "Coordinator A");
    await user.click(await screen.findByText("Demo Coordinator A"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /reveal full record/i })).toBeInTheDocument();
  });

  it("switching the preview role in-UI flips the affordance (the stub control works)", async () => {
    const user = userEvent.setup();
    sessionMock.role = "support_read";
    renderScreen();

    // Switch the preview role to dsar_handler via the clearly-labelled stub control.
    await user.click(screen.getByRole("combobox", { name: /preview as role/i }));
    await user.click(await screen.findByRole("option", { name: /dsar_handler/i }));

    await user.type(screen.getByRole("searchbox"), "Coordinator A");
    await user.click(await screen.findByText("Demo Coordinator A"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /reveal full record/i })).toBeInTheDocument();
  });
});

describe("UsersScreen reason-required reveal", () => {
  it("blocks the reveal while the reason is empty, allows it once a reason is typed", async () => {
    const user = userEvent.setup();
    sessionMock.role = "dsar_handler";
    renderScreen();

    await user.type(screen.getByRole("searchbox"), "Coordinator A");
    await user.click(await screen.findByText("Demo Coordinator A"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /reveal full record/i }));

    // The reason modal: confirm is disabled until a non-empty reason is entered.
    const confirm = await screen.findByRole("button", { name: /record reason and reveal/i });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/reason or ticket reference/i), "SUPPORT-1042");
    expect(confirm).toBeEnabled();
  });
});

describe("UsersScreen audit-before-data ordering", () => {
  it("calls recordAudit BEFORE the full-record fetch resolves", async () => {
    const user = userEvent.setup();
    sessionMock.role = "dsar_handler";

    const order: string[] = [];
    const auditSpy = vi
      .spyOn(adminApi, "recordAudit")
      .mockImplementation(async () => {
        order.push("audit");
      });
    const recordSpy = vi
      .spyOn(adminApi, "getUserFullRecord")
      .mockImplementation(async (id) => {
        order.push("record");
        // Resolve to a minimal synthetic record so the reveal renders.
        return {
          summary: {
            id,
            displayName: "Demo Coordinator A",
            email: "coordinator.a@example.test",
            status: "active",
            planTier: "standard",
            recipientCount: 1,
            joined: "2026-01-12",
          },
          recipients: [],
          contextNotePresent: false,
        };
      });

    renderScreen();
    await user.type(screen.getByRole("searchbox"), "Coordinator A");
    await user.click(await screen.findByText("Demo Coordinator A"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /reveal full record/i }));
    await user.type(screen.getByLabelText(/reason or ticket reference/i), "SUPPORT-1042");
    await user.click(screen.getByRole("button", { name: /record reason and reveal/i }));

    await waitFor(() => expect(recordSpy).toHaveBeenCalled());
    expect(auditSpy).toHaveBeenCalled();
    // The audit write happened, and it happened BEFORE the record fetch.
    expect(order).toEqual(["audit", "record"]);
    // The reason rode along to the audit event.
    expect(auditSpy.mock.calls[0][0]).toMatchObject({
      action: "users.read_full",
      role: "dsar_handler",
      reason: "SUPPORT-1042",
    });
  });
});

describe("UsersScreen context_note: presence, never contents", () => {
  it("shows the note PRESENCE on reveal, and the body only after the separate gated action", async () => {
    const user = userEvent.setup();
    sessionMock.role = "dsar_handler";
    renderScreen();

    // u-0001 (Demo Coordinator A) has a context note present.
    await user.type(screen.getByRole("searchbox"), "Coordinator A");
    await user.click(await screen.findByText("Demo Coordinator A"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /reveal full record/i }));
    await user.type(screen.getByLabelText(/reason or ticket reference/i), "SUPPORT-1042");
    await user.click(screen.getByRole("button", { name: /record reason and reveal/i }));

    // After the reveal: presence is shown, the body is NOT.
    expect(await screen.findByText(/A context note is present/i)).toBeInTheDocument();
    expect(screen.queryByText(/This placeholder stands in for a Coordinator's free-text note/i)).not.toBeInTheDocument();

    // The separate, further-gated note reveal.
    await user.click(screen.getByRole("button", { name: /view note \(records a reason\)/i }));
    await user.type(screen.getByLabelText(/reason or ticket reference/i), "SUPPORT-1042-note");
    await user.click(screen.getByRole("button", { name: /record reason and view note/i }));

    // Now (and only now) the synthetic note body appears.
    expect(await screen.findByText(/This placeholder stands in for a Coordinator's free-text note/i)).toBeInTheDocument();
  });
});

describe("UsersScreen brand tokens", () => {
  it("emits no off-brand hardcoded hex in the rendered markup", async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.type(screen.getByRole("searchbox"), "Coordinator");
    await screen.findByText("Demo Coordinator A");
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(html.toLowerCase()).not.toContain("738271");
    expect(html.toLowerCase()).not.toContain("2563eb");
    expect(html.toLowerCase()).not.toContain("3b82f6");
  });
});
