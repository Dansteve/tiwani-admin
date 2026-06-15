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
import { getMockUsers, type AdminUserSummary } from "@/lib/mock/users";
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
