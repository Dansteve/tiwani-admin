// MOCK DATA, pre-production. NOT real user data. Replaced by the audited tiwani-admin-api (D16) behind
// the launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test).
//
// Synthetic blog posts (the marketing / knowledge blog the Admin authors: caregiving tips and product
// news). No user data; these are staff-authored editorial posts, a LOWER-sensitivity surface than the
// cross-tenant user views. Obviously placeholder.
//
// The store is MUTABLE in-memory for the demo so the seam's write methods (createBlogPost /
// updateBlogPost / setBlogPostStatus, in admin-api/client.ts) can show edits without a backend. None of
// this persists; a reload restores the seed. When the audited admin-api lands, every write becomes a
// logged, reason-required admin-api mutation and this in-memory store goes away.
//
// THE PUBLIC-RENDER SEAM (see docs/BLOG.md for the full flow). The Admin DETERMINES blog content here
// (authors / edits / publishes). PUBLISHED posts will later be persisted by the audited tiwani-admin-api,
// then exposed by a SEPARATE PUBLIC, UNAUTHENTICATED read API (e.g. GET /api/public/blog on the family
// tiwani-api, no staff auth, only status="published" and only the public fields), which the public
// WEBSITE (tiwani-website) renders. The public read API and the website page are FOLLOW-UPS, not built
// here. getMockPublishedBlogPosts() below models EXACTLY what that public endpoint will expose: the
// published subset, stripped to the PublicBlogPost fields (no drafts, no internal-only fields like
// `status` or `updatedAt`). Keep it as the contract: a draft or an internal field must never leak to it.

/** A blog post's lifecycle state. Only "published" posts are ever exposed to the public read API. */
export type BlogStatus = "draft" | "published";

/** A blog post the Admin authors. The full internal record (what staff see and edit). */
export interface BlogPost {
  id: string;
  title: string;
  /** The URL slug the public site routes on (e.g. /blog/<slug>). Lowercase, hyphenated, unique. */
  slug: string;
  /** A short summary shown in lists / cards / previews. */
  excerpt: string;
  /** The body copy. Plain text in the mock; no rich text, no user data. */
  body: string;
  /** An optional cover image URL (a public asset URL, never personal data). */
  coverImageUrl?: string;
  /** The author's display name (a staff byline, not a family user). */
  author: string;
  status: BlogStatus;
  /** An ISO date string for when the post was published; absent while it is a draft. */
  publishedAt?: string;
  /** Optional free-tagging labels for grouping on the public site. */
  tags?: string[];
  /** An ISO date string for when the post was last updated (an INTERNAL field, not public). */
  updatedAt: string;
}

/** The fields a create / edit form supplies (everything the staff author controls). */
export interface BlogPostInput {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl?: string;
  author: string;
  status: BlogStatus;
  tags?: string[];
}

/**
 * The PUBLIC shape: exactly what the future public, unauthenticated read API will expose for a published
 * post. A DISTINCT, narrower type than BlogPost so the internal-only fields (`status`, `updatedAt`)
 * cannot ride along to the public surface. `publishedAt` is required here (a published post always has
 * one). This is the contract getMockPublishedBlogPosts() returns and the website renders.
 */
export interface PublicBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl?: string;
  author: string;
  publishedAt: string;
  tags?: string[];
}

const SEED_POSTS: BlogPost[] = [
  {
    id: "b-0001",
    title: "Five ways to make a new routine feel familiar",
    slug: "make-a-new-routine-feel-familiar",
    excerpt: "Small, repeatable steps that help a new routine settle without a stressful first try.",
    body: "Walk the routine through the day before. Name each step in the same order every time. Keep the first run short, and build from there.",
    coverImageUrl: "https://placehold.co/1200x630?text=Routines",
    author: "TIWANI Team",
    status: "published",
    publishedAt: "2026-05-04",
    tags: ["caregiving tips", "routines"],
    updatedAt: "2026-05-04",
  },
  {
    id: "b-0002",
    title: "Planning a calm journey: a sensory-aware checklist",
    slug: "planning-a-calm-journey",
    excerpt: "What to pack and plan so a journey stays calm from the first step to the last.",
    body: "Pack the comfort items first. Plan one quiet stop along the way. Share the route in advance so nothing on the journey is a surprise.",
    coverImageUrl: "https://placehold.co/1200x630?text=Journeys",
    author: "TIWANI Team",
    status: "published",
    publishedAt: "2026-04-20",
    tags: ["caregiving tips", "travel"],
    updatedAt: "2026-04-20",
  },
  {
    id: "b-0003",
    title: "Product news: share a read-only Continuity Card",
    slug: "share-a-read-only-continuity-card",
    excerpt: "Coordinators can now share a Continuity Card with a trusted helper using a short join code.",
    body: "A short note on the new typed join code, which lets a Coordinator share a read-only Continuity Card with a trusted helper, with no personal data in the code itself.",
    author: "TIWANI Team",
    status: "published",
    publishedAt: "2026-05-22",
    tags: ["product news"],
    updatedAt: "2026-05-22",
  },
  {
    id: "b-0004",
    title: "A plain-language intro to the six Life Chapters",
    slug: "intro-to-the-six-life-chapters",
    excerpt: "What each Life Chapter covers, and a gentle way to begin with just one.",
    body: "An overview of the six Life Chapters, what each one covers, and why starting with a single chapter is often the calmest way in.",
    author: "TIWANI Team",
    status: "draft",
    tags: ["caregiving tips", "getting started"],
    updatedAt: "2026-06-09",
  },
];

