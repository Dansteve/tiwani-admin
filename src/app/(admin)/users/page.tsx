import { UsersScreen } from "@/features/users/UsersScreen";

// The Users module (E2): the search-first, field-minimised Coordinator support view. The full sensitive
// record sits behind a higher-privilege, reason-required, separately-logged reveal inside the detail
// surface (Decisions.md D16, the DPO red lines). Everything renders against the mock seam; no real data.
export default function UsersPage() {
  return <UsersScreen />;
}
