// =============================================================================================
// THE ADMIN-API SEAM (STUB). This is the single typed client to the future tiwani-admin-api (D16).
//
// Today it DELEGATES every read to the clearly-labeled MOCK adapters (src/lib/mock/*). There is NO
// network call, NO real data, NO service-role key (that credential lives ONLY in the admin-api process,
// never in this frontend). NEXT_PUBLIC_ADMIN_API_URL is unset in dev, so `isAdminApiConfigured()` is
// false and the client stays on the mocks.
//
// WHERE THE REAL SERVICE PLUGS IN: when the audited tiwani-admin-api exists, each method below stops
// returning the mock and instead issues a request to NEXT_PUBLIC_ADMIN_API_URL, carrying the staff
// session, hitting a narrow, default-deny, reason-required, audit-logged RPC (every privileged read is a
// named, logged operation; no raw service-role table access). The method SIGNATURES are the contract the
// rest of the app codes against, so swapping the body from "return the mock" to "fetch the audited
// endpoint" does not ripple into the screens. Until then this is the one place the mock seam lives, so
// there is no second data path scattered through the UI.
// =============================================================================================

import {
  getMockMetrics,
  getMockActivity,
  getMockSignupTrend,
  type AdminMetric,
  type ActivityItem,
  type TrendPoint,
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
  getMockWaitlist,
  markMockWaitlistContacted,
  type WaitlistEntry,
} from "@/lib/mock/waitlist";

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
 * The typed admin-api client. Each method is async (it WILL be a network call against the audited
 * admin-api) but currently resolves the mock synchronously. The async shape means the screens already
 * `await` it, so no call site changes when the real service lands.
 */
export const adminApi = {
  /** The dashboard KPI row. Mock today; an aggregate, non-identifying reporting RPC tomorrow. */
  async getMetrics(): Promise<AdminMetric[]> {
    // SEAM: replace with `await this.#get<AdminMetric[]>("/reporting/metrics")` against the admin-api.
    return getMockMetrics();
  },

  /** The dashboard activity feed. Mock today; a minimised, audit-logged feed tomorrow. */
  async getActivity(): Promise<ActivityItem[]> {
    // SEAM: replace with `await this.#get<ActivityItem[]>("/reporting/activity")`.
    return getMockActivity();
  },

  /**
   * The aggregate signup-trend series for the dashboard chart (counts per week). Mock today; an
   * aggregate, non-identifying reporting RPC tomorrow. Aggregate-only by design: it returns counts,
   * never identities (the dashboard is aggregate-only, README red line 9).
   */
  async getSignupTrend(): Promise<TrendPoint[]> {
    // SEAM: replace with `await this.#get<TrendPoint[]>("/reporting/signup-trend")`.
    return getMockSignupTrend();
  },

  /** The field-minimised Coordinator list (the E2 support view). Mock today. */
  async getUsers(): Promise<AdminUserSummary[]> {
    // SEAM: replace with `await this.#get<AdminUserSummary[]>("/users")` (reason-required, logged).
    return getMockUsers();
  },

  /**
   * A single Coordinator's MINIMISED detail (the default detail surface, NOT the sensitive record). Mock
   * today; a minimised, logged read tomorrow. Returns null for an unknown id.
   */
  async getUser(id: string): Promise<AdminUserSummary | null> {
    // SEAM: replace with `await this.#get<AdminUserSummary>("/users/" + id)` (minimised, logged).
    return getMockUserDetail(id);
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
    // SEAM: replace with a reason-required, audit-logged POST `/users/{id}/full-record` to the admin-api,
    // which writes the audit row server-side BEFORE returning. The reason travels in the request body.
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

  /** The managed-content list (the Content module). Mock today. */
  async getContent(): Promise<AdminContentItem[]> {
    // SEAM: replace with `await this.#get<AdminContentItem[]>("/content")`.
    return getMockContent();
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

  /** The waitlist signups (the E1 surface). Mock today. */
  async getWaitlist(): Promise<WaitlistEntry[]> {
    // SEAM: replace with `await this.#get<WaitlistEntry[]>("/waitlist")`.
    return getMockWaitlist();
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
