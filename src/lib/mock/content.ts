// MOCK DATA, pre-production. NOT real user data. Replaced by the audited tiwani-admin-api (D16) behind
// the launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test).
//
// Synthetic content-management records (platform content the Content module manages: Strategy Library
// strategies, knowledge-base resources, and product announcements). No user data; these are platform
// content items, a LOWER-sensitivity surface than the cross-tenant user views. Obviously placeholder.
//
// The store is MUTABLE in-memory for the demo so the seam's write methods (createContent / updateContent
// / setContentStatus, in admin-api/client.ts) can show optimistic edits without a backend. None of this
// persists; a reload restores the seed. When the audited admin-api lands, every write becomes a logged,
// reason-required admin-api mutation and this in-memory store goes away.

/** The kind of platform content an item is. */
export type ContentType = "strategy" | "resource" | "announcement";

/** A content item's lifecycle state. */
export type ContentStatus = "draft" | "published" | "archived";

/** A managed platform-content item (a Strategy Library strategy, a resource, an announcement). */
export interface AdminContentItem {
  id: string;
  type: ContentType;
  title: string;
  /** A short one-line summary shown in lists / cards. */
  summary: string;
  /** The body copy. Plain text in the mock; no rich text, no user data. */
  body: string;
  status: ContentStatus;
  /** An ISO date string for when the item was last updated. */
  updatedAt: string;
}

/** The fields a create / edit form supplies (everything the staff author controls). */
export interface ContentInput {
  type: ContentType;
  title: string;
  summary: string;
  body: string;
  status: ContentStatus;
}

const SEED_CONTENT: AdminContentItem[] = [
  {
    id: "c-0001",
    type: "strategy",
    title: "Predictable arrival routine",
    summary: "A step-by-step routine to make arriving somewhere new feel familiar.",
    body: "Walk through the arrival the day before. Name each step in order. Keep the first visit short.",
    status: "published",
    updatedAt: "2026-05-02",
  },
  {
    id: "c-0002",
    type: "strategy",
    title: "Sensory-aware travel checklist",
    summary: "What to pack and plan so a journey stays calm.",
    body: "Pack the comfort items. Plan a quiet stop. Share the route in advance so it is not a surprise.",
    status: "published",
    updatedAt: "2026-04-18",
  },
  {
    id: "c-0003",
    type: "resource",
    title: "Community signposting (adult social care)",
    summary: "Where to find local, non-clinical community support.",
    body: "Links to local authority adult social care, carer support groups, and community signposting.",
    status: "draft",
    updatedAt: "2026-06-01",
  },
  {
    id: "c-0004",
    type: "announcement",
    title: "New: share a read-only Continuity Card",
    summary: "Coordinators can now share a card with a trusted helper.",
    body: "A short note announcing the typed join code for sharing a read-only Continuity Card.",
    status: "published",
    updatedAt: "2026-05-20",
  },
  {
    id: "c-0005",
    type: "resource",
    title: "Getting started with Life Chapters",
    summary: "A plain-language intro to the six Life Chapters.",
    body: "An overview resource explaining what each Life Chapter covers and how to begin.",
    status: "archived",
    updatedAt: "2026-02-10",
  },
];

// The mutable in-memory store. Seeded from a deep copy so resetMockContent() can restore the originals.
let store: AdminContentItem[] = SEED_CONTENT.map((item) => ({ ...item }));
let nextId = SEED_CONTENT.length + 1;

/** Return the synthetic content-item list (a copy, so callers cannot mutate the store directly). */
export function getMockContent(): AdminContentItem[] {
  return store.map((item) => ({ ...item }));
}

/** Append a new content item (mock write). Returns the created item. */
export function addMockContent(input: ContentInput): AdminContentItem {
  const created: AdminContentItem = {
    id: `c-${String(nextId).padStart(4, "0")}`,
    ...input,
    updatedAt: today(),
  };
  nextId += 1;
  store = [created, ...store];
  return created;
}

/** Replace an existing item's fields (mock write). Returns the updated item, or null if not found. */
export function editMockContent(id: string, input: ContentInput): AdminContentItem | null {
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated: AdminContentItem = { ...store[index], ...input, updatedAt: today() };
  store = store.map((item, i) => (i === index ? updated : item));
  return updated;
}

/** Set just an item's status (mock write for publish / unpublish / archive). Returns it, or null. */
export function setMockContentStatus(id: string, status: ContentStatus): AdminContentItem | null {
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated: AdminContentItem = { ...store[index], status, updatedAt: today() };
  store = store.map((item, i) => (i === index ? updated : item));
  return updated;
}

/** Restore the seed (used by tests so each run starts from a known store). */
export function resetMockContent(): void {
  store = SEED_CONTENT.map((item) => ({ ...item }));
  nextId = SEED_CONTENT.length + 1;
}

/** Today's date as an ISO date string (YYYY-MM-DD), for the mock "updated" stamp. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
