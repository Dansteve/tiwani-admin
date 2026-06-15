import { cn } from "@/lib/utils";

// The status dot + label, used by both the service cards and the diagnostics table so the status look is
// identical across the page. Status is colour + label + dot, NEVER colour alone (the accessibility rule):
// the coloured dot is aria-hidden (decorative), the visible {label} word carries the meaning to sighted
// users, and an sr-only "Status: {label}" announces it to assistive tech. The dot fill is a brand status
// token passed in (statusTokens.ts), so no colour is hardcoded here.

export function StatusDot({
  dotClass,
  label,
  className,
}: {
  /** The Tailwind dot-fill class (a brand status token from statusTokens.ts). */
  dotClass: string;
  /** The visible status word. */
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("size-2.5 shrink-0 rounded-full", dotClass)} aria-hidden="true" />
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="sr-only">Status: {label}</span>
    </span>
  );
}
