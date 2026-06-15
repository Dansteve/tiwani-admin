import { FlaskConical } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// The always-visible "this is not real data" banner. The whole admin foundation runs against the mock
// data layer (Decisions.md D16: no real user data until the launch gates clear), so every screen carries
// this honest label. Uses the brand --warning token via the Alert "warning" variant (colour + an icon +
// the title text, never colour alone).
export function PreProductionBanner() {
  return (
    <Alert variant="warning" className="mb-6">
      <FlaskConical aria-hidden="true" />
      <AlertTitle>Pre-production preview, mock data</AlertTitle>
      <AlertDescription>
        <p className="mt-1 text-warning/90">
          Every figure here is synthetic. This back office is not connected to real user data. The
          audited admin service and its access gates (key rotation, DPIA, MFA, audit log, pen test)
          land before any real data is shown.
        </p>
      </AlertDescription>
    </Alert>
  );
}
