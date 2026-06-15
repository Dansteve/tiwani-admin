import * as React from "react";

import { cn } from "@/lib/utils";

// The shared multi-line text input primitive (shadcn-style, token-driven), the sibling of Input for the
// content body / summary fields. Colours, radius, and the focus ring resolve to TIWANI tokens (no
// hardcoded hex). Body text is 16px (text-base) so it never drops below the 16px floor; the field grows
// with min-h, no fixed overflow. One Textarea across the app; do not build a second.

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-24 w-full rounded-md border border-border bg-input-background px-3 py-2 text-base text-foreground shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/40",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
