import { BlogFormScreen } from "@/features/blog/BlogFormScreen";

// The "create post" route. The form is RBAC-gated (content.write): a role without the grant is sent back
// to the list by BlogFormScreen, mirroring the hidden CTA, so the route is defensive too.
export default function NewBlogPostPage() {
  return <BlogFormScreen />;
}
