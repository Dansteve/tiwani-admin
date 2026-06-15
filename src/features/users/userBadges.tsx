import {
  CheckCircle2,
  MailPlus,
  PauseCircle,
  XCircle,
  CircleDot,
  Eye,
  AlertTriangle,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  AccountStatus,
  PlanTier,
  RecipientProfile,
} from "@/lib/mock/users";

// Status / tier / alert pills for the Users module. Every status renders as colour + an ICON + a text
// LABEL (never colour alone, the accessibility rule), all from brand tokens via the Badge variants. Kept
// here so the list and the detail surface map a status the same way.

type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "success" | "warning";

const STATUS_META: Record<AccountStatus, { label: string; variant: BadgeVariant; icon: LucideIcon }> = {
  active: { label: "Active", variant: "success", icon: CheckCircle2 },
  invited: { label: "Invited", variant: "secondary", icon: MailPlus },
  suspended: { label: "Suspended", variant: "warning", icon: PauseCircle },
  closed: { label: "Closed", variant: "outline", icon: XCircle },
};

export function StatusBadge({ status }: { status: AccountStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

const PLAN_LABEL: Record<PlanTier, string> = {
  free: "Free",
  standard: "Standard",
  premium: "Premium",
};

export function PlanBadge({ planTier }: { planTier: PlanTier }) {
  // Plan is not a status signal, so it stays a calm outline pill (it still carries its text label).
  return <Badge variant="outline">{PLAN_LABEL[planTier]}</Badge>;
}

type AlertLevel = RecipientProfile["alertLevel"];

const ALERT_META: Record<AlertLevel, { label: string; variant: BadgeVariant; icon: LucideIcon }> = {
  none: { label: "No alert", variant: "success", icon: CircleDot },
  watch: { label: "Watch", variant: "secondary", icon: Eye },
  concern: { label: "Concern", variant: "warning", icon: AlertTriangle },
  action: { label: "Action", variant: "destructive", icon: ShieldAlert },
};

export function AlertBadge({ level }: { level: AlertLevel }) {
  const meta = ALERT_META[level];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

const TIER_LABEL: Record<RecipientProfile["tier"], string> = {
  full: "Full participation",
  supported: "Supported participation",
  alternative: "Alternative participation",
};

export function TierBadge({ tier }: { tier: RecipientProfile["tier"] }) {
  return <Badge variant="outline">{TIER_LABEL[tier]}</Badge>;
}
