// The status -> token + label mapping for System Health. This is the load-bearing accessibility assertion
// for the page: every status maps to a brand status TOKEN (the dot fill class) AND a non-empty LABEL word,
// so status is never conveyed by colour alone. It also pins that the dot classes are brand TOKENS (bg-*
// utilities), never a raw hex, and that the fault states use the destructive token.

import { describe, it, expect } from "vitest";

import {
  serviceStatusToken,
  diagnosticStatusToken,
  overallStatusToken,
} from "@/features/system/statusTokens";
import type {
  ServiceState,
  DiagnosticState,
  OverallHealth,
} from "@/lib/mock/system";

const SERVICE_STATES: ServiceState[] = ["ok", "degraded", "down", "not_configured"];
const DIAGNOSTIC_STATES: DiagnosticState[] = ["ok", "warn", "fail"];
const OVERALL_STATES: OverallHealth[] = ["healthy", "degraded", "down"];

describe("system statusTokens", () => {
  it("maps every service state to a brand-token dot class AND a non-empty label (never colour alone)", () => {
    for (const state of SERVICE_STATES) {
      const token = serviceStatusToken(state);
      // A visible label word always accompanies the colour.
      expect(token.label.trim().length).toBeGreaterThan(0);
      // The dot fill is a brand TOKEN utility (bg-*), not a raw hex value.
      expect(token.dotClass).toMatch(/^bg-/);
      expect(token.dotClass).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    }
  });

  it("uses the brand status tokens for the service fault / pressure / ok states", () => {
    // A "down" service uses the DESTRUCTIVE token plus a label, not colour alone.
    expect(serviceStatusToken("down")).toEqual({ dotClass: "bg-destructive", label: "Down" });
    expect(serviceStatusToken("degraded")).toEqual({ dotClass: "bg-warning", label: "Degraded" });
    expect(serviceStatusToken("ok")).toEqual({ dotClass: "bg-success", label: "OK" });
    // The not-deployed case reads as a calm muted grey (not a fault colour), with its own label.
    expect(serviceStatusToken("not_configured")).toEqual({
      dotClass: "bg-muted-foreground/40",
      label: "Not configured",
    });
  });

  it("maps every diagnostic result to a brand-token dot class AND a non-empty label", () => {
    for (const state of DIAGNOSTIC_STATES) {
      const token = diagnosticStatusToken(state);
      expect(token.label.trim().length).toBeGreaterThan(0);
      expect(token.dotClass).toMatch(/^bg-/);
      expect(token.dotClass).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    }
    // A failing check uses the destructive token + a label.
    expect(diagnosticStatusToken("fail")).toEqual({ dotClass: "bg-destructive", label: "Fail" });
    expect(diagnosticStatusToken("warn")).toEqual({ dotClass: "bg-warning", label: "Warning" });
    expect(diagnosticStatusToken("ok")).toEqual({ dotClass: "bg-success", label: "OK" });
  });

  it("maps the overall roll-up to a brand Badge variant AND a label", () => {
    for (const overall of OVERALL_STATES) {
      const token = overallStatusToken(overall);
      expect(token.label.trim().length).toBeGreaterThan(0);
      expect(["success", "warning", "destructive"]).toContain(token.variant);
    }
    expect(overallStatusToken("healthy")).toEqual({ variant: "success", label: "System healthy" });
    expect(overallStatusToken("degraded")).toEqual({ variant: "warning", label: "Degraded" });
    expect(overallStatusToken("down")).toEqual({ variant: "destructive", label: "System down" });
  });
});
