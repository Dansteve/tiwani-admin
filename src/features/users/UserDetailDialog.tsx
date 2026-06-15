"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, FileLock2, Lock, ShieldCheck } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import { can } from "@/lib/rbac";
import type {
  AdminUserSummary,
  AdminUserFullRecord,
} from "@/lib/mock/users";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { usePreviewRole } from "@/features/users/roleContext";
import { ReasonDialog } from "@/features/users/ReasonDialog";
import {
  StatusBadge,
  PlanBadge,
  AlertBadge,
  TierBadge,
} from "@/features/users/userBadges";

// The user detail surface (a modal). It opens on the MINIMISED summary (the same fields as the list row,
// NOT the sensitive record). The full sensitive record is a separate, higher-privilege, reason-required,
// separately-logged reveal:
//
//   - "Reveal full record" shows ONLY when the (previewed) role has users.read_full (dsar_handler). For
//     support_read it is not rendered at all, so the affordance is absent, not just disabled.
//   - Clicking it opens the ReasonDialog. On confirm we record the audit event FIRST (await
//     adminApi.recordAudit), THEN fetch the record (await adminApi.getUserFullRecord). The mutationFn below
//     enforces that order, which is the audit-before-data red line proven in code (and pinned by a test).
//   - The revealed record shows the synthetic recipient profile fields, but the context_note shows
//     PRESENCE ONLY ("A context note is present"). Reading the note BODY is a further, separate
//     reason-required + separately-logged action (its own ReasonDialog + its own audit event + its own
//     gated fetch), so the note text never rides along with the record.

interface UserDetailDialogProps {
  user: AdminUserSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
  const role = usePreviewRole();
  const canRevealFull = can(role, "users.read_full");

  // The revealed full record (null until revealed). Reset whenever the dialog target changes or it closes.
  const [fullRecord, setFullRecord] = React.useState<AdminUserFullRecord | null>(null);
  // The revealed context-note body (null until its own separate reveal). Reset alongside.
  const [noteBody, setNoteBody] = React.useState<string | null>(null);
  // Which reason modal is open: the full-record reveal, the note reveal, or none.
  const [reasonFor, setReasonFor] = React.useState<"full" | "note" | null>(null);

  // Reset the revealed state when the target user changes or the surface closes, so a reveal never leaks
  // across users and re-opening always starts from the minimised summary. Done by adjusting state during
  // render keyed on the user id + open (the pattern the DataTable uses), not in an effect, which avoids the
  // cascading-render the set-state-in-effect rule flags.
  const resetKey = `${user?.id ?? ""}|${open}`;
  const [lastResetKey, setLastResetKey] = React.useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setFullRecord(null);
    setNoteBody(null);
    setReasonFor(null);
  }

  // The full-record reveal: audit FIRST, then fetch. The await sequence here is the load-bearing ordering.
  const revealFull = useMutation({
    mutationFn: async (reason: string) => {
      if (!user) return null;
      await adminApi.recordAudit({
        action: "users.read_full",
        role,
        targetId: user.id,
        reason,
      });
      toast.success(
        `Logged: full-record view, role=${role}, reason=${reason}`,
      );
      return adminApi.getUserFullRecord(user.id, reason);
    },
    onSuccess: (record) => {
      setFullRecord(record);
      setReasonFor(null);
    },
  });

  // The context-note reveal: a SEPARATE audit-first-then-fetch, its own action.
  const revealNote = useMutation({
    mutationFn: async (reason: string) => {
      if (!user) return null;
      await adminApi.recordAudit({
        action: "users.read_context_note",
        role,
        targetId: user.id,
        reason,
      });
      toast.success(
        `Logged: context-note view, role=${role}, reason=${reason}`,
      );
      return adminApi.getContextNote(user.id, reason);
    },
    onSuccess: (body) => {
      setNoteBody(body);
      setReasonFor(null);
    },
  });

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{user.displayName}</DialogTitle>
            <DialogDescription>
              Minimised support summary. The full record is a separate, reason-required, logged reveal.
            </DialogDescription>
          </DialogHeader>

          {/* The minimised summary: the SAME fields as the list row, never the sensitive record. */}
          <section aria-label="Minimised summary" className="rounded-lg border border-border p-4">
            <SummaryRow label="Email">{user.email}</SummaryRow>
            <SummaryRow label="Status">
              <StatusBadge status={user.status} />
            </SummaryRow>
            <SummaryRow label="Plan">
              <PlanBadge planTier={user.planTier} />
            </SummaryRow>
            <SummaryRow label="Care recipients">
              <span className="tabular-nums">{user.recipientCount}</span>
            </SummaryRow>
            <SummaryRow label="Joined">{user.joined}</SummaryRow>
          </section>

          {/* The reveal gate. Shown ONLY to a role with users.read_full; absent otherwise. */}
          {canRevealFull ? (
            fullRecord ? (
              <RevealedRecord
                record={fullRecord}
                noteBody={noteBody}
                onViewNote={() => setReasonFor("note")}
                isNotePending={revealNote.isPending}
              />
            ) : (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-2">
                  <FileLock2
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  />
                  <p className="text-sm text-muted-foreground">
                    The full record (recipient profile codes, index, alert level) is hidden. Revealing it
                    records a reason to the audit log first.
                  </p>
                </div>
                <Button
                  type="button"
                  className="self-start"
                  onClick={() => setReasonFor("full")}
                >
                  <Eye aria-hidden="true" />
                  Reveal full record
                </Button>
              </div>
            )
          ) : (
            // The honest "you do not have access" note for a minimised-only role (no reveal affordance).
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-4">
              <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Your role can view the minimised summary only. Revealing the full record needs the
                data-rights handler role.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* The reason modal, reused for both gated reveals; only one is open at a time. */}
      <ReasonDialog
        open={reasonFor === "full"}
        onOpenChange={(next) => setReasonFor(next ? "full" : null)}
        title="Reveal full record"
        description="The full record is sensitive. Enter a reason or ticket reference; it is logged before the record is shown."
        confirmLabel="Record reason and reveal"
        isPending={revealFull.isPending}
        onConfirm={(reason) => revealFull.mutate(reason)}
      />
      <ReasonDialog
        open={reasonFor === "note"}
        onOpenChange={(next) => setReasonFor(next ? "note" : null)}
        title="View context note"
        description="The context note is the most sensitive field. Enter a separate reason or ticket reference; it is logged before the note is shown."
        confirmLabel="Record reason and view note"
        isPending={revealNote.isPending}
        onConfirm={(reason) => revealNote.mutate(reason)}
      />
    </>
  );
}

