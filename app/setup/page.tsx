"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { wizardService, type WizardState } from "@/lib/services/wizard.service";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";

const FRAUNCES_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&display=swap";

export default function SetupPage() {
  const router = useRouter();
  const { isAuthenticated, loading: isLoading } = useAuth();
  const [state, setState] = useState<WizardState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inject Fraunces (the AI Linc display serif) only while the wizard is mounted.
  useEffect(() => {
    if (document.querySelector(`link[href="${FRAUNCES_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FRAUNCES_HREF;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?next=/setup");
      return;
    }
    const role = Cookies.get("user_role") || "";
    if (!isClientOrgAdminRole(role)) {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const s = await wizardService.getState();
        if (cancelled) return;
        if (s.setup_completed) {
          router.replace("/admin/dashboard");
          return;
        }
        setState(s);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.detail || "Could not load the setup wizard."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, router]);

  if (error) {
    return (
      <div className="ailinc-wizard grid place-items-center px-6">
        <div className="aw-card max-w-md text-center">
          <span className="aw-kicker mb-3">Setup unavailable</span>
          <p className="aw-text-dim mt-2 text-[14px] leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="ailinc-wizard grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-[#00e0ff]" />
          <p className="aw-mono aw-text-mute text-[11px] uppercase tracking-[0.3em]">
            Loading setup wizard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ailinc-wizard">
      <SetupWizard initialState={state} />
    </div>
  );
}
