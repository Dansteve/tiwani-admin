// =============================================================================================
// THE ADMIN-API SEAM. This is the single typed client to the future tiwani-admin-api (D16).
//
// It reads a DATA-SOURCE MODE (lib/admin-api/mode.ts), flipped at runtime by the demo toggle:
//   - "mock" (the DEFAULT): every read DELEGATES to the clearly-labeled MOCK adapters (src/lib/mock/*).
//     NO network call, NO real data, NO service-role key (that credential lives ONLY in the admin-api
//     process, never in this frontend).
//   - "live": each read issues a `fetch` against NEXT_PUBLIC_ADMIN_API_URL via liveGet() below. The
//     admin-api only carries /health today (the data endpoints are not built yet), so a live read of a
//     data endpoint 404s: liveGet throws LiveEndpointUnavailableError, which the screens turn into a clean
//     empty state + a "this endpoint is not available yet" toast. If the URL is unset, liveGet throws a
//     clear "Live API not configured" error. The toggle is gated (roles.manage) so only a high role can
//     switch to live; nothing real is exposed (D16 still hard-gates real data behind the launch gates).
//
// The branch is a REUSABLE wrapper, seam(mockFn, path): every read method is one line, so a new method
// (e.g. the blog dev's) adopts the same mock/live behaviour by wrapping its mock call the same way. The
// method SIGNATURES are the contract the rest of the app codes against, so swapping the live body from a
// 404 to the audited endpoint later does not ripple into the screens. This is the one place the data seam
// lives, so there is no second data path scattered through the UI. Writes stay mock-only here (a live,
// audited, reason-required WRITE is a post-D16 admin-api concern).
// =============================================================================================

import {
  getMockMetrics,
  getMockActivity,
  getMockSignupTrend,
  getMockPlanDistribution,
  getMockContentCounts,
  getMockActiveUsersTrend,
  type AdminMetric,
  type ActivityItem,
  type TrendPoint,
  type PlanDistributionPoint,
  type ContentTypeCount,
  type ActiveUsersPoint,
} from "@/lib/mock/metrics";
import {
  getMockUsers,
  getMockUserDetail,
  getMockUserFullRecord,
  getMockContextNote,
  type AdminUserSummary,
  type AdminUserFullRecord,
} from "@/lib/mock/users";
import {
  getMockContent,
  addMockContent,
  editMockContent,
  setMockContentStatus,
  type AdminContentItem,
  type ContentInput,
  type ContentStatus,
} from "@/lib/mock/content";
import {
  getMockBlogPosts,
  getMockBlogPost,
  addMockBlogPost,
  editMockBlogPost,
  setMockBlogPostStatus,
  type BlogPost,
  type BlogPostInput,
  type BlogStatus,
} from "@/lib/mock/blog";
import {
  getMockWaitlist,
  markMockWaitlistContacted,
  type WaitlistEntry,
} from "@/lib/mock/waitlist";
import { getMockStaff, type StaffMember } from "@/lib/mock/staff";
import { getMockSystemHealth, type SystemHealth } from "@/lib/mock/system";
import { getDataMode } from "@/lib/admin-api/mode";

/**
 * A privileged-read audit event. In the real admin-api EVERY privileged read writes one of these to the
 * tamper-evident, append-only audit log BEFORE the data is returned (Decisions.md D16). The `reason`
 * (a ticket reference / free-text justification) is the accountability affordance that replaces the
 * family product's RLS for cross-tenant staff access. Modeled minimally here; the server owns the canonical
 * shape (staff id, role, action, target, reason, timestamp, request hash).
 */
export interface AdminAuditEvent {
  /** The audited action, e.g. "users.read_full" or "users.read_context_note". */
  action: string;
  /** The acting staff role (from the validated staff session in production; the stub role here). */
  role: string;
  /** The target record id the read concerns. */
  targetId: string;
  /** The mandatory reason / ticket reference. Never empty (the UI blocks an empty reason). */
  reason: string;
}

/** The audited admin-api base URL (unset in dev -> the client stays on the mocks). */
const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "";

