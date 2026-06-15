// Pure presentation maps for the Blog module: a blog-post status to its display label, its Badge variant
// (a brand STATE token, never an off-palette hex), and its icon. Kept as a separate, side-effect-free
// module so the mappings carry a unit test and the screens stay declarative. Status is colour + label +
// icon (never colour alone), per the accessibility rule. Mirrors contentLabels.ts.

import type { LucideIcon } from "lucide-react";
import { CircleDashed, CheckCircle2 } from "lucide-react";

import type { BlogStatus } from "@/lib/mock/blog";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

/** A label + Badge variant + icon for a value, the shape the status chip renders from. */
export interface DisplayMeta {
  label: string;
  variant: BadgeVariant;
  icon: LucideIcon;
}

// Blog status -> chip. draft = secondary (neutral, not yet public), published = success (live, served by
// the public read API). The task pins these two mappings.
const BLOG_STATUS_META: Record<BlogStatus, DisplayMeta> = {
  draft: { label: "Draft", variant: "secondary", icon: CircleDashed },
  published: { label: "Published", variant: "success", icon: CheckCircle2 },
};

/** The chip meta for a blog-post status. */
export function blogStatusMeta(status: BlogStatus): DisplayMeta {
  return BLOG_STATUS_META[status];
}

/** The ordered blog-status options for the create / edit form's select. */
export const BLOG_STATUS_OPTIONS: { value: BlogStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];
