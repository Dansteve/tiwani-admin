// Pure presentation maps for the Content module: a content type / status / care-context to its display
// label, its Badge variant (a brand STATE token, never an off-palette hex), and its icon. Kept as a
// separate, side-effect-free module so the mappings carry a unit test and the screens stay declarative.
// Status is colour + label + icon (never colour alone), per the accessibility rule.

import type { LucideIcon } from "lucide-react";
import {
  CircleDashed,
  CheckCircle2,
  Archive,
  Lightbulb,
  BookOpen,
  Megaphone,
  Clock,
  MailCheck,
} from "lucide-react";

import type { ContentStatus, ContentType } from "@/lib/mock/content";
import type { CareContext, WaitlistStatus } from "@/lib/mock/waitlist";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

/** A label + Badge variant + icon for a value, the shape every status chip renders from. */
export interface DisplayMeta {
  label: string;
  variant: BadgeVariant;
  icon: LucideIcon;
}

// Content status -> chip. draft = secondary (neutral), published = success (live), archived = outline
// (retired). The task pins these three mappings.
const CONTENT_STATUS_META: Record<ContentStatus, DisplayMeta> = {
  draft: { label: "Draft", variant: "secondary", icon: CircleDashed },
  published: { label: "Published", variant: "success", icon: CheckCircle2 },
  archived: { label: "Archived", variant: "outline", icon: Archive },
};

// Content type -> a plain label + icon (shown as an outline chip so it does not compete with the status).
const CONTENT_TYPE_META: Record<ContentType, { label: string; icon: LucideIcon }> = {
  strategy: { label: "Strategy", icon: Lightbulb },
  resource: { label: "Resource", icon: BookOpen },
  announcement: { label: "Announcement", icon: Megaphone },
};

// Care-context -> a plain label (the website's waitlist captures these; D8 lifespan scope).
const CARE_CONTEXT_LABEL: Record<CareContext, string> = {
  child: "Child care",
  older_adult: "Older-adult care",
  long_term_condition: "Long-term condition",
  professional: "Professional",
};

// Waitlist status -> chip. pending = secondary (not yet actioned), contacted = success (actioned).
const WAITLIST_STATUS_META: Record<WaitlistStatus, DisplayMeta> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  contacted: { label: "Contacted", variant: "success", icon: MailCheck },
};

/** The chip meta for a content status. */
export function contentStatusMeta(status: ContentStatus): DisplayMeta {
  return CONTENT_STATUS_META[status];
}

/** The label + icon for a content type. */
export function contentTypeMeta(type: ContentType): { label: string; icon: LucideIcon } {
  return CONTENT_TYPE_META[type];
}

/** The plain label for a care-context. */
export function careContextLabel(context: CareContext): string {
  return CARE_CONTEXT_LABEL[context];
}

/** The chip meta for a waitlist status. */
export function waitlistStatusMeta(status: WaitlistStatus): DisplayMeta {
  return WAITLIST_STATUS_META[status];
}

/** The ordered content-type options for the create / edit form's select. */
export const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: "strategy", label: "Strategy" },
  { value: "resource", label: "Resource" },
  { value: "announcement", label: "Announcement" },
];

/** The ordered content-status options for the create / edit form's select. */
export const CONTENT_STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];
