// The status -> brand-token + label mapping for the System Health page. Pure and presentational (no React,
// no "use client") so the service-card grid and the diagnostics table both render the SAME dot colour and
// label word from one place, and so the mapping is unit-testable in isolation.
//
// Status is colour + label + icon/dot, NEVER colour alone (CLAUDE.md / the accessibility rule): every entry
// carries a brand status TOKEN (the dot fill) AND a visible LABEL word. The screens also add an sr-only
// status word, so the signal carries to assistive tech. Colours resolve to the brand status tokens
// (--success / --warning / --destructive, harmonized to the palette in styles/theme.css) and the warm
// --muted-foreground for the "not configured / not deployed" case; no hardcoded hex, no off-brand blue.

import type {
  ServiceState,
  DiagnosticState,
  OverallHealth,
} from "@/lib/mock/system";

/** A status presentation: the dot fill class (a brand token) and the visible label word. */
export interface StatusToken {
  /** The Tailwind class for the status DOT fill (a brand status token, never a raw hex). */
  dotClass: string;
  /** The short visible status word (so the signal is colour AND text, never colour alone). */
  label: string;
}

// A service's operational state. `not_configured` is the expected pre-production "not deployed yet" case,
// so it reads as a calm muted grey, not a fault colour.
const SERVICE_TOKENS: Record<ServiceState, StatusToken> = {
  ok: { dotClass: "bg-success", label: "OK" },
  degraded: { dotClass: "bg-warning", label: "Degraded" },
  down: { dotClass: "bg-destructive", label: "Down" },
  not_configured: { dotClass: "bg-muted-foreground/40", label: "Not configured" },
};

// A diagnostic check result. A failing check uses the destructive (coral) token, a warning the amber, a
// pass the success teal.
const DIAGNOSTIC_TOKENS: Record<DiagnosticState, StatusToken> = {
  ok: { dotClass: "bg-success", label: "OK" },
  warn: { dotClass: "bg-warning", label: "Warning" },
  fail: { dotClass: "bg-destructive", label: "Fail" },
};

/** The Badge variant + label for the overall roll-up shown in the header. */
export interface OverallToken {
  /** The Badge variant (a brand status token: success / warning / destructive). */
  variant: "success" | "warning" | "destructive";
  /** The full header label (e.g. "System healthy"). */
  label: string;
}

const OVERALL_TOKENS: Record<OverallHealth, OverallToken> = {
  healthy: { variant: "success", label: "System healthy" },
  degraded: { variant: "warning", label: "Degraded" },
  down: { variant: "destructive", label: "System down" },
};

/** The dot class + label for a service state. */
export function serviceStatusToken(state: ServiceState): StatusToken {
  return SERVICE_TOKENS[state];
}

/** The dot class + label for a diagnostic result. */
export function diagnosticStatusToken(state: DiagnosticState): StatusToken {
  return DIAGNOSTIC_TOKENS[state];
}

/** The Badge variant + label for the overall roll-up. */
export function overallStatusToken(overall: OverallHealth): OverallToken {
  return OVERALL_TOKENS[overall];
}
