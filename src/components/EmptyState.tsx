import type { ComponentType } from "react";
import { FileQuestion, type LucideProps } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// The reusable no-data / no-results state. An icon in a muted circle, a title, a description, and an
// optional action. One look for every empty surface (an empty table, a chart with no points, the
// search-first prompt). All colours resolve to brand tokens; the icon is aria-hidden (the title carries
// the meaning).

interface EmptyStateProps {
  icon?: ComponentType<LucideProps>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon aria-hidden="true" className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-base font-medium text-foreground">{title}</h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        {actionLabel && onAction ? (
          <Button onClick={onAction}>{actionLabel}</Button>
        ) : null}
      </div>
    </Card>
  );
}
