// The AdminShell render test. It pins what the shell guarantees: the five PRIMARY destinations are present
// (in both the desktop sidebar and the mobile bottom bar), the SECONDARY destination (Blog) is on the
// desktop sidebar and reachable via the mobile "More" menu (not crowding the five-tab bottom bar), the
// brand Wordmark + the calm "Admin" qualifier show, the active route announces aria-current, every nav
// icon is aria-hidden with a real text label (accessibility), and NO off-brand hex leaks into the markup
// (the brand-token rule).

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// next/navigation: the shell reads usePathname. Pin it to the dashboard root.
vi.mock("next/navigation", () => ({
  usePathname: () => "/users",
}));

// next/link: stub to a plain anchor so it renders without the app-router runtime.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// The sign-out button POSTs to a server action; stub the actions module so jsdom does not try to run it.
vi.mock("@/features/auth/actions", () => ({
  signOut: vi.fn(),
  signIn: vi.fn(),
}));

// The theme toggle reads the ThemeProvider; render a real provider around the shell.
import { ThemeProvider } from "@/state/ThemeProvider";
import { AdminShell } from "@/components/AdminShell";

const PRIMARY_DESTINATIONS = ["Dashboard", "Users", "Content", "Reporting", "Settings"];

function renderShell() {
  return render(
    <ThemeProvider>
      <AdminShell>
        <div>page content</div>
      </AdminShell>
    </ThemeProvider>
  );
}

describe("AdminShell", () => {
  it("shows the brand wordmark and the calm 'Admin' qualifier", () => {
    renderShell();
    // The wordmark renders TIWANI (desktop) and the small mark "T" (mobile bar), so at least one of each.
    expect(screen.getAllByText("TIWANI").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("renders all five primary destinations in both the sidebar and the bottom bar", () => {
    renderShell();
    // Two Primary navs (the desktop sidebar + the mobile bottom bar): each carries the five primary
    // destinations.
    const navs = screen.getAllByRole("navigation", { name: "Primary" });
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      for (const label of PRIMARY_DESTINATIONS) {
        expect(within(nav).getByRole("link", { name: new RegExp(label, "i") })).toBeInTheDocument();
      }
    }
  });

  it("keeps the mobile bottom bar at exactly the five primary destinations (Blog is not a tab)", () => {
    renderShell();
    // The two Primary navs are the desktop sidebar (index 0) then the mobile bottom bar (index 1). The
    // bottom bar must stay at the five primary tabs: Blog goes to the "More" menu, not the bar.
    const navs = screen.getAllByRole("navigation", { name: "Primary" });
    const bottomBar = navs[1];
    expect(within(bottomBar).getAllByRole("link")).toHaveLength(PRIMARY_DESTINATIONS.length);
    expect(within(bottomBar).queryByRole("link", { name: /blog/i })).not.toBeInTheDocument();
  });

  it("lists Blog (the secondary destination) inline on the desktop sidebar", () => {
    renderShell();
    // The desktop sidebar (the first Primary nav) lists every destination inline, so a desktop user never
    // needs the "More" menu: it carries the five primary plus Blog.
    const sidebar = screen.getAllByRole("navigation", { name: "Primary" })[0];
    expect(within(sidebar).getByRole("link", { name: /blog/i })).toBeInTheDocument();
  });

  it("surfaces Blog via the mobile 'More' menu (so the bottom bar stays uncrowded)", async () => {
    renderShell();
    // The "More" disclosure is collapsed by default; opening it reveals the secondary destinations.
    const moreTrigger = screen.getByRole("button", { name: /more/i });
    await userEvent.click(moreTrigger);
    const moreMenu = screen.getByRole("navigation", { name: /more destinations/i });
    expect(within(moreMenu).getByRole("link", { name: /blog/i })).toBeInTheDocument();
  });

  it("marks the active route with aria-current in the sidebar", () => {
    renderShell();
    const navs = screen.getAllByRole("navigation", { name: "Primary" });
    // usePathname is /users: the Users link is current, Dashboard is not.
    for (const nav of navs) {
      expect(within(nav).getByRole("link", { name: /users/i })).toHaveAttribute(
        "aria-current",
        "page"
      );
      expect(within(nav).getByRole("link", { name: /dashboard/i })).not.toHaveAttribute(
        "aria-current"
      );
    }
  });

  it("renders the page content inside the shell", () => {
    renderShell();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("uses only TIWANI brand tokens, no off-brand hex in the markup", () => {
    const { container } = renderShell();
    const html = container.innerHTML;
    // No raw hex colours at all (everything resolves to tokens via Tailwind classes).
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}/);
    // The prototype grey-green and the Blackbird accent blue must never appear.
    expect(html.toLowerCase()).not.toContain("738271");
    expect(html.toLowerCase()).not.toContain("3b82f6");
  });

  it("gives every nav icon a text label and hides the icon from screen readers", () => {
    const { container } = renderShell();
    // Every lucide icon is an <svg aria-hidden="true"> (the text label carries the meaning).
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
