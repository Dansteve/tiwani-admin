import { SystemHealthScreen } from "@/features/system/SystemHealthScreen";

// The System module: a read-only operational status page (infrastructure status + diagnostics). The route
// segment stays thin; the screen lives in the system feature. Visible to all staff roles (no write-gating):
// it carries no family-user data, only infrastructure status, read through the admin-api seam.
export default function SystemPage() {
  return <SystemHealthScreen />;
}
