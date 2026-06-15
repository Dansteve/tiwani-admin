// The nav active-route test. isActive drives the aria-current + active styling in the shell, so its
// behaviour is pinned: an exact match is active, a nested path under an item is active, and the "/"
// dashboard root is active ONLY on an exact match (never as a prefix of every route).

import { describe, it, expect } from "vitest";

import { isActive } from "@/components/adminNav";

describe("adminNav.isActive", () => {
  it("is active on an exact route match", () => {
    expect(isActive("/users", "/users")).toBe(true);
    expect(isActive("/settings", "/settings")).toBe(true);
  });

  it("is active for a nested path under the item", () => {
    expect(isActive("/users/u-0001", "/users")).toBe(true);
    expect(isActive("/content/c-1/edit", "/content")).toBe(true);
  });

  it("is not active for an unrelated route", () => {
    expect(isActive("/content", "/users")).toBe(false);
    expect(isActive("/reporting", "/settings")).toBe(false);
  });

  it("does not treat a sibling sharing a prefix string as nested", () => {
    // "/users-archive" must not be considered under "/users".
    expect(isActive("/users-archive", "/users")).toBe(false);
  });

  it('matches the dashboard root "/" only on an exact match', () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/users", "/")).toBe(false);
    expect(isActive("/reporting", "/")).toBe(false);
  });
});
