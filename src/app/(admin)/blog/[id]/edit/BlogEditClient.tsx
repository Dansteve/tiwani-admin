"use client";

import { useParams } from "next/navigation";

import { BlogFormScreen } from "@/features/blog/BlogFormScreen";

// The client half of the "edit post" route. It reads the post id from the LIVE URL (useParams), not from a
// build-time param, so the static-export html shells are interchangeable across ids: whichever shell the
// Firebase rewrite serves, this reads the real id from the browser path and loads that post from the
// mock/live seam. The form is RBAC-gated (content.write) inside BlogFormScreen.
export function BlogEditClient() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <BlogFormScreen id={id} />;
}
