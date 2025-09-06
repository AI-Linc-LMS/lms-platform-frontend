import React, { useEffect, useMemo, useState } from "react";

// Detect if the app is running as an installed PWA (standalone) on iOS/Android/Desktop
const isRunningAsPWA = (): boolean => {
  const isStandaloneMedia = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari when launched from home screen
  const isIOSStandalone = (window as any).navigator?.standalone === true;
  // Some Android launchers set referrer
  const isAndroidAppReferrer = document.referrer?.startsWith("android-app://");
  return Boolean(isStandaloneMedia || isIOSStandalone || isAndroidAppReferrer);
};

export const PWASplashScreen: React.FC<{ delayMs?: number }>
  = ({ delayMs = 5000 }) => {
  const [visible, setVisible] = useState(false);

  const shouldShow = useMemo(() => {
    try {
      return isRunningAsPWA();
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!shouldShow) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), delayMs);
    return () => window.clearTimeout(t);
  }, [shouldShow, delayMs]);

  if (!visible) return null;

  return (
    <div
      aria-label="App is loading"
      aria-busy="true"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-3">
          <img
            src="/pwa-192x192.png"
            width={56}
            height={56}
            alt="AiLinc logo"
            className="rounded-xl shadow-sm"
          />
          <span className="text-2xl font-semibold tracking-tight">AiLinc</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="sr-only">Loading</span>
          <span className="h-10 w-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 animate-spin" />
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Preparing your experience…</div>
      </div>
    </div>
  );
};

export default PWASplashScreen;

