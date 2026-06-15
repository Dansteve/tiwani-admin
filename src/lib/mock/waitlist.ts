// MOCK DATA, pre-production. NOT real user data. Replaced by the audited tiwani-admin-api (D16) behind
// the launch gates (key rotation, DPIA, RBAC + MFA + audit log, pen test).
//
// Synthetic waitlist signups: the E1 surface, the LOWEST-sensitivity admin view (a public marketing-site
// signup, an email + a care-context, no family data behind it), which is why it is the sensible first
// real build once the gates clear. Mirrors the website's waitlist shape. The emails are obviously fake;
// no real signup is here because this is mock data.
//
// The store is MUTABLE in-memory for the demo so the seam's markWaitlistContacted method (in
// admin-api/client.ts) can flip a row to "contacted" optimistically without a backend. Nothing persists;
// a reload restores the seed. When the audited admin-api lands, the write becomes a logged admin-api
// mutation and this in-memory store goes away.

/** The care-context the website waitlist captures (D8: lifespan scope, child + adult). */
export type CareContext = "child" | "older_adult" | "long_term_condition" | "professional";

/** A signup's operational state in the back office. */
export type WaitlistStatus = "pending" | "contacted";

/** A single synthetic waitlist signup. */
export interface WaitlistEntry {
  id: string;
  email: string;
  careContext: CareContext;
  /** An ISO date string for when they signed up. */
  signedUpAt: string;
  status: WaitlistStatus;
}

const SEED_WAITLIST: WaitlistEntry[] = [
  {
    id: "w-0001",
    email: "demo.signup.a@example.test",
    careContext: "child",
    signedUpAt: "2026-06-14",
    status: "pending",
  },
  {
    id: "w-0002",
    email: "demo.signup.b@example.test",
    careContext: "older_adult",
    signedUpAt: "2026-06-13",
    status: "pending",
  },
  {
    id: "w-0003",
    email: "demo.signup.c@example.test",
    careContext: "long_term_condition",
    signedUpAt: "2026-06-12",
    status: "contacted",
  },
  {
    id: "w-0004",
    email: "demo.signup.d@example.test",
    careContext: "professional",
    signedUpAt: "2026-06-11",
    status: "pending",
  },
  {
    id: "w-0005",
    email: "demo.signup.e@example.test",
    careContext: "child",
    signedUpAt: "2026-06-10",
    status: "contacted",
  },
];

// The mutable in-memory store. Seeded from a deep copy so resetMockWaitlist() can restore the originals.
let store: WaitlistEntry[] = SEED_WAITLIST.map((entry) => ({ ...entry }));

/** Return the synthetic waitlist signups (a copy, so callers cannot mutate the store directly). */
export function getMockWaitlist(): WaitlistEntry[] {
  return store.map((entry) => ({ ...entry }));
}

/** Flip a signup to "contacted" (mock write). Returns the updated entry, or null if not found. */
export function markMockWaitlistContacted(id: string): WaitlistEntry | null {
  const index = store.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  const updated: WaitlistEntry = { ...store[index], status: "contacted" };
  store = store.map((entry, i) => (i === index ? updated : entry));
  return updated;
}

/** Restore the seed (used by tests so each run starts from a known store). */
export function resetMockWaitlist(): void {
  store = SEED_WAITLIST.map((entry) => ({ ...entry }));
}
