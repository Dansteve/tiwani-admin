"use client";

// The create / edit content form. A clean on-brand Card panel (not a modal: this repo has no dialog
// primitive, and a route panel keeps the surface simple and linkable). It reuses the shared field
// primitives (Field for the title, Textarea for summary + body, Select for type + status) and validates
// the required fields before it lets a save through. WRITES go through the adminApi seam (mock today, an
// audited admin-api write tomorrow); the screen that renders this form already gates it on
// can(role, "content.write"), so this component is only mounted for an authorized role.

import * as React from "react";
import { useId } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, X } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import type { AdminContentItem, ContentInput, ContentStatus, ContentType } from "@/lib/mock/content";
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
import {
  CONTENT_STATUS_OPTIONS,
  CONTENT_TYPE_OPTIONS,
} from "@/features/content/contentLabels";

/** The validation errors keyed by field; an empty object means the input is valid. */
export type ContentFormErrors = Partial<Record<"title" | "summary" | "body", string>>;

/**
 * Validate the content input. Title, summary, and body are required (a content item with no body is not
 * publishable); type and status come from selects so they cannot be empty. Pure + exported so the form's
 * validation is unit-tested directly.
 */
export function validateContent(input: ContentInput): ContentFormErrors {
  const errors: ContentFormErrors = {};
  if (!input.title.trim()) errors.title = "A title is required.";
  if (!input.summary.trim()) errors.summary = "A short summary is required.";
  if (!input.body.trim()) errors.body = "Body content is required.";
  return errors;
}

interface ContentFormProps {
  /** The item being edited, or undefined when creating. */
  item?: AdminContentItem;
}

export function ContentForm({ item }: ContentFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(item);

  const summaryId = useId();
  const bodyId = useId();
  const typeId = useId();
  const statusId = useId();

  const [title, setTitle] = React.useState(item?.title ?? "");
  const [summary, setSummary] = React.useState(item?.summary ?? "");
  const [body, setBody] = React.useState(item?.body ?? "");
  const [type, setType] = React.useState<ContentType>(item?.type ?? "strategy");
  const [status, setStatus] = React.useState<ContentStatus>(item?.status ?? "draft");
  // Errors appear only after a submit attempt, so the form does not shout before the author has typed.
  const [errors, setErrors] = React.useState<ContentFormErrors>({});

  const mutation = useMutation({
    mutationFn: (input: ContentInput) =>
      isEdit && item ? adminApi.updateContent(item.id, input) : adminApi.createContent(input),
    onSuccess: () => {
      // Refresh the list so the new / edited row shows, then return to the list.
      void queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success(isEdit ? "Content updated." : "Content created.");
      router.push("/content");
    },
    onError: () => {
      toast.error("Could not save. Please try again.");
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: ContentInput = {
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim(),
      type,
      status,
    };
    const nextErrors = validateContent(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    mutation.mutate(input);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg">{isEdit ? "Edit content" : "New content"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
          <Field
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={errors.title}
            placeholder="A short, clear title"
          />

          {/* Type select. The Field primitive wraps an <input>, so type / status use the Select directly
              with their own <Label>. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={typeId}>Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as ContentType)}>
              <SelectTrigger id={typeId} aria-label="Type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={summaryId}>Summary</Label>
            <Textarea
              id={summaryId}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              aria-invalid={errors.summary ? true : undefined}
              aria-describedby={errors.summary ? `${summaryId}-error` : undefined}
              className="min-h-20"
              placeholder="One line shown in lists and cards"
            />
            {errors.summary ? (
              <p id={`${summaryId}-error`} className="text-xs font-medium text-destructive" role="alert">
                {errors.summary}
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
              className="min-h-32"
              placeholder="The content body"
            />
            {errors.body ? (
              <p id={`${bodyId}-error`} className="text-xs font-medium text-destructive" role="alert">
                {errors.body}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={statusId}>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ContentStatus)}>
              <SelectTrigger id={statusId} aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.push("/content")}>
              <X aria-hidden="true" />
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <Save aria-hidden="true" />
              {isEdit ? "Save changes" : "Create content"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
