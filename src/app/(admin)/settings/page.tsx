import { cookies } from "next/headers";

import { SettingsScreen } from "@/features/settings/SettingsScreen";
import {
  STAFF_SESSION_COOKIE,
  STUB_STAFF,
  decodeStaffSession,
} from "@/lib/staff-session";

// The Settings module: platform settings + RBAC visibility (Decisions.md D16). The route segment reads
// the staff session cookie SERVER-SIDE (it is httpOnly, so it cannot be read in the client) and passes
// the resolved session to the screen, so the role-driven gates (role management, the matrix fallback)
// reflect who is signed in. Falls back to the stub identity if the cookie is absent / unparseable.
export default async function SettingsPage() {
  const store = await cookies();
  const session = decodeStaffSession(store.get(STAFF_SESSION_COOKIE)?.value) ?? STUB_STAFF;

  return <SettingsScreen session={session} />;
}
