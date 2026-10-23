"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { legacyInterviewDestination } from "@/lib/navigation/legacyInterview";

/**
 * Keeps the legacy mock interview to tenants that hold the `mock_interview` feature. See
 * lib/navigation/legacyInterview.ts for the rule and the reason. Nothing is drawn until client-info
 * has answered, so a tenant that lost the row never sees the page flash before the redirect.
 */
export default function MockInterviewLayout({ children }: { children: ReactNode }) {
  const { clientInfo, loading } = useClientInfo();
  const router = useRouter();
  const destination = loading || !clientInfo ? null : legacyInterviewDestination(clientInfo.features);

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (loading || !clientInfo || destination) return null;
  return <>{children}</>;
}
