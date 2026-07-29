"use client";

import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { viewerTimeZone } from "@/lib/utils/session-time";

/**
 * The zone a NEW session should default to.
 *
 * Order is deliberate: the institution's own zone first, the viewer's browser only as a fallback.
 * Seeding from the browser is what caused the reported bug — an India-based admin scheduling for a
 * KSA academy silently got IST preselected and had to remember to change it every time.
 */
export function useTenantTimezone(): string {
  const { clientInfo } = useClientInfo();
  return (clientInfo?.timezone || "").trim() || viewerTimeZone() || "Asia/Kolkata";
}

/**
 * The zone an EXISTING session should be read and displayed in: whatever it was scheduled in, then
 * the institution's, then the viewer's. Never silently reinterprets a stored session in a new zone.
 */
export function useSessionTimezone(sessionTz?: string | null): string {
  const tenant = useTenantTimezone();
  return (sessionTz || "").trim() || tenant;
}
