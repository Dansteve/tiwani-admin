import { ReportingScreen } from "@/features/reporting/ReportingScreen";

// The Reporting module: aggregate, non-identifying platform analytics (Decisions.md D16, README red
// line 9). The route segment stays thin; the screen lives in the reporting feature, behind the
// server-side staff gate.
export default function ReportingPage() {
  return <ReportingScreen />;
}
