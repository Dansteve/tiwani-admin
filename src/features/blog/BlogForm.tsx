"use client";

// The create / edit blog-post form. A clean on-brand Card panel (a route panel, not a modal, mirroring
// the Content form, so the surface stays simple and linkable). It reuses the shared field primitives
// (Field for title / slug / author / cover image / tags, Textarea for excerpt + body, Select for status)
// and validates the required fields before it lets a save through. WRITES go through the adminApi seam
// (mock today, an audited admin-api write tomorrow); the screen that renders this form already gates it
// on can(role, "content.write"), so this component is only mounted for an authorized role.

import * as React from "react";
import { useId } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, X } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import type { BlogPost, BlogPostInput, BlogStatus } from "@/lib/mock/blog";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOG_STATUS_OPTIONS } from "@/features/blog/blogLabels";

/** The validation errors keyed by field; an empty object means the input is valid. */
export type BlogFormErrors = Partial<Record<"title" | "slug" | "excerpt" | "body", string>>;

/**
 * Validate the blog-post input. Title, slug, excerpt, and body are all required (a post with no slug
 * cannot be routed to, and a post with no body is not publishable); status comes from a select so it
 * cannot be empty, and cover image + tags are optional. Pure + exported so the form's validation is
 * unit-tested directly, mirroring validateContent.
 */
export function validateBlogPost(input: BlogPostInput): BlogFormErrors {
  const errors: BlogFormErrors = {};
  if (!input.title.trim()) errors.title = "A title is required.";
  if (!input.slug.trim()) errors.slug = "A slug is required.";
  if (!input.excerpt.trim()) errors.excerpt = "A short excerpt is required.";
  if (!input.body.trim()) errors.body = "Body content is required.";
  return errors;
}

/** Parse a comma-separated tags string into a trimmed, de-duplicated, non-empty list. */
export function parseTags(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of value.split(",")) {
    const tag = raw.trim();
    if (tag.length === 0 || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  return tags;
}

/** Render a tags list back to the comma-separated form the input edits. */
export function formatTags(tags: string[] | undefined): string {
  return tags ? tags.join(", ") : "";
}

interface BlogFormProps {
  /** The post being edited, or undefined when creating. */
  post?: BlogPost;
}

export function BlogForm({ post }: BlogFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(post);

  const excerptId = useId();
  const bodyId = useId();
  const statusId = useId();

  const [title, setTitle] = React.useState(post?.title ?? "");
  const [slug, setSlug] = React.useState(post?.slug ?? "");
  const [author, setAuthor] = React.useState(post?.author ?? "TIWANI Team");
  const [coverImageUrl, setCoverImageUrl] = React.useState(post?.coverImageUrl ?? "");
  const [tags, setTags] = React.useState(formatTags(post?.tags));
  const [excerpt, setExcerpt] = React.useState(post?.excerpt ?? "");
  const [body, setBody] = React.useState(post?.body ?? "");
  const [status, setStatus] = React.useState<BlogStatus>(post?.status ?? "draft");
  // Errors appear only after a submit attempt, so the form does not shout before the author has typed.
  const [errors, setErrors] = React.useState<BlogFormErrors>({});

  const mutation = useMutation({
    mutationFn: (input: BlogPostInput) =>
      isEdit && post ? adminApi.updateBlogPost(post.id, input) : adminApi.createBlogPost(input),
    onSuccess: () => {
      // Refresh the list so the new / edited row shows, then return to the list.
      void queryClient.invalidateQueries({ queryKey: ["blog"] });
      toast.success(isEdit ? "Post updated." : "Post created.");
      router.push("/blog");
    },
    onError: () => {
      toast.error("Could not save. Please try again.");
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: BlogPostInput = {
      title: title.trim(),
      slug: slug.trim(),
      author: author.trim(),
      coverImageUrl: coverImageUrl.trim() || undefined,
      tags: parseTags(tags),
      excerpt: excerpt.trim(),
      body: body.trim(),
      status,
    };
    const nextErrors = validateBlogPost(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    mutation.mutate(input);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg">{isEdit ? "Edit post" : "New post"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
          <Field
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={errors.title}
            placeholder="A short, clear headline"
          />

          <Field
            label="Slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            error={errors.slug}
            hint="The URL path the public site routes on, e.g. make-a-routine-feel-familiar."
            placeholder="lowercase-with-hyphens"
          />

          <Field
            label="Author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="The byline shown on the post"
          />

          <Field
            label="Cover image URL"
            type="url"
            value={coverImageUrl}
            onChange={(event) => setCoverImageUrl(event.target.value)}
            hint="Optional. A public image URL shown at the top of the post."
            placeholder="https://..."
          />

          <Field
            label="Tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            hint="Optional. Comma-separated, e.g. caregiving tips, product news."
            placeholder="caregiving tips, product news"
          />

          {/* The Field primitive wraps an <input>, so the multi-line excerpt / body and the status select
              use the Textarea / Select directly with their own <Label>. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={excerptId}>Excerpt</Label>
            <Textarea
              id={excerptId}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              aria-invalid={errors.excerpt ? true : undefined}
              aria-describedby={errors.excerpt ? `${excerptId}-error` : undefined}
              className="min-h-20"
              placeholder="One or two lines shown in lists and previews"
            />
            {errors.excerpt ? (
              <p id={`${excerptId}-error`} className="text-xs font-medium text-destructive" role="alert">
                {errors.excerpt}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={bodyId}>Body</Label>
            <Textarea
              id={bodyId}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              aria-invalid={errors.body ? true : undefined}
              aria-describedby={errors.body ? `${bodyId}-error` : undefined}
              className="min-h-40"
              placeholder="The post body"
            />
            {errors.body ? (
              <p id={`${bodyId}-error`} className="text-xs font-medium text-destructive" role="alert">
                {errors.body}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={statusId}>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as BlogStatus)}>
              <SelectTrigger id={statusId} aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOG_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.push("/blog")}>
              <X aria-hidden="true" />
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Save aria-hidden="true" />
              {isEdit ? "Save changes" : "Create post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
