import { DashboardScreen } from "@/features/dashboard/DashboardScreen";

// The back-office home (dashboard). The actual overview lives in the DashboardScreen feature (the
// route segment stays thin). Reached at "/" inside the (admin) group, behind the server-side staff gate.
export default function DashboardPage() {
  return <DashboardScreen />;
}
