// MOCK DATA, pre-production. NOT real user data. Replaced by the audited tiwani-admin-api (D16) behind
// the launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test).
//
// Synthetic platform metrics for the dashboard's KPI row, activity panel, and the aggregate signup-trend
// chart. Numbers are obviously placeholder figures, not read from any real table. Everything here is an
// AGGREGATE count: no identified individuals, no PII (the dashboard is aggregate-only, README red line).

import type { LucideIcon } from "lucide-react";
import { Users, ClipboardList, CreditCard, FileText } from "lucide-react";

/** The KPI variant -> brand status token. Generic states only (NOT finance income/expense). */
export type AdminMetricVariant =
  | "default"
  | "success"
  | "warning"
  | "critical"
  | "muted";

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
  /** An optional leading icon (rendered in a tinted circle on the card). */
  icon?: LucideIcon;
  /** An optional variant -> the tint + accent on the card (a status token, not a finance colour). */
  variant?: AdminMetricVariant;
  /** An optional small trend line: a signed percent (e.g. +4.2) and a label (e.g. "vs last week"). */
  delta?: { value: number; label: string };
}

/** A single row in the "platform activity" panel. Minimised, non-identifying, synthetic. */
export interface ActivityItem {
  id: string;
  /** What happened, in plain words. No real PII (this is mock data anyway). */
  summary: string;
  /** A relative-time label, pre-rendered for the mock. */
  when: string;
}

/** A single point in the aggregate signup-trend series. A count for a week, nothing identifying. */
export interface TrendPoint {
  /** The week label shown on the x-axis (pre-rendered for the mock). */
  week: string;
  /** The aggregate count of signups in that week. */
  signups: number;
}

/** One slice of the plan-tier distribution: a tier label and the COUNT of accounts on it (no identities). */
export interface PlanDistributionPoint {
  /** A stable key (the React key + the data point id). */
  key: string;
  /** The plan-tier label shown on the axis. */
  tier: string;
  /** The aggregate count of accounts on that tier. */
  accounts: number;
}

/** One content-type bucket: a type label and the COUNT of content items of that type (no identities). */
export interface ContentTypeCount {
  /** A stable key (the React key + the data point id). */
  key: string;
  /** The content-type label shown on the axis. */
  type: string;
  /** The aggregate count of content items of that type. */
  items: number;
}

/** A single point in the aggregate active-users series. A count for a week, nothing identifying. */
export interface ActiveUsersPoint {
  /** The week label shown on the x-axis (pre-rendered for the mock). */
  week: string;
  /** The aggregate count of weekly-active Coordinators in that week. */
  activeUsers: number;
}

const MOCK_METRICS: AdminMetric[] = [
  {
    key: "coordinators",
    label: "Total Coordinators",
    value: "1,284",
    caption: "all time",
    icon: Users,
    variant: "default",
    delta: { value: 3.4, label: "vs last week" },
  },
  {
    key: "waitlist",
    label: "Waitlist signups",
    value: "3,907",
    caption: "all time",
    icon: ClipboardList,
    variant: "success",
    delta: { value: 8.1, label: "vs last week" },
  },
  {
    key: "subscriptions",
    label: "Active subscriptions",
    value: "212",
    caption: "current",
    icon: CreditCard,
    variant: "warning",
    delta: { value: -1.2, label: "vs last week" },
  },
  {
    key: "content",
    label: "Content items",
    value: "48",
    caption: "published",
    icon: FileText,
    variant: "muted",
  },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "a1", summary: "New waitlist signup (older-adult care)", when: "3 minutes ago" },
  { id: "a2", summary: "Subscription upgraded to standard", when: "27 minutes ago" },
  { id: "a3", summary: "Strategy Library item published", when: "1 hour ago" },
  { id: "a4", summary: "New waitlist signup (child care)", when: "2 hours ago" },
  { id: "a5", summary: "Account export requested (DSAR)", when: "4 hours ago" },
];

// An aggregate 8-week signup trend (synthetic counts). No identities, just a count per week.
const MOCK_SIGNUP_TREND: TrendPoint[] = [
  { week: "Apr 21", signups: 186 },
  { week: "Apr 28", signups: 224 },
  { week: "May 5", signups: 198 },
  { week: "May 12", signups: 271 },
  { week: "May 19", signups: 305 },
  { week: "May 26", signups: 288 },
  { week: "Jun 2", signups: 342 },
  { week: "Jun 9", signups: 397 },
];

/** Return the synthetic KPI list. */
export function getMockMetrics(): AdminMetric[] {
  return MOCK_METRICS;
}

/** Return the synthetic activity feed. */
export function getMockActivity(): ActivityItem[] {
  return MOCK_ACTIVITY;
}

/** Return the synthetic aggregate signup-trend series (counts per week, no PII). */
export function getMockSignupTrend(): TrendPoint[] {
  return MOCK_SIGNUP_TREND;
}

// The plan-tier distribution: a COUNT of accounts per tier (synthetic). No identities, just a count per
// bucket. Aggregate-only by construction (no id / name / email field exists on the shape).
const MOCK_PLAN_DISTRIBUTION: PlanDistributionPoint[] = [
  { key: "free", tier: "Free", accounts: 1072 },
  { key: "standard", tier: "Standard", accounts: 168 },
  { key: "premium", tier: "Premium", accounts: 44 },
];

// Content items grouped BY TYPE: a count per surface (synthetic). An aggregate of the content library, not
// a list of the items themselves.
const MOCK_CONTENT_COUNTS: ContentTypeCount[] = [
  { key: "strategy", type: "Strategy Library", items: 26 },
  { key: "governed", type: "Governed copy", items: 12 },
  { key: "signposting", type: "Signposting", items: 7 },
  { key: "knowledge", type: "Knowledge base", items: 3 },
];

// An aggregate 8-week active-users trend (synthetic counts). No identities, just a count per week.
const MOCK_ACTIVE_USERS_TREND: ActiveUsersPoint[] = [
  { week: "Apr 21", activeUsers: 612 },
  { week: "Apr 28", activeUsers: 648 },
  { week: "May 5", activeUsers: 661 },
  { week: "May 12", activeUsers: 703 },
  { week: "May 19", activeUsers: 729 },
  { week: "May 26", activeUsers: 741 },
  { week: "Jun 2", activeUsers: 778 },
  { week: "Jun 9", activeUsers: 812 },
];

/** Return the synthetic plan-tier distribution (a count per tier, no PII). */
export function getMockPlanDistribution(): PlanDistributionPoint[] {
  return MOCK_PLAN_DISTRIBUTION;
}

/** Return the synthetic content-by-type counts (a count per type, no PII). */
export function getMockContentCounts(): ContentTypeCount[] {
  return MOCK_CONTENT_COUNTS;
}

/** Return the synthetic aggregate active-users series (counts per week, no PII). */
export function getMockActiveUsersTrend(): ActiveUsersPoint[] {
  return MOCK_ACTIVE_USERS_TREND;
}
