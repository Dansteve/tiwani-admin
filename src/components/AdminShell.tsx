"use client";

// The admin shell: a desktop sidebar that becomes mobile bottom tabs (mirrors the family app's AppShell
// + Docs/Brand.md responsiveness rule). Mobile-first: the bottom tab bar is the default, the sidebar
// appears at lg and up. The header shows the TIWANI Wordmark with a small calm "Admin" qualifier so staff
// know which surface they are on without it shouting (the product UI name is "TIWANI Admin"). The five
// destinations are the FULL set, so the Phase-2 modules (Users / Content / Reporting / Settings) just fill
// their routes.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, FileText, BarChart3, Settings, Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { isActive, type NavItem } from "@/components/adminNav";
import { SecondaryNavMenu } from "@/components/SecondaryNavMenu";
import { SignOutButton } from "@/features/auth/SignOutButton";

// The PRIMARY destinations: Dashboard is the root ("/"); the rest are the core module routes. These five
// are the mobile bottom-tab set (a bottom bar of five tabs stays at comfortable 44px+ tap widths; a sixth
// would crowd it), so a new destination goes to SECONDARY_NAV, not here.
const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/users", label: "Users", icon: Users },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/reporting", label: "Reporting", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

// The SECONDARY destinations: the desktop sidebar lists them inline below the primary set, and the mobile
// "More" menu surfaces them, so the mobile bottom bar stays at five tabs. Blog (authored content) lives
// here so the bottom bar does not grow.
const SECONDARY_NAV: NavItem[] = [
  { href: "/blog", label: "Blog", icon: Newspaper },
];

// The desktop sidebar lists every destination inline (primary then secondary), so a desktop user never
// needs a "More" menu.
const SIDEBAR_NAV: NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV];

/** The small calm qualifier under the wordmark, so staff know this is the Admin surface (not shouty). */
function AdminQualifier({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      Admin
    </span>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Desktop sidebar (lg and up). */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <div className="flex items-center justify-between gap-2 pl-2">
          <Link href="/" aria-label="TIWANI Admin" className="inline-flex items-center gap-2">
            <Wordmark className="text-xl" />
          </Link>
          {/* Quick theme toggle in the shell header; the full selector lives in Settings. */}
          <ThemeToggle variant="icon" />
        </div>
        <AdminQualifier className="mt-2 self-start" />

        <nav className="mt-8 flex flex-col gap-1" aria-label="Primary">
          {SIDEBAR_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out sits at the bottom of the sidebar (mobile signs out from the "More" menu). */}
        <SignOutButton variant="nav" className="mt-auto" />
      </aside>

      {/* Content: room for the sidebar on desktop, room for the bottom tabs on mobile. */}
      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 lg:pb-10 lg:pt-10">
          {/* Mobile top bar (below lg), STICKY (top-0) so it stays put as the page scrolls. A compact
              utility bar: the small TIWANI mark (T + dot) links HOME to the dashboard with the "Admin"
              qualifier; then the theme toggle and the "More" menu (which on mobile carries the sign-out
              control, since the sidebar foot is desktop-only). Full-bleed (-mx-4 px-4) with an opaque
              background + a bottom divider so content scrolls cleanly beneath it. The desktop sidebar
              carries the full mark + nav + sign-out, so this whole bar is lg:hidden. */}
          <div className="sticky top-0 z-30 -mx-4 mb-6 flex items-center gap-2 border-b border-border bg-background px-4 py-2.5 lg:hidden">
            <Link href="/" aria-label="TIWANI Admin" className="inline-flex shrink-0 items-center gap-2">
              <Wordmark mark className="text-xl" />
              <AdminQualifier />
            </Link>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <ThemeToggle variant="icon" />
              <SecondaryNavMenu
                pathname={pathname}
                items={SECONDARY_NAV}
                footer={<SignOutButton variant="menu" />}
              />
            </div>
          </div>
          {children}
        </main>
      </div>

      {/* Mobile bottom tabs (below lg). The five PRIMARY destinations fit comfortably at a 44px+ tap
          width; the secondary destinations (Blog) live in the "More" menu so the bar does not crowd. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {PRIMARY_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs",
                active ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
