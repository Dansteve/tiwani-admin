// Content module component tests: the pure form validation, the RBAC write-gating on the screen, the
// content table's read-only-vs-write affordances, and the waitlist "mark contacted" action through the
// seam. These pin the brief's acceptance criteria (list + filter, form validation, RBAC gating, waitlist).
// next/navigation has no App Router context in jsdom, and the toast would mount sonner, so both are mocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ContentScreen } from "@/features/content/ContentScreen";
import { ContentTable } from "@/features/content/ContentTable";
import { WaitlistPanel } from "@/features/content/WaitlistPanel";
import { validateContent } from "@/features/content/ContentForm";
import { adminApi } from "@/lib/admin-api/client";
import type { AdminContentItem } from "@/lib/mock/content";
import type { WaitlistEntry } from "@/lib/mock/waitlist";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function withClient(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const CONTENT_ITEM: AdminContentItem = {
  id: "c-1",
  type: "strategy",
  title: "Test strategy",
  summary: "A short summary.",
  body: "The body.",
  status: "draft",
  updatedAt: "2026-05-01",
};

const WAITLIST_ENTRY: WaitlistEntry = {
  id: "w-1",
  email: "signup.a@example.test",
  careContext: "child",
  signedUpAt: "2026-05-01",
  status: "pending",
};

describe("validateContent", () => {
  it("flags missing title, summary, and body", () => {
    const errors = validateContent({ type: "strategy", title: "  ", summary: "", body: "", status: "draft" });
    expect(errors.title).toBeTruthy();
    expect(errors.summary).toBeTruthy();
    expect(errors.body).toBeTruthy();
  });

  it("returns no errors for a complete input", () => {
    const errors = validateContent({ type: "resource", title: "T", summary: "S", body: "B", status: "published" });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe("ContentScreen RBAC write-gating", () => {
  beforeEach(() => {
    // Deterministic + flush-friendly: the screen's two queries resolve to empty lists.
    vi.spyOn(adminApi, "getContent").mockResolvedValue([]);
    vi.spyOn(adminApi, "getWaitlist").mockResolvedValue([]);
  });

  it("shows the New content CTA and no read-only notice for an admin role", async () => {
    withClient(<ContentScreen role="role_admin" />);
    await screen.findByPlaceholderText(/search content/i);
    expect(screen.getByRole("link", { name: /new content/i })).toBeInTheDocument();
    expect(screen.queryByText("Read-only")).not.toBeInTheDocument();
  });

  it("shows a read-only notice and hides the CTA for a support_read role", async () => {
    withClient(<ContentScreen role="support_read" />);
    await screen.findByPlaceholderText(/search content/i);
    expect(screen.queryByRole("link", { name: /new content/i })).not.toBeInTheDocument();
    expect(screen.getByText("Read-only")).toBeInTheDocument();
  });
});

describe("ContentTable", () => {
  it("renders the item and its row-actions menu when writes are enabled", async () => {
    withClient(<ContentTable items={[CONTENT_ITEM]} isLoading={false} writeEnabled />);
    expect(await screen.findByText("Test strategy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /actions for test strategy/i })).toBeInTheDocument();
  });

  it("hides the row-actions menu for a read-only role but still lists the item", () => {
    withClient(<ContentTable items={[CONTENT_ITEM]} isLoading={false} writeEnabled={false} />);
    expect(screen.getByText("Test strategy")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actions for/i })).not.toBeInTheDocument();
  });
});

describe("WaitlistPanel", () => {
  it("hides the manage action when the role cannot manage the waitlist", () => {
    withClient(<WaitlistPanel entries={[WAITLIST_ENTRY]} isLoading={false} canManage={false} />);
    expect(screen.getByText("signup.a@example.test")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark .* as contacted/i })).not.toBeInTheDocument();
  });

  it("calls the seam to mark an entry contacted", async () => {
    const spy = vi
      .spyOn(adminApi, "markWaitlistContacted")
      .mockResolvedValue({ ...WAITLIST_ENTRY, status: "contacted" });
    withClient(<WaitlistPanel entries={[WAITLIST_ENTRY]} isLoading={false} canManage />);
    const button = await screen.findByRole("button", {
      name: /mark signup.a@example.test as contacted/i,
    });
    await userEvent.click(button);
    expect(spy).toHaveBeenCalledWith("w-1");
  });
});
