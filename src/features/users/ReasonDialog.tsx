"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// The mandatory-reason / ticket-reference modal: the audit AFFORDANCE on a privileged reveal (Decisions.md
// D16, README red line 7). ONE component for every reason-required action (the full-record reveal and the
// context-note reveal both use it), so the "you must say why" gate is not re-implemented per action.
//
// The reason CANNOT be empty: the confirm button is disabled until a non-whitespace reason is entered, and
// onConfirm is never called with an empty reason. On confirm the caller does the audit-then-fetch (it
// records the audit event FIRST, then fetches), so this component owns only the reason capture, not the
// ordering.

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The modal title, e.g. "Reveal full record". */
  title: string;
  /** A short line explaining what will be logged and shown. */
  description: string;
  /** The confirm button label, e.g. "Record reason and reveal". */
  confirmLabel: string;
  /** Called with the trimmed, non-empty reason when the staff member confirms. */
  onConfirm: (reason: string) => void;
  /** Disable the confirm while the reveal is in flight (so it cannot be double-fired). */
  isPending?: boolean;
}

export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending = false,
}: ReasonDialogProps) {
  const [reason, setReason] = React.useState("");
  const trimmed = reason.trim();
  const canConfirm = trimmed.length > 0 && !isPending;

  // Reset the field each time the modal opens, so a previous reason never carries over. Done by adjusting
  // state during render keyed on `open` (the supported React pattern the DataTable uses), not in an effect,
  // which avoids the cascading-render the set-state-in-effect rule flags.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReason("");
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canConfirm) return;
    onConfirm(trimmed);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reveal-reason">Reason or ticket reference</Label>
            <p id="reveal-reason-hint" className="text-xs text-muted-foreground">
              Required. This is recorded to the audit log before any data is shown.
            </p>
            <Input
              id="reveal-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. SUPPORT-1042: user-requested data review"
              aria-describedby="reveal-reason-hint"
              autoComplete="off"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canConfirm}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
