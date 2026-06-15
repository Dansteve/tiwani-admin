import { Card } from "@/components/ui/card";
import type { ServiceStatus } from "@/lib/mock/system";
import { serviceStatusToken } from "@/features/system/statusTokens";
import { StatusDot } from "@/features/system/StatusDot";

// A single service-status tile, mirroring the dashboard KpiCard shape (a Card with the same padding) so a
// grid of them aligns. It shows the service name, the status (a brand-token dot + the label word + an
// sr-only status word, never colour alone), and the one-line detail. All colours resolve to brand tokens.

export function ServiceStatusCard({ service }: { service: ServiceStatus }) {
  const token = serviceStatusToken(service.status);

  return (
    <Card className="h-full p-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {service.name}
        </h3>
        <StatusDot dotClass={token.dotClass} label={token.label} />
        <p className="text-sm text-muted-foreground">{service.detail}</p>
      </div>
    </Card>
  );
}
