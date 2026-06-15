import { Users } from "lucide-react";

import { ModulePlaceholder } from "@/components/ModulePlaceholder";

// The Users module placeholder (the E2 field-minimised support views land here). Wired into the shell so
// the nav is whole; replaced by the Phase-2 Users screen.
export default function UsersPage() {
  return (
    <ModulePlaceholder
      title="Users"
      description="Read-only, field-minimised Coordinator support views. The full sensitive record sits behind a higher-privilege, reason-required, separately-logged action."
      icon={Users}
    />
  );
}
