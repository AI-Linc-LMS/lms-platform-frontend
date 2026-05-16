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
        <div className="aw-grid-bg" aria-hidden />
        <div className="relative flex flex-col items-center gap-6">
          <div
            className="aw-bracket inline-block px-6 py-4"
            style={{ animation: "aw-mark-breathe 2.4s ease-in-out infinite" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/ai-linc-lockup-darkmode.svg"
              alt="AI LINC"
              width={220}
              height={84}
              decoding="async"
              loading="eager"
              style={{
                width: "clamp(160px, 22vw, 240px)",
                height: "auto",
                display: "block",
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="aw-pulse-dot" aria-hidden />
            <p className="aw-mono aw-text-dim text-[11px] uppercase tracking-[0.32em]">
              Preparing your launch sequence
            </p>
          </div>
          <div className="mt-2 h-[2px] w-48 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full"
              style={{
                width: "40%",
                background:
                  "linear-gradient(90deg, #2356d6 0%, #00e0ff 100%)",
                animation: "aw-marquee-scroll 1.6s ease-in-out infinite",
              }}
            />
          </div>
        </div>
        <style jsx>{`
          @keyframes aw-mark-breathe {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.04); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="ailinc-wizard">
      <SetupWizard initialState={state} />
    </div>
  );
}
