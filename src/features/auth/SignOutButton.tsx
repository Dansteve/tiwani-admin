"use client";

// The sign-out control in the shell. CLIENT-side: it clears the stub session cookie in the browser
// (clearStaffSessionFromDocument) and navigates to /login. It was a server-action form; it is now
// client-side so the same flow works under BOTH builds, crucially the static-export build (no server
// runtime to clear an httpOnly cookie, and output: "export" does not support server actions). Because the
// stub cookie is now client-settable (not httpOnly), the client can clear it directly. Two variants mirror
// the family app's LogoutButton placements: "nav" (the sidebar foot) and "menu" (a row inside the mobile
// "More" menu). 44px min target, icon + label (never icon alone).

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { clearStaffSessionFromDocument } from "@/lib/staff-session";

export function SignOutButton({
  variant = "nav",
  className,
}: {
  variant?: "nav" | "menu";
  className?: string;
}) {
  const router = useRouter();

  function handleSignOut() {
    clearStaffSessionFromDocument();
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "menu" && "text-foreground hover:bg-secondary",
        className
      )}
    >
      <LogOut className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left">Sign out</span>
    </button>
  );
}