/** Whether the real admin-api is configured. False in dev / pre-production (we use the mocks). */
export function isAdminApiConfigured(): boolean {
  return ADMIN_API_URL.trim().length > 0;
}

/**
 * Raised by liveGet when a live read reaches the admin-api but the endpoint is not available (the
 * admin-api carries only /health today, so the data endpoints 404). The screens catch it (by name) and
 * render a clean empty state plus a "this endpoint is not available yet" toast, rather than crashing. A
 * named class so callers can distinguish "not built yet" from a genuine network failure.
 */
export class LiveEndpointUnavailableError extends Error {
  constructor(
    public readonly path: string,
    public readonly status: number,
  ) {
    super(`Live API: ${path} is not available yet (status ${status}).`);
    this.name = "LiveEndpointUnavailableError";
  }
}

/**
 * A single GET against the live admin-api. Throws a clear error if the URL is unset (so the toggle's
 * "live" state fails loudly rather than silently doing nothing), and a LiveEndpointUnavailableError on any
 * non-ok response (the data endpoints are not built yet). Returns the parsed JSON body on success. This is
 * the one network primitive; every live read goes through it.
 */
export async function liveGet<T>(path: string): Promise<T> {
  if (!isAdminApiConfigured()) {
    throw new Error("Live API not configured (NEXT_PUBLIC_ADMIN_API_URL is unset).");
  }
  const base = ADMIN_API_URL.trim().replace(/\/+$/, "");
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new LiveEndpointUnavailableError(path, response.status);
  }
  return (await response.json()) as T;
}

/**
 * The reusable mock/live branch. In "mock" mode (the default) it runs the mock function; in "live" mode
 * it GETs the path from the admin-api. Every read method below is a one-line `seam(...)`, so a new method
 * adopts the same behaviour by wrapping its mock call the same way (a trivial, copy-paste-safe pattern).
 */
function seam<T>(mockFn: () => T | Promise<T>, path: string): Promise<T> {
  if (getDataMode() === "live") {
    return liveGet<T>(path);
  }
  return Promise.resolve(mockFn());
}

/**
 * The typed admin-api client. Each method is async (it WILL be a network call against the audited
 * admin-api) but currently resolves the mock synchronously. The async shape means the screens already
 * `await` it, so no call site changes when the real service lands.
 */
