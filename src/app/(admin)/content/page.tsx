import { ContentScreen } from "@/features/content/ContentScreen";

// The Content module route. The managed platform-content list + the waitlist sub-view, read through the
// adminApi seam (mock today; an audited admin-api tomorrow). Writes are RBAC-gated inside the screen.
export default function ContentPage() {
  return <ContentScreen />;
}
