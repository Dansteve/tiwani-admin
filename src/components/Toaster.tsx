"use client";

import { Toaster as SonnerToaster } from "sonner";

import { useTheme } from "@/state/ThemeProvider";

// The app's single toast surface (sonner), mounted once in the provider tree. It follows the active
// theme (light / dark from the ThemeProvider) and paints on the brand TOKEN surface: the toast reads the
// --normal-* / --success-* / --error-* variables, which we point at the TIWANI card / foreground / border
// / success / destructive tokens. richColors is OFF on purpose so sonner uses these tokens, not its own
// palette (no off-brand colour leaks in). One Toaster; do not mount a second.
export function Toaster() {
  const { effectiveTheme } = useTheme();

  return (
    <SonnerToaster
      theme={effectiveTheme}
      position="bottom-right"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group rounded-md border border-border bg-card text-card-foreground shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success)",
          "--success-text": "var(--success-foreground)",
          "--error-bg": "var(--destructive)",
          "--error-text": "var(--destructive-foreground)",
        } as React.CSSProperties
      }
    />
  );
}
