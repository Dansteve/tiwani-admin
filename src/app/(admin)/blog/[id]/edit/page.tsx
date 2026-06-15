import { getMockBlogPosts } from "@/lib/mock/blog";

import { BlogEditClient } from "./BlogEditClient";

// The "edit post" route. Under the SSR build this is rendered on demand for any id. Under the static-export
// build (output: "export"), every dynamic segment must enumerate its params, so generateStaticParams
// returns the seed blog-post ids and Next emits one html shell per id. The page renders a CLIENT child that
// reads the id from the live URL via useParams(), so the emitted html shells are interchangeable: a
// demo-created id (not known at build time) is served one of the seed htmls by the Firebase rewrite
// (firebase.json), and the client resolves the REAL id from the browser path at runtime. The id is never
// baked into the markup, so ANY id works.

// Enumerate the seed ids so the export has a concrete html per known post (and a shell for the rewrite to
// fall back on). The list is the synthetic mock; the rewrite + client useParams() cover every other id.
export function generateStaticParams() {
  return getMockBlogPosts().map((post) => ({ id: post.id }));
}

export default function EditBlogPostPage() {
  return <BlogEditClient />;
}
