"use client";

// The Blog module screen: the managed-blog surface. A header with a "New post" CTA (the coral accent,
// used sparingly), the pre-production banner, and the blog-post list. It reads through the adminApi seam
// via TanStack Query (mock today; an audited admin-api tomorrow, only the client body changes). WRITES are
// gated on the RBAC scaffold: can(role, "content.write") shows the create / edit / publish controls (blog
// is authored content, so it reuses the content.write capability), otherwise the list renders read-only
// with a calm note (the stub role is super_admin, which has the grant, so the demo shows the full write
// surface).
//
// The role comes from the stub staff session (STUB_STAFF, the same pattern the Content + Settings screens
// use); it is the affordance decision only, never the security boundary (real enforcement is server-side
// in the audited admin-api, Decisions.md D16). An optional `role` prop lets a test drive both roles.
//
// The Admin DETERMINES the blog content here; PUBLISHED posts will later be served by a separate public,
// unauthenticated read API and rendered on the website (see docs/BLOG.md). Those two are follow-ups.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Info } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import { can, type StaffRole } from "@/lib/rbac";
import { STUB_STAFF } from "@/lib/staff-session";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { BlogTable } from "@/features/blog/BlogTable";

export function BlogScreen({ role = STUB_STAFF.role }: { role?: StaffRole }) {
  const canWrite = can(role, "content.write");

  const posts = useQuery({ queryKey: ["blog"], queryFn: () => adminApi.getBlogPosts() });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Blog</h1>
          <p className="text-sm text-muted-foreground">
            Author and publish blog posts (caregiving tips, product news). Published posts are served to
            the public website. Synthetic data, for layout and review only.
          </p>
        </div>
        {canWrite ? (
          // The primary CTA uses the coral brand accent (used sparingly, per Brand.md), from the
          // bg-tiwani-coral token (never a raw hex). text-white is on coral for AA contrast. The Button
          // primitive is a plain <button> (no asChild slot), so the Link is styled with buttonVariants.
          <Link
            href="/blog/new"
            className={cn(
              buttonVariants(),
              "shrink-0 bg-tiwani-coral text-white hover:bg-tiwani-coral-deep",
            )}
          >
            <Plus aria-hidden="true" />
            New post
          </Link>
        ) : null}
      </header>

      {!canWrite ? (
        <Alert>
          <Info aria-hidden="true" />
          <AlertTitle>Read-only</AlertTitle>
          <AlertDescription>
            Your role cannot edit the blog. You can view the list, but creating, editing, and publishing
            are reserved for an administrator.
          </AlertDescription>
        </Alert>
      ) : null}

      <BlogTable posts={posts.data ?? []} isLoading={posts.isLoading} writeEnabled={canWrite} />
    </div>
  );
}
