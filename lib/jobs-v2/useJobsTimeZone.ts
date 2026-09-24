"use client";

import { useOptionalClientInfo } from "@/lib/contexts/ClientInfoContext";

/**
 * The zone the backend uses when an institution has not set its own (settings.TIME_ZONE). Kept
 * beside the hook rather than borrowed from the live-session code, which falls back to the
 * viewer's zone first: a job's closing date follows the server's rule, not the viewer's.
 */
export const PLATFORM_TIME_ZONE = "Asia/Kolkata";

/**
 * The zone a job's closing date is defined in, for reading it back.
 *
 * An admin picks a date; the server stores the END of that day in the institution's zone
 * (Client.timezone, else the platform's). The same instant is a different date elsewhere: 23:59
 * on 24 Sep in Riyadh is 02:29 on 25 Sep in India. So the date, "Closes today" and the closing
 * windows are all read in that zone, for every viewer, the way live sessions show the
 * institution's times.
 *
 * Undefined when there is no tenant to ask (outside the app shell): the viewer's own zone.
 */
export function useJobsTimeZone(): string | undefined {
  const clientInfo = useOptionalClientInfo();
  if (!clientInfo) return undefined;
  return clientInfo.timezone?.trim() || PLATFORM_TIME_ZONE;
}
