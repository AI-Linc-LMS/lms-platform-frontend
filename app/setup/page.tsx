"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { wizardService, type WizardState } from "@/lib/services/wizard.service";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";

export default function SetupPage() {
  const router = useRouter();
  const { isAuthenticated, loading: isLoading } = useAuth();
  const [state, setState] = useState<WizardState | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            e?.response?.data?.detail ||
              "Could not load the setup wizard."
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
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <h2 className="text-lg font-semibold">Setup unavailable</h2>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
          Loading setup wizard…
        </p>
      </div>
    );
  }

  return <SetupWizard initialState={state} />;
}
