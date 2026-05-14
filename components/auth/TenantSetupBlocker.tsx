"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";

/**
 * Redirects tenant admins to `/setup` while their tenant hasn't completed the
 * first-login setup wizard. Lets students and instructors through unchanged.
 */
export function TenantSetupBlocker() {
  const { clientInfo, loading } = useClientInfo();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !isAuthenticated || !clientInfo) return;
    if (clientInfo.setup_completed !== false) return; // explicit false only
    const role = Cookies.get("user_role") || "";
    if (!isClientOrgAdminRole(role)) return;
    if (pathname === "/setup" || pathname?.startsWith("/setup/")) return;
    router.replace("/setup");
  }, [clientInfo, loading, isAuthenticated, pathname, router]);

  return null;
}
