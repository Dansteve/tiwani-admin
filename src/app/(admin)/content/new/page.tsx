import { ContentFormScreen } from "@/features/content/ContentFormScreen";

// The "create content" route. The form is RBAC-gated (content.write): a role without the grant is sent
// back to the list by ContentFormScreen, mirroring the hidden CTA, so the route is defensive too.
export default function NewContentPage() {
  return <ContentFormScreen />;
}