export const adminApi = {
  /** The dashboard KPI row. Mock (default) or a live GET; an aggregate, non-identifying reporting RPC. */
  async getMetrics(): Promise<AdminMetric[]> {
    return seam(() => getMockMetrics(), "/reporting/metrics");
  },

  /** The dashboard activity feed. Mock (default) or a live GET; a minimised, audit-logged feed. */
  async getActivity(): Promise<ActivityItem[]> {
    return seam(() => getMockActivity(), "/reporting/activity");
  },

  /**
   * The aggregate signup-trend series for the dashboard chart (counts per week). Mock (default) or a live
   * GET. Aggregate-only by design: it returns counts, never identities (the dashboard is aggregate-only,
   * README red line 9).
   */
  async getSignupTrend(): Promise<TrendPoint[]> {
    return seam(() => getMockSignupTrend(), "/reporting/signup-trend");
  },

  /**
   * The aggregate plan-tier distribution for the reporting chart (a count per tier). Mock (default) or a
   * live GET. Aggregate-only: a count per bucket, never an account (reporting is aggregate-only, README
   * red line 9).
   */
  async getPlanDistribution(): Promise<PlanDistributionPoint[]> {
    return seam(() => getMockPlanDistribution(), "/reporting/plan-distribution");
  },

  /**
   * The aggregate content-by-type counts for the reporting chart (a count per content type). Mock
   * (default) or a live GET. Aggregate-only: a count per type, never a content row.
   */
  async getContentCounts(): Promise<ContentTypeCount[]> {
    return seam(() => getMockContentCounts(), "/reporting/content-counts");
  },

  /**
   * The aggregate active-users series for the reporting chart (a count per week). Mock (default) or a live
   * GET. Aggregate-only: a count per week, never an identity.
   */
  async getActiveUsersTrend(): Promise<ActiveUsersPoint[]> {
    return seam(() => getMockActiveUsersTrend(), "/reporting/active-users");
  },

  /**
   * The staff list for Settings (read-only). Mock (default) or a live GET (staff.manage gated,
   * audit-logged). Carries no family-user data: these are staff members, not Coordinators.
   */
  async getStaff(): Promise<StaffMember[]> {
    return seam(() => getMockStaff(), "/staff");
  },

  /**
   * The System Health snapshot for the operational status page (services + diagnostics + overall roll-up).
   * Mock (default) or a live GET. The live form is the audited admin-api's `/system/health` aggregation,
   * which probes the real dependencies server-side. Carries NO family-user data: it is infrastructure
   * status only, so it is read-only and visible to all staff roles.
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return seam(() => getMockSystemHealth(), "/system/health");
  },

  /** The field-minimised Coordinator list (the E2 support view). Mock (default) or a live GET. */
  async getUsers(): Promise<AdminUserSummary[]> {
    return seam(() => getMockUsers(), "/users");
  },

  /**
   * A single Coordinator's MINIMISED detail (the default detail surface, NOT the sensitive record). Mock
   * (default) or a live GET. Returns null for an unknown id.
   */
  async getUser(id: string): Promise<AdminUserSummary | null> {
    return seam(() => getMockUserDetail(id), `/users/${id}`);
  },

  /**
   * The FULL sensitive record (the higher-privilege reveal). Reason-required: a caller passes the
   * mandatory ticket/justification, which in production the admin-api logs to the append-only audit log
   * BEFORE returning the record. Here the data is synthetic and the audit write is the separate
   * recordAudit() call the screen makes first; this method also guards an empty reason as a belt-and-braces
   * check so the seam never returns the record without one. Returns null for an unknown id.
   */
  async getUserFullRecord(
    id: string,
    reason: string,
  ): Promise<AdminUserFullRecord | null> {
    // SEAM: stays mock-only (it is NOT a plain GET). The live form is a reason-required, audit-logged POST
    // `/users/{id}/full-record` that writes the audit row server-side BEFORE returning; that reveal arrives
    // with the audited admin-api post-D16, so the mock/live toggle does not route it yet.
    if (!reason.trim()) {
      throw new Error("A reason is required to reveal the full record.");
    }
    return getMockUserFullRecord(id);
  },

  /**
   * The synthetic context-note BODY (the separate, further-gated reveal). A DISTINCT method from
   * getUserFullRecord so the note text cannot ride along with the record: viewing it is its own
   * reason-required, separately-logged action. Returns null when there is no note. Guards an empty reason.
   */
  async getContextNote(id: string, reason: string): Promise<string | null> {
    // SEAM: replace with a reason-required, audit-logged POST `/users/{id}/context-note` to the admin-api,
    // which writes its OWN audit row server-side BEFORE returning the note body.
    if (!reason.trim()) {
      throw new Error("A reason is required to view the context note.");
    }
    return getMockContextNote(id);
  },

  /**
   * Record a privileged-read audit event. In production this is the append-only audit-log write the
   * admin-api performs BEFORE any privileged read resolves; the screen calls it FIRST, then fetches, so the
   * audit-before-data ordering holds even in the stub. Today it is a stub that surfaces the event (a toast,
   * wired by the caller) and resolves; it never returns data. Replaced by the real audited write.
   */
  async recordAudit(event: AdminAuditEvent): Promise<void> {
    // SEAM: replace with `await this.#post("/audit", event)` against the append-only audit log. The real
    // privileged reads write their audit row server-side; this client-side call is the pre-production
    // stand-in that proves the ordering and shows the staff member what was logged.
    void event;
  },

  /** The managed-content list (the Content module). Mock (default) or a live GET. */
  async getContent(): Promise<AdminContentItem[]> {
    return seam(() => getMockContent(), "/content");
  },

  /**
   * Create a content item. Mock today (an in-memory append). When the audited admin-api lands this
   * becomes an authorized, reason-required, audit-logged WRITE (POST /content): the staff role's
   * content.write grant is checked server-side, not just in the UI. Returns the created item.
   */
  async createContent(input: ContentInput): Promise<AdminContentItem> {
    // SEAM: replace with `await this.#post<AdminContentItem>("/content", input)`.
    return addMockContent(input);
  },

  /**
   * Replace a content item's fields. Mock today (an in-memory edit). Becomes an audit-logged WRITE
   * (PUT /content/:id) behind the content.write grant. Returns the updated item, or null if missing.
   */
  async updateContent(id: string, input: ContentInput): Promise<AdminContentItem | null> {
    // SEAM: replace with `await this.#put<AdminContentItem>(`/content/${id}`, input)`.
    return editMockContent(id, input);
  },

  /**
   * Set just a content item's status (publish / unpublish / archive). Mock today (an in-memory status
   * flip). Becomes an audit-logged WRITE (PATCH /content/:id/status) behind the content.write grant.
   * Returns the updated item, or null if missing.
   */
  async setContentStatus(id: string, status: ContentStatus): Promise<AdminContentItem | null> {
    // SEAM: replace with `await this.#patch<AdminContentItem>(`/content/${id}/status`, { status })`.
    return setMockContentStatus(id, status);
  },

  // BLOG (the Blog module). The Admin AUTHORS posts here; PUBLISHED posts are later persisted by the
  // audited admin-api, then exposed by a SEPARATE public, unauthenticated read API and rendered on the
  // website (see docs/BLOG.md). Reads use the mock/live seam; writes stay mock-only (like content writes).

  /** The full blog-post list for the Blog module (drafts + published). Mock (default) or a live GET. */
  async getBlogPosts(): Promise<BlogPost[]> {
    return seam(() => getMockBlogPosts(), "/blog");
  },

  /** A single blog post by id (for the edit form). Mock (default) or a live GET. Null for an unknown id. */
  async getBlogPost(id: string): Promise<BlogPost | null> {
    return seam(() => getMockBlogPost(id), `/blog/${id}`);
  },

  /**
   * Create a blog post. Mock today (an in-memory append). When the audited admin-api lands this becomes an
   * authorized, audit-logged WRITE (POST /blog) behind the content.write grant (blog is authored content).
   * Returns the created post.
   */
  async createBlogPost(input: BlogPostInput): Promise<BlogPost> {
    // SEAM: replace with `await this.#post<BlogPost>("/blog", input)`.
    return addMockBlogPost(input);
  },

  /**
   * Replace a blog post's fields. Mock today (an in-memory edit). Becomes an audit-logged WRITE
   * (PUT /blog/:id) behind the content.write grant. Returns the updated post, or null if missing.
   */
  async updateBlogPost(id: string, input: BlogPostInput): Promise<BlogPost | null> {
    // SEAM: replace with `await this.#put<BlogPost>(`/blog/${id}`, input)`.
    return editMockBlogPost(id, input);
  },

  /**
   * Set just a blog post's status (publish / unpublish). Mock today (an in-memory status flip). Becomes an
   * audit-logged WRITE (PATCH /blog/:id/status) behind the content.write grant. Publishing is the gate to
   * the public read API: only status="published" posts are ever exposed publicly. Returns the updated
   * post, or null if missing.
   */
  async setBlogPostStatus(id: string, status: BlogStatus): Promise<BlogPost | null> {
    // SEAM: replace with `await this.#patch<BlogPost>(`/blog/${id}/status`, { status })`.
    return setMockBlogPostStatus(id, status);
  },

  /** The waitlist signups (the E1 surface). Mock (default) or a live GET. */
  async getWaitlist(): Promise<WaitlistEntry[]> {
    return seam(() => getMockWaitlist(), "/waitlist");
  },

  /**
   * Flip a waitlist signup to "contacted". Mock today (an in-memory status flip). Becomes an
   * audit-logged WRITE (PATCH /waitlist/:id) behind the waitlist.manage grant when the admin-api lands.
   * Returns the updated entry, or null if missing.
   */
  async markWaitlistContacted(id: string): Promise<WaitlistEntry | null> {
    // SEAM: replace with `await this.#patch<WaitlistEntry>(`/waitlist/${id}/contacted`, {})`.
    return markMockWaitlistContacted(id);
  },
};
