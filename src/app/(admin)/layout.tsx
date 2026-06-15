// The (admin) route group: every authenticated staff screen renders inside the AdminShell (the sidebar
// to bottom-tabs responsive frame). /login is deliberately OUTSIDE this group (no shell, no session
// needed), so the middleware redirect target renders cleanly.
//
// Two gates, one for each build posture (Decisions.md D16):
//   - SSR build (the production posture): the server middleware (src/middleware.ts) is the real edge gate,
//     redirecting to /login before this layout renders.
//   - STATIC-EXPORT build (npm run build:static, the mock demo): middleware does not run on static hosting,
//     so StaffSessionGuard (a client component) is the gate, checking the cookie on mount.
// StaffSessionGuard mounts in both builds (a harmless second check under SSR), so the static demo still
// gates the shell. This layout no longer reads cookies() (a server-only API unavailable under export):
// the role is resolved CLIENT-side inside PreProductionBanner (useStaffRole), which keeps the whole (admin)
// tree static-exportable while leaving the roles.manage gating intact.

import { AdminShell } from "@/components/AdminShell";
import { StaffSessionGuard } from "@/components/StaffSessionGuard";
import { PreProductionBanner } from "@/features/dashboard/PreProductionBanner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <StaffSessionGuard />
      <PreProductionBanner />
      {children}
    </AdminShell>
  );
}
