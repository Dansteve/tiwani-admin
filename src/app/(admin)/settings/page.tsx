"use client";

import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { useStaffSession } from "@/lib/use-staff-session";

// The Settings module: platform settings + RBAC visibility (Decisions.md D16). The staff session is now
// resolved CLIENT-side (useStaffSession reads the same cookie the server middleware checks), instead of via
// cookies() server-side, so this route renders under the static-export build (output: "export" forbids the
// server-only request APIs). The role-driven gates (role management, the matrix fallback) reflect who is
// signed in exactly as before; the fallback to the stub identity lives in the hook. This is fine for SSR
// too: the gates are affordance-only, the real boundary is the future admin-api.
export default function SettingsPage() {
  const session = useStaffSession();
  return <SettingsScreen session={session} />;
}
