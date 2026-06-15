// MOCK DATA, pre-production. NOT real user data. Replaced by the audited tiwani-admin-api (D16) behind
// the launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test).
//
// Synthetic waitlist signups (the E1 surface, the lowest-sensitivity admin view, a sensible first real
// build once E0 + the gates clear). Mirrors the website's waitlist shape (email + care-context). The
// emails are obviously fake; no real signup is here because this is mock data.

/** The care-context the website waitlist captures (D8: lifespan scope, child + adult). */
export type CareContext = "child" | "older_adult" | "long_term_condition" | "professional";

/** A single synthetic waitlist signup. */
export interface WaitlistEntry {
  id: string;
  email: string;
  context: CareContext;
  /** A pre-rendered "signed up" label for the mock. */
  signedUp: string;
}

const MOCK_WAITLIST: WaitlistEntry[] = [
  { id: "w-0001", email: "demo.signup.a@example.test", context: "child", signedUp: "2026-06-14" },
  {
    id: "w-0002",
    email: "demo.signup.b@example.test",
    context: "older_adult",
    signedUp: "2026-06-13",
  },
  {
    id: "w-0003",
    email: "demo.signup.c@example.test",
    context: "long_term_condition",
    signedUp: "2026-06-12",
  },
  {
    id: "w-0004",
    email: "demo.signup.d@example.test",
    context: "professional",
    signedUp: "2026-06-11",
  },
  { id: "w-0005", email: "demo.signup.e@example.test", context: "child", signedUp: "2026-06-10" },
];

/** Return the synthetic waitlist signups. */
export function getMockWaitlist(): WaitlistEntry[] {
  return MOCK_WAITLIST;
}
