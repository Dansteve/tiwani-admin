// MOCK DATA, pre-production. NOT real user data. Replaced by the audited tiwani-admin-api (D16) behind
// the launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test).
//
// Synthetic content-management records (the Strategy Library / governed-copy surface a future Content
// module manages). No user data; these are platform content items. Obviously placeholder.

/** A content item's lifecycle state. */
export type ContentStatus = "draft" | "published" | "archived";

/** A managed content item (a strategy, a governed-copy block, a knowledge-base entry). */
export interface AdminContentItem {
  id: string;
  title: string;
  /** Which surface it belongs to, in plain words. */
  category: string;
  status: ContentStatus;
  /** A pre-rendered "last updated" label for the mock. */
  updated: string;
}

const MOCK_CONTENT: AdminContentItem[] = [
  {
    id: "c-0001",
    title: "Predictable arrival routine",
    category: "Strategy Library",
    status: "published",
    updated: "2026-05-02",
  },
  {
    id: "c-0002",
    title: "Sensory-aware travel checklist",
    category: "Strategy Library",
    status: "published",
    updated: "2026-04-18",
  },
  {
    id: "c-0003",
    title: "If things get difficult (card boundary copy)",
    category: "Governed copy",
    status: "published",
    updated: "2026-03-30",
  },
  {
    id: "c-0004",
    title: "Community signposting (adult social care)",
    category: "Signposting",
    status: "draft",
    updated: "2026-06-01",
  },
];

/** Return the synthetic content-item list. */
export function getMockContent(): AdminContentItem[] {
  return MOCK_CONTENT;
}
