import { BlogScreen } from "@/features/blog/BlogScreen";

// The Blog module route. The managed blog-post list, read through the adminApi seam (mock today; an
// audited admin-api tomorrow). Writes are RBAC-gated inside the screen (content.write).
export default function BlogPage() {
  return <BlogScreen />;
}
