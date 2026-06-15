import { BarChart3 } from "lucide-react";

import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// The Reporting module placeholder (aggregate, non-identifying platform metrics). Wired into the shell so
// the nav is whole; replaced by the Phase-2 Reporting screen.
export default function ReportingPage() {
  return (
    <ModulePlaceholder
      title="Reporting"
      description="Aggregate, non-identifying platform metrics and trends. Built from minimised data, never a whole-population browse of records."
      icon={BarChart3}
    />
  );
}
