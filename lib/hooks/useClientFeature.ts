"use client";

import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

/**
 * Whether a tenant feature is switched on for the current client.
 *
 * The "empty means everything" rule is deliberate and must be preserved: a tenant that has never had
 * its feature list configured returns `[]`, and treating that as "nothing is enabled" would black out
 * the whole portal for them. Only an explicitly-populated list can turn something off.
 *
 * Returns `enabled` alongside `loading` so a caller can avoid flashing a blocked state while the
 * client info is still in flight.
 */
export function useClientFeature(featureName: string): { enabled: boolean; loading: boolean } {
  const { clientInfo, loading } = useClientInfo();
  const names = clientInfo?.features?.map((f) => f.name) ?? [];
  return {
    enabled: names.length === 0 || names.includes(featureName),
    loading,
  };
}

export const COMMUNITY_FEATURE = "community_forum";

/**
 * Whether a flag is EXPLICITLY switched on for this tenant.
 *
 * Deliberately does NOT apply `useClientFeature`'s "empty list means everything is on" rule. That
 * rule is right for capability flags (a tenant with no configured list should still get the whole
 * product) but catastrophic for a flag that HIDES something: a new hide-flag would read as "off"
 * for unconfigured tenants and "on" for every configured one, silently suppressing UI everywhere.
 *
 * Use this for opt-in restrictions; use `useClientFeature` for capabilities.
 */
export function useClientOptIn(flagName: string): boolean {
  const { clientInfo } = useClientInfo();
  return (clientInfo?.features?.map((f) => f.name) ?? []).includes(flagName);
}

/** Opt-in: hide "N joined" and any batch headcount from students. */
export const HIDE_PARTICIPANT_COUNTS = "hide_participant_counts";
