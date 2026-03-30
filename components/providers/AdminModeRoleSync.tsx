"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import {
  canAccessAdminArea,
  isAdminOnlyRole,
} from "@/lib/auth/role-utils";

/**
 * Aligns persisted admin mode with the signed-in user so:
 * - Pure students never keep admin UI from a previous session/account.
 * - Limited admins (e.g. course manager) always get the admin shell + feature-filtered nav.
 */
export function AdminModeRoleSync() {
  const { user, loading } = useAuth();
  const { setAdminMode } = useAdminMode();

  useEffect(() => {
    if (loading) return;
    const role = user?.role;
    if (role == null || role === "") return;

    if (!canAccessAdminArea(role)) {
      setAdminMode(false);
      return;
    }

    if (isAdminOnlyRole(role)) {
      setAdminMode(true);
    }
  }, [user, loading, setAdminMode]);

  return null;
}
