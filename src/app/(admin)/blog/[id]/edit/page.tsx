import { BlogFormScreen } from "@/features/blog/BlogFormScreen";

// The "edit post" route. The form is RBAC-gated (content.write); the post id is read on the client from
// the route so the screen can load it from the seam (the params are awaited here for Next 15+).
export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogFormScreen id={id} />;
}
