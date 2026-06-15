import { FileText } from "lucide-react";

import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// The Content module placeholder (managing the Strategy Library / governed-copy surface). Wired into the
// shell so the nav is whole; replaced by the Phase-2 Content screen.
export default function ContentPage() {
  return (
    <ModulePlaceholder
      title="Content"
      description="Manage the Strategy Library and governed-copy content. Governed alert copy stays inside its psychiatrist-signed bounds."
      icon={FileText}
    />
  );
}
