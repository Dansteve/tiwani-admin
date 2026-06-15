// The admin-api seam: pins the MOCK <-> LIVE branch the demo toggle drives.
//   - mock mode (the default): every read returns the mock data, exactly as before the toggle existed.
//   - live mode, NEXT_PUBLIC_ADMIN_API_URL unset (the dev / demo env): a read throws a clear "Live API
//     not configured" error, so the live state fails loudly rather than silently returning nothing.
//   - live mode, URL set but the endpoint 404s (the admin-api carries only /health today): liveGet throws
//     LiveEndpointUnavailableError, which the screens turn into a clean empty state + a toast.
// A regression here either strands the demo on the wrong source or lets the live path crash a screen.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { adminApi, liveGet, isAdminApiConfigured } from "@/lib/admin-api/client";
import { getMockMetrics } from "@/lib/mock/metrics";
import { setDataMode } from "@/lib/admin-api/mode";

describe("seam: mock mode (the default) returns the mock data", () => {
  beforeEach(() => setDataMode("mock"));
  afterEach(() => setDataMode("mock"));

  it("getMetrics returns the mock metrics", async () => {
    const metrics = await adminApi.getMetrics();
    expect(metrics).toEqual(getMockMetrics());
    expect(metrics.length).toBeGreaterThan(0);
  });

  it("getUsers returns the mock users (no network)", async () => {
    const users = await adminApi.getUsers();
    expect(users.length).toBeGreaterThan(0);
  });

  it("getContent and getWaitlist return their mocks", async () => {
    expect((await adminApi.getContent()).length).toBeGreaterThan(0);
    expect((await adminApi.getWaitlist()).length).toBeGreaterThan(0);
  });
});

describe("seam: live mode with NEXT_PUBLIC_ADMIN_API_URL unset (the dev / demo env)", () => {
  beforeEach(() => setDataMode("live"));
  afterEach(() => setDataMode("mock"));

  it("isAdminApiConfigured() is false in this env", () => {
    expect(isAdminApiConfigured()).toBe(false);
  });

  it("a read throws a clear 'Live API not configured' error", async () => {
    await expect(adminApi.getMetrics()).rejects.toThrow(/Live API not configured/i);
  });

  it("liveGet itself throws when the URL is unset", async () => {
    await expect(liveGet("/reporting/metrics")).rejects.toThrow(/not configured/i);
  });
});

describe("seam: live mode with a configured URL but a 404 endpoint (fresh module)", () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_ADMIN_API_URL;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.NEXT_PUBLIC_ADMIN_API_URL;
    } else {
      process.env.NEXT_PUBLIC_ADMIN_API_URL = ORIGINAL;
    }
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("throws LiveEndpointUnavailableError on a non-ok response (the data endpoints are not built)", async () => {
    // The client captures the URL at import, so set the env then re-import a fresh module instance.
    process.env.NEXT_PUBLIC_ADMIN_API_URL = "https://admin-api.example.test";
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not found", { status: 404 })),
    );

    const fresh = await import("@/lib/admin-api/client");
    const mode = await import("@/lib/admin-api/mode");
    mode.setDataMode("live");

    expect(fresh.isAdminApiConfigured()).toBe(true);
    await expect(fresh.adminApi.getMetrics()).rejects.toBeInstanceOf(
      fresh.LiveEndpointUnavailableError,
    );
    // The fetch was actually attempted against the configured base + the method's path.
    expect(fetch).toHaveBeenCalledWith(
      "https://admin-api.example.test/reporting/metrics",
      expect.objectContaining({ headers: expect.any(Object) }),
    );

    mode.setDataMode("mock");
  });

  it("returns the parsed body on a 200 (proves the live read path works end to end)", async () => {
    process.env.NEXT_PUBLIC_ADMIN_API_URL = "https://admin-api.example.test/";
    vi.resetModules();
    const payload = [{ key: "x", label: "X", value: "1" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const fresh = await import("@/lib/admin-api/client");
    const mode = await import("@/lib/admin-api/mode");
    mode.setDataMode("live");

    await expect(fresh.adminApi.getMetrics()).resolves.toEqual(payload);
    // A trailing slash on the base URL does not double up the path separator.
    expect(fetch).toHaveBeenCalledWith(
      "https://admin-api.example.test/reporting/metrics",
      expect.anything(),
    );

    mode.setDataMode("mock");
  });
});
