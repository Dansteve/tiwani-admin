// Shared navigation primitives for the admin shell: the NavItem shape, the active-route test, and the
// "new" dot. Mirrors the family app's appNav.tsx so the shell and the mobile "More" menu render the SAME
// item shape, active state, and signal, with no duplication and no import cycle (both leaf-import from
// here). Pure + presentational, so it carries no "use client" of its own.

import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** A nav item is active for its own route and any nested route under it (e.g. /users and /users/123). */
export function isActive(pathname: string, href: string): boolean {
  // "/" is the dashboard root: it is active ONLY on an exact match, never as a prefix of every route
  // (otherwise it would always look active). Every other item matches its route and any nested path.
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// The "new" indicator: a small CORAL dot. NEVER colour alone, the sr-only "(new)" makes a screen reader
// announce it, so the signal carries to assistive tech too (the accessibility rule).
export function NavDot() {
  return (
    <>
      <span className="size-2 shrink-0 rounded-full bg-tiwani-coral" aria-hidden="true" />
      <span className="sr-only">(new)</span>
    </>
  );
}
