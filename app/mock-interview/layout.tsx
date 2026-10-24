"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  isStandaloneLegacyInterviewPath,
  legacyInterviewDestination,
} from "@/lib/navigation/legacyInterview";

/**
 * Sends every visit to the RETIRED standalone mock interview somewhere else. Its pages - the hub,
 * quick-start, schedule and scheduled - render for nobody now, whatever the tenant holds.
 *
 * The course rounds (/mock-interview/courses) and the runner (/mock-interview/<id>) share this
 * prefix but belong to the course product, so they always render, exactly as before. See
 * lib/navigation/legacyInterview.ts for the split and the reason.
 *
 * Client-info is read only to CHOOSE between the two destinations, so a guarded page draws
 * nothing while it is still loading and leaves as soon as it answers. If it never answers we
 * still leave, to the dashboard: a retired page that waits forever on a failed request is a
 * blank screen, not a redirect.
 */
export default function MockInterviewLayout({ children }: { children: ReactNode }) {
  const { clientInfo, loading } = useClientInfo();
  const router = useRouter();
  const pathname = usePathname();
  const guarded = isStandaloneLegacyInterviewPath(pathname);
  const destination = !guarded || loading ? null : legacyInterviewDestination(clientInfo?.features);

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (guarded) return null;
  return <>{children}</>;
}
