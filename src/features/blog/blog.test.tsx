// Blog module tests: the pure form validation, the blog list render, the RBAC write-gating on the screen,
// the status flip through the seam, and the public-render contract (getMockPublishedBlogPosts excludes
// drafts and the internal-only fields). These pin the brief's acceptance criteria. next/navigation has no
// App Router context in jsdom, and the toast would mount sonner, so both are mocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BlogScreen } from "@/features/blog/BlogScreen";
import { BlogTable } from "@/features/blog/BlogTable";
import { validateBlogPost, parseTags } from "@/features/blog/BlogForm";
import { adminApi } from "@/lib/admin-api/client";
import {
  getMockPublishedBlogPosts,
  getMockBlogPosts,
  setMockBlogPostStatus,
  resetMockBlogPosts,
  type BlogPost,
} from "@/lib/mock/blog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function withClient(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const POST: BlogPost = {
  id: "b-1",
  title: "Test post",
  slug: "test-post",
  excerpt: "A short excerpt.",
  body: "The body.",
  author: "TIWANI Team",
  status: "draft",
  tags: ["caregiving tips"],
  updatedAt: "2026-05-01",
};

describe("validateBlogPost", () => {
  it("flags missing title, slug, excerpt, and body", () => {
    const errors = validateBlogPost({
      title: "  ",
      slug: "",
      excerpt: "",
      body: "",
      author: "TIWANI Team",
      status: "draft",
    });
    expect(errors.title).toBeTruthy();
    expect(errors.slug).toBeTruthy();
    expect(errors.excerpt).toBeTruthy();
    expect(errors.body).toBeTruthy();
  });

  it("returns no errors for a complete input", () => {
    const errors = validateBlogPost({
      title: "T",
      slug: "t",
      excerpt: "E",
      body: "B",
      author: "A",
      status: "published",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe("parseTags", () => {
  it("trims, drops empties, and de-duplicates the comma list", () => {
    expect(parseTags(" caregiving tips , , product news, Caregiving Tips ")).toEqual([
      "caregiving tips",
      "product news",
    ]);
  });
});

describe("BlogScreen RBAC write-gating", () => {
  beforeEach(() => {
    // Deterministic: the screen's query resolves to an empty list (the RBAC affordance is what we assert).
    vi.spyOn(adminApi, "getBlogPosts").mockResolvedValue([]);
  });

  it("shows the New post CTA and no read-only notice for a content.write role", async () => {
    withClient(<BlogScreen role="role_admin" />);
    await screen.findByPlaceholderText(/search posts/i);
    expect(screen.getByRole("link", { name: /new post/i })).toBeInTheDocument();
    expect(screen.queryByText("Read-only")).not.toBeInTheDocument();
  });

  it("shows a read-only notice and hides the CTA for a non-content.write role", async () => {
    // support_read has no content.write grant, so the write surface is hidden and the list is read-only.
    withClient(<BlogScreen role="support_read" />);
    await screen.findByPlaceholderText(/search posts/i);
    expect(screen.queryByRole("link", { name: /new post/i })).not.toBeInTheDocument();
    expect(screen.getByText("Read-only")).toBeInTheDocument();
  });
});

describe("BlogTable", () => {
  it("renders the post and its row-actions menu when writes are enabled", async () => {
    withClient(<BlogTable posts={[POST]} isLoading={false} writeEnabled />);
    expect(await screen.findByText("Test post")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /actions for test post/i })).toBeInTheDocument();
  });

  it("hides the row-actions menu for a read-only role but still lists the post", () => {
    withClient(<BlogTable posts={[POST]} isLoading={false} writeEnabled={false} />);
    expect(screen.getByText("Test post")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actions for/i })).not.toBeInTheDocument();
  });

  it("publishes a draft through the seam from the row menu", async () => {
    const spy = vi
      .spyOn(adminApi, "setBlogPostStatus")
      .mockResolvedValue({ ...POST, status: "published", publishedAt: "2026-06-15" });
    withClient(<BlogTable posts={[POST]} isLoading={false} writeEnabled />);
    await userEvent.click(screen.getByRole("button", { name: /actions for test post/i }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /publish/i }));
    expect(spy).toHaveBeenCalledWith("b-1", "published");
  });
});

describe("getMockPublishedBlogPosts (the public-render contract)", () => {
  beforeEach(() => {
    resetMockBlogPosts();
  });

  it("returns only published posts (no drafts leak to the public surface)", () => {
    const all = getMockBlogPosts();
    const draftIds = all.filter((post) => post.status === "draft").map((post) => post.id);
    expect(draftIds.length).toBeGreaterThan(0); // the seed has at least one draft to prove the filter

    const published = getMockPublishedBlogPosts();
    expect(published.length).toBe(all.length - draftIds.length);
    for (const id of draftIds) {
      expect(published.some((post) => post.id === id)).toBe(false);
    }
  });

  it("omits the internal-only fields (status, updatedAt) from every public post", () => {
    const published = getMockPublishedBlogPosts();
    expect(published.length).toBeGreaterThan(0);
    for (const post of published) {
      expect(post).not.toHaveProperty("status");
      expect(post).not.toHaveProperty("updatedAt");
      // The public fields the website renders are present (publishedAt is required on the public shape).
      expect(post.title).toBeTruthy();
      expect(post.slug).toBeTruthy();
      expect(post.publishedAt).toBeTruthy();
    }
  });

  it("reflects a publish: a newly published draft appears in the public subset", () => {
    const draft = getMockBlogPosts().find((post) => post.status === "draft");
    expect(draft).toBeTruthy();
    expect(getMockPublishedBlogPosts().some((post) => post.id === draft!.id)).toBe(false);

    setMockBlogPostStatus(draft!.id, "published");
    const nowPublic = getMockPublishedBlogPosts().find((post) => post.id === draft!.id);
    expect(nowPublic).toBeTruthy();
    expect(nowPublic).not.toHaveProperty("status");
  });
});
