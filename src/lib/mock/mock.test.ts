// The mock adapters back the whole foundation (Decisions.md D16: no real user data yet). These pin the
// shape + typing each adapter returns, so a screen that codes against the type cannot drift from the
// data, AND that the records are obviously synthetic (so no one mistakes them for real PII): the demo
// names / .test / .internal emails are asserted.

import { describe, it, expect } from "vitest";

import { getMockMetrics, getMockActivity } from "@/lib/mock/metrics";
import { getMockUsers } from "@/lib/mock/users";
import { getMockContent } from "@/lib/mock/content";
import { getMockWaitlist } from "@/lib/mock/waitlist";

describe("mock/metrics", () => {
  it("returns the four KPI tiles, each with a key, label, and string value", () => {
    const metrics = getMockMetrics();
    expect(metrics).toHaveLength(4);
    for (const metric of metrics) {
      expect(typeof metric.key).toBe("string");
      expect(metric.key.length).toBeGreaterThan(0);
      expect(typeof metric.label).toBe("string");
      expect(typeof metric.value).toBe("string");
    }
    // The four labels the dashboard expects.
    expect(metrics.map((m) => m.label)).toEqual([
      "Total Coordinators",
      "Waitlist signups",
      "Active subscriptions",
      "Content items",
    ]);
  });

  it("returns an activity feed of summary + when rows", () => {
    const activity = getMockActivity();
    expect(activity.length).toBeGreaterThan(0);
    for (const item of activity) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.summary).toBe("string");
      expect(typeof item.when).toBe("string");
    }
  });
});

describe("mock/users (field-minimised, synthetic)", () => {
  it("returns minimised support records with no sensitive care-recipient content", () => {
    const users = getMockUsers();
    expect(users.length).toBeGreaterThan(0);
    for (const user of users) {
      expect(typeof user.id).toBe("string");
      expect(["active", "invited", "suspended", "closed"]).toContain(user.status);
      expect(["free", "standard", "premium"]).toContain(user.planTier);
      expect(typeof user.recipientCount).toBe("number");
      // Obviously synthetic: a demo name and a non-routable .test email (never a real address).
      expect(user.displayName).toMatch(/^Demo Coordinator/);
      expect(user.email).toMatch(/@example\.test$/);
    }
  });
});

describe("mock/content (synthetic)", () => {
  it("returns content items with a type, a lifecycle status, and form fields", () => {
    const content = getMockContent();
    expect(content.length).toBeGreaterThan(0);
    for (const item of content) {
      expect(typeof item.title).toBe("string");
      expect(["strategy", "resource", "announcement"]).toContain(item.type);
      expect(["draft", "published", "archived"]).toContain(item.status);
      expect(typeof item.summary).toBe("string");
      expect(typeof item.body).toBe("string");
      expect(typeof item.updatedAt).toBe("string");
    }
  });
});

describe("mock/waitlist (synthetic)", () => {
  it("returns signups with a known care-context, a status, and an obviously-fake email", () => {
    const waitlist = getMockWaitlist();
    expect(waitlist.length).toBeGreaterThan(0);
    for (const entry of waitlist) {
      expect(["child", "older_adult", "long_term_condition", "professional"]).toContain(
        entry.careContext
      );
      expect(["pending", "contacted"]).toContain(entry.status);
      expect(entry.email).toMatch(/@example\.test$/);
    }
  });
});
