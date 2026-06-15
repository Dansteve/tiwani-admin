// The (admin) route group: every authenticated staff screen renders inside the AdminShell (the sidebar
// to bottom-tabs responsive frame). /login is deliberately OUTSIDE this group (no shell, no session
// needed), so the middleware redirect target renders cleanly. The staff-auth gate itself is enforced in
// middleware.ts (server-side, before this layout runs), per Decisions.md D16.

import { AdminShell } from "@/components/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
