import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// The shared status / label pill. ONE primitive so every status chip carries the same brand tokens,
// padding, and icon layout. Variants map to the brand STATE tokens (Docs/Brand.md). A badge is a label
// (it carries text), so colour is never the only signal; pair it with a leading <svg> for an icon when
// it marks a status. The success / warning variants use the dashboard status tokens (NOT finance
// income/expense semantics, which this app does not have).
const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 w-fit shrink-0 whitespace-nowrap overflow-hidden rounded-md border px-2 py-0.5 text-xs font-medium transition-colors [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
