// The mock adapters back the whole foundation (Decisions.md D16: no real user data yet). These pin the
// shape + typing each adapter returns, so a screen that codes against the type cannot drift from the
// data, AND that the records are obviously synthetic (so no one mistakes them for real PII): the demo
// names / .test / .internal emails are asserted.

import { describe, it, expect } from "vitest";

import {
  getMockMetrics,
  getMockActivity,
  getMockPlanDistribution,
  getMockContentCounts,
  getMockActiveUsersTrend,
} from "@/lib/mock/metrics";
import { getMockUsers } from "@/lib/mock/users";
import { getMockContent } from "@/lib/mock/content";
import { getMockWaitlist } from "@/lib/mock/waitlist";
import { getMockStaff } from "@/lib/mock/staff";

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

  it("returns aggregate reporting series that carry no identity fields (counts only)", () => {
    const plan = getMockPlanDistribution();
    const content = getMockContentCounts();
    const active = getMockActiveUsersTrend();
    expect(plan.length).toBeGreaterThan(0);
    expect(content.length).toBeGreaterThan(0);
    expect(active.length).toBeGreaterThan(0);
    for (const point of plan) {
      expect(typeof point.tier).toBe("string");
      expect(typeof point.accounts).toBe("number");
    }
    for (const bucket of content) {
      expect(typeof bucket.type).toBe("string");
      expect(typeof bucket.items).toBe("number");
    }
    for (const point of active) {
      expect(typeof point.week).toBe("string");
      expect(typeof point.activeUsers).toBe("number");
    }
    // Aggregate-only: none of these shapes has an id / name / email key (no individual could ride along).
    const serialised = JSON.stringify([plan, content, active]).toLowerCase();
    expect(serialised).not.toContain("email");
    expect(serialised).not.toMatch(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  });
});

describe("mock/staff (synthetic, read-only)", () => {
  it("returns staff members with a known role and an obviously-internal email", () => {
    const staff = getMockStaff();
    expect(staff.length).toBeGreaterThan(0);
    for (const member of staff) {
      expect(typeof member.id).toBe("string");
      expect(["support_read", "dsar_handler", "role_admin"]).toContain(member.role);
      // Obviously synthetic: a demo name and an internal (.internal) email, never a real address.
      expect(member.name).toMatch(/\(stub\)$/);
      expect(member.email).toMatch(/@tiwani\.internal$/);
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
