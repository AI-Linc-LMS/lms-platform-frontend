"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  isStandaloneLegacyInterviewPath,
  legacyInterviewDestination,
} from "@/lib/navigation/legacyInterview";

/**
 * Keeps the STANDALONE legacy mock-interview pages to tenants that hold the `mock_interview`
 * feature. The course rounds (/mock-interview/courses) and the runner (/mock-interview/<id>) share
 * this prefix but belong to the course product, so they always render. See
 * lib/navigation/legacyInterview.ts for the split and the reason. Nothing is drawn on a guarded
 * page until client-info has answered, so a tenant that lost the row never sees it flash.
 */
export default function MockInterviewLayout({ children }: { children: ReactNode }) {
  const { clientInfo, loading } = useClientInfo();
  const router = useRouter();
  const pathname = usePathname();
  const guarded = isStandaloneLegacyInterviewPath(pathname);
  const destination =
    !guarded || loading || !clientInfo ? null : legacyInterviewDestination(clientInfo.features);

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (guarded && (loading || !clientInfo || destination)) return null;
  return <>{children}</>;
}
