// MOCK DATA, pre-production. NOT real user data. Replaced by the audited tiwani-admin-api (D16) behind
// the launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test).
//
// Synthetic platform metrics for the dashboard's KPI row + activity panel. Numbers are obviously
// placeholder figures, not read from any real table.

/** A single KPI for the dashboard's top row. */
export interface AdminMetric {
  /** A stable key (used as the React key + the data point id). */
  key: string;
  /** The human label shown under the number. */
  label: string;
  /** The formatted value as a string (so "1,284" / "unlimited" / "42" all fit one shape). */
  value: string;
  /** A short qualifier under the value (e.g. "this week"), optional. */
  caption?: string;
}

/** A single row in the "platform activity" panel. Minimised, non-identifying, synthetic. */
export interface ActivityItem {
  id: string;
  /** What happened, in plain words. No real PII (this is mock data anyway). */
  summary: string;
  /** A relative-time label, pre-rendered for the mock. */
  when: string;
}

const MOCK_METRICS: AdminMetric[] = [
  { key: "coordinators", label: "Total Coordinators", value: "1,284", caption: "all time" },
  { key: "waitlist", label: "Waitlist signups", value: "3,907", caption: "all time" },
  { key: "subscriptions", label: "Active subscriptions", value: "212", caption: "current" },
  { key: "content", label: "Content items", value: "48", caption: "published" },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "a1", summary: "New waitlist signup (older-adult care)", when: "3 minutes ago" },
  { id: "a2", summary: "Subscription upgraded to standard", when: "27 minutes ago" },
  { id: "a3", summary: "Strategy Library item published", when: "1 hour ago" },
  { id: "a4", summary: "New waitlist signup (child care)", when: "2 hours ago" },
  { id: "a5", summary: "Account export requested (DSAR)", when: "4 hours ago" },
];

/** Return the synthetic KPI list. */
export function getMockMetrics(): AdminMetric[] {
  return MOCK_METRICS;
}

/** Return the synthetic activity feed. */
export function getMockActivity(): ActivityItem[] {
  return MOCK_ACTIVITY;
}