// The revealed full record body: synthetic recipient profiles + the context-note PRESENCE control.
function RevealedRecord({
  record,
  noteBody,
  onViewNote,
  isNotePending,
}: {
  record: AdminUserFullRecord;
  noteBody: string | null;
  onViewNote: () => void;
  isNotePending: boolean;
}) {
  return (
    <section
      aria-label="Full record"
      className="flex flex-col gap-4 rounded-lg border border-success/40 bg-success/5 p-4"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-success" />
        <h3 className="text-sm font-semibold text-foreground">
          Full record revealed (logged)
        </h3>
      </div>

      {record.recipients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No care-recipient profiles on this synthetic account.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {record.recipients.map((recipient) => (
            <li
              key={recipient.label}
              className="rounded-md border border-border bg-card p-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {recipient.label}
                </span>
                <AlertBadge level={recipient.alertLevel} />
              </div>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                <div className="flex items-center justify-between gap-2 sm:block">
                  <dt className="text-muted-foreground">Support level</dt>
                  <dd className="font-medium text-foreground">{recipient.supportLevelCode}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 sm:block">
                  <dt className="text-muted-foreground">Index (LCI)</dt>
                  <dd className="font-medium tabular-nums text-foreground">{recipient.lci}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 sm:block">
                  <dt className="text-muted-foreground">Tier</dt>
                  <dd>
                    <TierBadge tier={recipient.tier} />
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2 sm:block">
                  <dt className="text-muted-foreground">Tags</dt>
                  <dd className="font-medium text-foreground">{recipient.tagCodes.join(", ")}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}

      <Separator />

      {/* The context note: PRESENCE ONLY by default. The body is behind its own further-gated reveal. */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Context note</span>
        {!record.contextNotePresent ? (
          <p className="text-sm text-muted-foreground">No context note on this account.</p>
        ) : noteBody ? (
          <p className="rounded-md border border-border bg-card p-3 text-sm text-foreground">
            {noteBody}
          </p>
        ) : (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3">
            <div className="flex items-start gap-2">
              <FileLock2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <p className="text-sm text-muted-foreground">
                A context note is present. Its contents are not shown here; viewing them is a separate,
                logged action.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={onViewNote}
              disabled={isNotePending}
            >
              <Eye aria-hidden="true" />
              View note (records a reason)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
