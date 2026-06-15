import { getMockContent } from "@/lib/mock/content";

import { ContentEditClient } from "./ContentEditClient";

// The "edit content" route. Under the SSR build this is rendered on demand for any id. Under the
// static-export build (output: "export"), every dynamic segment must enumerate its params, so
// generateStaticParams returns the seed content ids and Next emits one html shell per id. The page renders
// a CLIENT child that reads the id from the live URL via useParams(), so the emitted html shells are
// interchangeable: a demo-created id (not known at build time) is served one of the seed htmls by the
// Firebase rewrite (firebase.json), and the client resolves the REAL id from the browser path at runtime.
// The id is therefore never baked into the markup, so ANY id works.

// Enumerate the seed ids so the export has a concrete html per known item (and a shell for the rewrite to
// fall back on). The list is the synthetic mock; the rewrite + client useParams() cover every other id.
export function generateStaticParams() {
  return getMockContent().map((item) => ({ id: item.id }));
}

export default function EditContentPage() {
  return <ContentEditClient />;
}
