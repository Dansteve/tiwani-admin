import { ContentFormScreen } from "@/features/content/ContentFormScreen";

// The "edit content" route. The form is RBAC-gated (content.write); the item id is read on the client
// from the route so the screen can load it from the seam (the params are awaited here for Next 15+).
export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContentFormScreen id={id} />;
}
