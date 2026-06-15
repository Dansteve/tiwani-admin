// MOCK DATA, pre-production. NOT real telemetry. Replaced by the audited tiwani-admin-api (D16): the live
// form is a `/system/health` aggregation the admin-api computes by probing the real dependencies (a
// Supabase ping, an auth check, an api /health reach, the migration head, the rate-limiter state) behind
// the launch gates. Numbers / states here are obviously-synthetic, hand-set "all healthy" placeholders,
// not read from any real service.
//
// The System Health surface models TIWANI's REAL stack (not a generic reference): the services are the
// actual dependencies (Supabase Postgres + Auth, the FastAPI api on Render, the not-yet-deployed admin-api,
// Resend for transactional email, the rate limiter), and the diagnostics are TIWANI-honest checks (the
// deterministic engines loaded, the migration head, seed data, RLS tenant isolation, rate limiting), NOT
// job-queue / worker rows the platform does not have.

/** The overall platform health roll-up shown in the header badge. */
export type OverallHealth = "healthy" | "degraded" | "down";

/** A single dependency's operational state. `not_configured` is the "not deployed / not wired yet" case. */
export type ServiceState = "ok" | "degraded" | "down" | "not_configured";

/** A single diagnostic check result (distinct from a service state: this is a pass / warn / fail). */
export type DiagnosticState = "ok" | "warn" | "fail";

/** One service / dependency row: its name, operational state, a short label word, and a one-line detail. */
export interface ServiceStatus {
  /** The service / dependency name (the card title). */
  name: string;
  /** The operational state (drives the dot colour + the label). */
  status: ServiceState;
  /** The short human label for the state (e.g. "Connected", "Not deployed"). Shown next to the dot. */
  label: string;
  /** A one-line description of what the service is / does. */
  detail: string;
}

/** One diagnostic check: its name, the pass / warn / fail result, and a one-line detail. */
export interface DiagnosticRow {
  /** The check name (the table's first column). */
  name: string;
  /** The check result (drives the dot colour + the label word). */
  status: DiagnosticState;
  /** A one-line description of what the check found. */
  detail: string;
}

/** The whole System Health payload: an overall roll-up, the service list, and the diagnostics list. */
export interface SystemHealth {
  /** The overall roll-up shown as the header badge. */
  overall: OverallHealth;
  /** The dependency / service status cards. */
  services: ServiceStatus[];
  /** The diagnostics table rows. */
  diagnostics: DiagnosticRow[];
}

// The TIWANI dependency list (synthetic states, the real services). The Admin API is intentionally
// `not_configured`: it is the audited service that is gated and not yet deployed (Decisions.md D16).
const MOCK_SERVICES: ServiceStatus[] = [
  {
    name: "Supabase (Postgres)",
    status: "ok",
    label: "Connected",
    detail: "Primary datastore, RLS-enforced",
  },
  {
    name: "Supabase Auth",
    status: "ok",
    label: "Connected",
    detail: "Email + Google identity",
  },
  {
    name: "TIWANI API (Render)",
    status: "ok",
    label: "Reachable",
    detail: "FastAPI: the LCE / LCI / Alerts engines",
  },
  {
    name: "Admin API",
    status: "not_configured",
    label: "Not deployed",
    detail: "Audited service, gated (D16)",
  },
  {
    name: "Email (Resend)",
    status: "ok",
    label: "Configured",
    detail: "Transactional invites",
  },
  {
    name: "Rate limiter",
    status: "ok",
    label: "Active",
    detail: "Per-IP / per-account throttling",
  },
];

// The TIWANI-honest diagnostics (synthetic results, real checks). These are platform invariants TIWANI
// actually has, NOT job-queue / worker rows (the platform runs no background queues).
const MOCK_DIAGNOSTICS: DiagnosticRow[] = [
  {
    name: "Deterministic engines",
    status: "ok",
    detail: "LCE 4.4 / LCI 4.8 / Alerts 4.9 loaded",
  },
  {
    name: "Database migrations",
    status: "ok",
    detail: "latest applied: 0019",
  },
  {
    name: "Seed data",
    status: "ok",
    detail: "scenarios + strategies loaded",
  },
  {
    name: "RLS tenant isolation",
    status: "ok",
    detail: "enabled on all tables",
  },
  {
    name: "Rate limiting",
    status: "ok",
    detail: "per-IP + per-account active",
  },
];

/**
 * Derive the overall roll-up from the service states (so the header badge stays correct when the seeded
 * states change): any `down` service makes the platform `down`; any `degraded` makes it `degraded`; a
 * `not_configured` service does NOT degrade the platform (it is an expected pre-production state, not a
 * fault); otherwise `healthy`.
 */
export function deriveOverallHealth(services: ServiceStatus[]): OverallHealth {
  if (services.some((s) => s.status === "down")) return "down";
  if (services.some((s) => s.status === "degraded")) return "degraded";
  return "healthy";
}

/** Return the synthetic System Health payload (the overall roll-up + the services + the diagnostics). */
export function getMockSystemHealth(): SystemHealth {
  return {
    overall: deriveOverallHealth(MOCK_SERVICES),
    services: MOCK_SERVICES,
    diagnostics: MOCK_DIAGNOSTICS,
  };
}