// The mutable in-memory store. Seeded from a deep copy so resetMockBlogPosts() can restore the originals.
let store: BlogPost[] = SEED_POSTS.map((post) => clonePost(post));
let nextId = SEED_POSTS.length + 1;

/** Return the synthetic blog-post list (a copy, so callers cannot mutate the store directly). */
export function getMockBlogPosts(): BlogPost[] {
  return store.map((post) => clonePost(post));
}

/** Return a single post by id (a copy), or null if not found. */
export function getMockBlogPost(id: string): BlogPost | null {
  const post = store.find((item) => item.id === id);
  return post ? clonePost(post) : null;
}

/**
 * Return the PUBLIC subset: only published posts, mapped to the PublicBlogPost shape (the internal-only
 * `status` and `updatedAt` are dropped). This is the exact contract the future public read API exposes
 * and the website renders. A draft or an internal field must never appear here.
 */
export function getMockPublishedBlogPosts(): PublicBlogPost[] {
  return store
    .filter((post) => post.status === "published")
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: post.body,
      coverImageUrl: post.coverImageUrl,
      author: post.author,
      // A published post always has a publishedAt; fall back to updatedAt defensively so the public type
      // (where it is required) always holds even for a hand-seeded row that omitted it.
      publishedAt: post.publishedAt ?? post.updatedAt,
      tags: post.tags,
    }));
}

/** Append a new post (mock write). Returns the created post. */
export function addMockBlogPost(input: BlogPostInput): BlogPost {
  const created: BlogPost = {
    id: `b-${String(nextId).padStart(4, "0")}`,
    ...normaliseInput(input),
    // A post created directly as published is stamped now; a draft has no publishedAt yet.
    publishedAt: input.status === "published" ? today() : undefined,
    updatedAt: today(),
  };
  nextId += 1;
  store = [created, ...store];
  return clonePost(created);
}

/** Replace an existing post's fields (mock write). Returns the updated post, or null if not found. */
export function editMockBlogPost(id: string, input: BlogPostInput): BlogPost | null {
  const index = store.findIndex((post) => post.id === id);
  if (index === -1) return null;
  const previous = store[index];
  const updated: BlogPost = {
    ...previous,
    ...normaliseInput(input),
    // Stamp publishedAt the first time a post becomes published; clear it if it returns to draft.
    publishedAt:
      input.status === "published" ? (previous.publishedAt ?? today()) : undefined,
    updatedAt: today(),
  };
  store = store.map((post, i) => (i === index ? updated : post));
  return clonePost(updated);
}

/** Set just a post's status (mock write for publish / unpublish). Returns it, or null if not found. */
export function setMockBlogPostStatus(id: string, status: BlogStatus): BlogPost | null {
  const index = store.findIndex((post) => post.id === id);
  if (index === -1) return null;
  const previous = store[index];
  const updated: BlogPost = {
    ...previous,
    status,
    publishedAt: status === "published" ? (previous.publishedAt ?? today()) : undefined,
    updatedAt: today(),
  };
  store = store.map((post, i) => (i === index ? updated : post));
  return clonePost(updated);
}

/** Restore the seed (used by tests so each run starts from a known store). */
export function resetMockBlogPosts(): void {
  store = SEED_POSTS.map((post) => clonePost(post));
  nextId = SEED_POSTS.length + 1;
}

/** Normalise an input: trim the text fields and drop empty optional values so the store stays clean. */
function normaliseInput(input: BlogPostInput): Omit<BlogPostInput, "tags"> & { tags?: string[] } {
  const coverImageUrl = input.coverImageUrl?.trim();
  const tags = input.tags?.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  return {
    title: input.title.trim(),
    slug: input.slug.trim(),
    excerpt: input.excerpt.trim(),
    body: input.body.trim(),
    author: input.author.trim(),
    status: input.status,
    coverImageUrl: coverImageUrl ? coverImageUrl : undefined,
    tags: tags && tags.length > 0 ? tags : undefined,
  };
}

/** A deep-enough copy of a post (the tags array is copied so a caller cannot mutate the store's array). */
function clonePost(post: BlogPost): BlogPost {
  return { ...post, tags: post.tags ? [...post.tags] : undefined };
}

/** Today's date as an ISO date string (YYYY-MM-DD), for the mock "updated" / "published" stamps. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
