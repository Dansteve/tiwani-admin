// The sign-out control in the shell. A form that POSTs to the `signOut` server action, which clears the
// stub session cookie server-side (the cookie is httpOnly, so client JS cannot clear it; the action
// must). Two variants mirror the family app's LogoutButton placements: "nav" (the sidebar foot) and
// "menu" (a row inside the mobile "More" menu). 44px min target, icon + label (never icon alone).

import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut } from "@/features/auth/actions";

export function SignOutButton({
  variant = "nav",
  className,
}: {
  variant?: "nav" | "menu";
  className?: string;
}) {
  return (
    <form action={signOut} className={className}>
      <button
        type="submit"
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variant === "menu" && "text-foreground hover:bg-secondary"
        )}
      >
        <LogOut className="size-5 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">Sign out</span>
      </button>
    </form>
  );
}
