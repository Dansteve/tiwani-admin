// The (admin) route group: every authenticated staff screen renders inside the AdminShell (the sidebar
// to bottom-tabs responsive frame). /login is deliberately OUTSIDE this group (no shell, no session
// needed), so the middleware redirect target renders cleanly. The staff-auth gate itself is enforced in
// middleware.ts (server-side, before this layout runs), per Decisions.md D16.
//
// The data-source banner + the MOCK <-> LIVE toggle render HERE (once, above the page content) so they
// sit on EVERY admin page, not just the dashboard. The role is resolved SERVER-side from the staff session
// cookie (the settings page pattern; the cookie is httpOnly, so it cannot be read client-side) and passed
// to the banner, which gates the live switch behind roles.manage. Falls back to the stub identity if the
// cookie is absent / unparseable.

import { cookies } from "next/headers";

import { AdminShell } from "@/components/AdminShell";
import { PreProductionBanner } from "@/features/dashboard/PreProductionBanner";
import {
  STAFF_SESSION_COOKIE,
  STUB_STAFF,
  decodeStaffSession,
} from "@/lib/staff-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const session = decodeStaffSession(store.get(STAFF_SESSION_COOKIE)?.value) ?? STUB_STAFF;

  return (
    <AdminShell>
      <PreProductionBanner role={session.role} />
      {children}
    </AdminShell>
  );
}
