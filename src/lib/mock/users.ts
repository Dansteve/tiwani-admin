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

// ---------------------------------------------------------------------------------------------
// THE HIGHER-PRIVILEGE RECORD (the reason-required, separately-logged reveal). Everything below mirrors
// the shape of the FULL sensitive record a dsar_handler can reveal, but it is ENTIRELY SYNTHETIC: there
// is no real care recipient, no real Continuity Card, no real context note. The split between "summary"
// (minimised, the default) and "fullRecord" (revealed) is the DPO field-minimisation red line drawn in
// the data layer, so a screen physically cannot show the sensitive fields without calling the gated path.
// In the real admin-api these are narrow, default-deny, reason-required, AUDIT-LOGGED RPCs.

/** A care recipient's coarse participation-tier band (Product.md §4.4), synthetic here. */
export type RecipientTier = "full" | "supported" | "alternative";

/** A synthetic care-recipient profile, the structured-code view (NEVER free text, NEVER the note body). */
export interface RecipientProfile {
  /** A synthetic recipient label. Obviously fake, never a real name. */
  label: string;
  /** A support-level CODE (structured, not prose), mirroring the family model's enum. */
  supportLevelCode: string;
  /** A couple of structured TAG codes (sensory / logistical pressure tags), not descriptions. */
  tagCodes: string[];
  /** The Life Continuity Index, a 0-100 number (Product.md §4.8), synthetic here. */
  lci: number;
  /** The current erosion-alert level (Product.md §4.9), synthetic here. */
  alertLevel: "none" | "watch" | "concern" | "action";
  /** The participation tier band. */
  tier: RecipientTier;
}

/**
 * The FULL sensitive record (revealed). Carries the minimised summary plus the synthetic recipient
 * profiles. CRITICALLY: it carries `contextNotePresent` (a boolean, presence ONLY), NEVER the note text.
 * Seeing the note body is a SEPARATE, further reason-required + separately-logged call (getMockContextNote),
 * which is the "show that a context_note exists, never its contents" red line drawn in the data layer.
 */
export interface AdminUserFullRecord {
  summary: AdminUserSummary;
  recipients: RecipientProfile[];
  /** Whether a free-text context note exists. Presence only; the body is behind getMockContextNote. */
  contextNotePresent: boolean;
}

/** Synthetic full records, keyed by user id. Obviously fake; no real PII can be here (mock data). */
const MOCK_FULL_RECORDS: Record<string, AdminUserFullRecord> = {
  "u-0001": {
    summary: MOCK_USERS[0],
    recipients: [
      {
        label: "Recipient A1 (synthetic)",
        supportLevelCode: "SL-MODERATE",
        tagCodes: ["TAG-SENSORY-NOISE", "TAG-LOGISTICAL-TRANSITIONS"],
        lci: 62,
        alertLevel: "watch",
        tier: "supported",
      },
      {
        label: "Recipient A2 (synthetic)",
        supportLevelCode: "SL-LOW",
        tagCodes: ["TAG-TEMPORAL-WAITING"],
        lci: 74,
        alertLevel: "none",
        tier: "full",
      },
    ],
    contextNotePresent: true,
  },
  "u-0002": {
    summary: MOCK_USERS[1],
    recipients: [
      {
        label: "Recipient B1 (synthetic)",
        supportLevelCode: "SL-HIGH",
        tagCodes: ["TAG-HUMAN-UNFAMILIAR", "TAG-SENSORY-LIGHT"],
        lci: 48,
        alertLevel: "concern",
        tier: "alternative",
      },
    ],
    contextNotePresent: false,
  },
  "u-0003": {
    summary: MOCK_USERS[2],
    recipients: [],
    contextNotePresent: false,
  },
  "u-0004": {
    summary: MOCK_USERS[3],
    recipients: [
      {
        label: "Recipient D1 (synthetic)",
        supportLevelCode: "SL-MODERATE",
        tagCodes: ["TAG-LOGISTICAL-EQUIPMENT"],
        lci: 55,
        alertLevel: "watch",
        tier: "supported",
      },
    ],
    contextNotePresent: true,
  },
};

/** Synthetic context-note bodies, keyed by user id. Returned ONLY by the gated getMockContextNote. */
const MOCK_CONTEXT_NOTES: Record<string, string> = {
  "u-0001":
    "Synthetic context note. This placeholder stands in for a Coordinator's free-text note; the real body is special-category-adjacent and is only ever shown through a separately-logged, reason-required read.",
  "u-0004":
    "Synthetic context note. Placeholder text only. In production this is the most sensitive field and never renders without a recorded reason.",
};

/**
 * The minimised user DETAIL (the support summary). This is the default detail surface: the SAME minimised
 * fields as the list row, NOT the sensitive record. Returns null for an unknown id.
 */
export function getMockUserDetail(id: string): AdminUserSummary | null {
  return MOCK_USERS.find((user) => user.id === id) ?? null;
}

/**
 * The FULL sensitive record (the higher-privilege reveal). Returns the synthetic profile fields plus
 * `contextNotePresent` (presence only, never the note body). Null for an unknown id. In the real admin-api
 * this is a reason-required, audit-logged RPC; here it is synthetic and the reason is enforced at the seam.
 */
export function getMockUserFullRecord(id: string): AdminUserFullRecord | null {
  return MOCK_FULL_RECORDS[id] ?? null;
}

/**
 * The synthetic context-note BODY (the separate, further-gated reveal). Returns the placeholder text only,
 * or null if there is no note. This is deliberately a DIFFERENT function from the full record so the note
 * body cannot leak through the record path: it is fetched only by its own reason-required, logged call.
 */
export function getMockContextNote(id: string): string | null {
  return MOCK_CONTEXT_NOTES[id] ?? null;
}
