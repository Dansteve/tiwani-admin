// MOCK DATA, pre-production. NOT real user data. Replaced by the audited tiwani-admin-api (D16) behind
// the launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test).
//
// Synthetic, field-MINIMISED Coordinator records. This deliberately mirrors the E2 "read-only,
// field-minimised support view" shape (account status, plan/subscription, NOT the sensitive Continuity
// Card content / context_note / LCI / alerts, which sit behind a higher-privilege reason-required read).
// Names are obviously fake ("Demo Coordinator A"). No real PII can be here because this is mock data.

/** A Coordinator's coarse account status (the minimised support view). */
export type AccountStatus = "active" | "invited" | "suspended" | "closed";

/** A subscription tier label (mirrors the family plan_tier keys, but synthetic here). */
export type PlanTier = "free" | "standard" | "premium";

/** A field-minimised Coordinator support record. NO sensitive care-recipient content. */
export interface AdminUserSummary {
  id: string;
  /** A synthetic display name. Obviously fake. */
  displayName: string;
  /** A synthetic email. */
  email: string;
  status: AccountStatus;
  planTier: PlanTier;
  /** How many care recipients the account manages (a count, not the recipients themselves). */
  recipientCount: number;
  /** A pre-rendered "joined" label for the mock. */
  joined: string;
}

const MOCK_USERS: AdminUserSummary[] = [
  {
    id: "u-0001",
    displayName: "Demo Coordinator A",
    email: "coordinator.a@example.test",
    status: "active",
    planTier: "standard",
    recipientCount: 2,
    joined: "2026-01-12",
  },
  {
    id: "u-0002",
    displayName: "Demo Coordinator B",
    email: "coordinator.b@example.test",
    status: "active",
    planTier: "free",
    recipientCount: 1,
    joined: "2026-02-03",
  },
  {
    id: "u-0003",
    displayName: "Demo Coordinator C",
    email: "coordinator.c@example.test",
    status: "invited",
    planTier: "free",
    recipientCount: 0,
    joined: "2026-03-21",
  },
  {
    id: "u-0004",
    displayName: "Demo Coordinator D",
    email: "coordinator.d@example.test",
    status: "suspended",
    planTier: "premium",
    recipientCount: 3,
    joined: "2025-11-30",
  },
];

/** Return the synthetic, field-minimised Coordinator list. */
export function getMockUsers(): AdminUserSummary[] {
  return MOCK_USERS;
}
