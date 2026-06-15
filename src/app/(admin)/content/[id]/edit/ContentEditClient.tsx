"use client";

import { useParams } from "next/navigation";

import { ContentFormScreen } from "@/features/content/ContentFormScreen";

// The client half of the "edit content" route. It reads the item id from the LIVE URL (useParams), not from
// a build-time param, so the static-export html shells are interchangeable across ids: whichever shell the
// Firebase rewrite serves, this reads the real id from the browser path and loads that item from the
// mock/live seam. The form is RBAC-gated (content.write) inside ContentFormScreen.
export function ContentEditClient() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <ContentFormScreen id={id} />;
}
