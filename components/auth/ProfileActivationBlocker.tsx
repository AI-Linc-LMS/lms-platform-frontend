"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/auth-context";
import { resolvePostLoginPath } from "@/lib/auth/role-utils";
import { accountsService } from "@/lib/services/accounts.service";
import { InactiveProfileBlockingDialog } from "@/components/auth/InactiveProfileBlockingDialog";
import { useToast } from "@/components/common/Toast";

const POLL_MS = 10_000;

/**
 * Full-screen inactive profile message + polls user-profile until active, then redirects (tokens stay persisted).
 */
export function ProfileActivationBlocker() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const {
    requiresProfileActivation,
    profileInactiveMessage,
    isAuthenticated,
    refreshUser,
  } = useAuth();

  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;

  const redirectedRef = useRef(false);

  useEffect(() => {
    redirectedRef.current = false;
  }, [requiresProfileActivation]);

  useEffect(() => {
    if (!requiresProfileActivation || !isAuthenticated) return;

    const tick = async () => {
      if (redirectedRef.current) return;
      try {
        const profile = await accountsService.getUserProfile();
        // Require explicit true — missing field must not unlock while still inactive on the server.
        if (profile.is_profile_active === true) {
          redirectedRef.current = true;
          await refreshUserRef.current();
          showToast(t("auth.profileActivatedToast"), "success");
          const role = profile.role || Cookies.get("user_role") || "";
          window.location.assign(
            resolvePostLoginPath(role, null)
          );
        }
      } catch {
        /* retry on next interval */
      }
    };

    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => clearInterval(id);
  }, [requiresProfileActivation, isAuthenticated, showToast, t]);

  return (
    <InactiveProfileBlockingDialog
      open={requiresProfileActivation && isAuthenticated}
      message={profileInactiveMessage || t("auth.profileInactiveDefault")}
    />
  );
}
