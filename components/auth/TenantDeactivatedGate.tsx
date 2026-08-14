"use client";

import { ReactNode } from "react";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useTenantDeactivated } from "@/lib/auth/tenant-status";
import { WorkspaceDeactivatedScreen } from "@/components/auth/WorkspaceDeactivatedNotice";

/**
 * Replaces the whole app with the deactivated screen when the institution has been switched off.
 *
 * Two signals, because they arrive at different moments. Client-info is public and already in
 * hand at first paint, so it covers the signed-out visitor at /login before a single
 * authenticated call is made; the 403 `tenant_inactive` latch covers the session that was
 * already open when the switch was thrown.
 *
 * Unlike ProfileActivationBlocker and TenantSetupBlocker this REPLACES children instead of
 * sitting beside them. Laying the screen over a still-mounted dashboard would leave every
 * widget, poller and retry underneath it hammering an API that now 403s on everything -
 * the wall of failed requests this screen exists to replace. Unmounting the tree is what makes
 * the screen quiet, and is what stops it feeding itself more 403s.
 *
 * `is_active` is compared to an explicit false: the SSR fallback payload used when the API is
 * unreachable carries no such field, and treating "unknown" as deactivated would lock out a
 * whole tenant over a transient backend blip.
 */
export function TenantDeactivatedGate({ children }: { children: ReactNode }) {
  const { clientInfo } = useClientInfo();
  const deactivatedByApi = useTenantDeactivated();

  if (deactivatedByApi || clientInfo?.is_active === false) {
    return <WorkspaceDeactivatedScreen />;
  }

  return <>{children}</>;
}
