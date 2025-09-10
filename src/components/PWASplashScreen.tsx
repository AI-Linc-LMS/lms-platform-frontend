import React, { useEffect, useMemo, useRef, useState } from "react";

// Use client name from Vite env (fallback to default)
const CLIENT_NAME: string = import.meta.env.VITE_CLIENT_NAME ?? "AiLinc";
if (import.meta.env.DEV) {
  // Quick debug to verify env value during development
   
  console.debug("[PWASplashScreen] VITE_CLIENT_NAME:", import.meta.env.VITE_CLIENT_NAME);
}

// Detect if the app is running as an installed PWA (standalone) on iOS/Android/Desktop
const isRunningAsPWA = (): boolean => {
  const isStandaloneMedia = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari when launched from home screen
  const isIOSStandalone = (window as any).navigator?.standalone === true;
  // Some Android launchers set referrer
  const isAndroidAppReferrer = document.referrer?.startsWith("android-app://");
  return Boolean(isStandaloneMedia || isIOSStandalone || isAndroidAppReferrer);
};

type Props = {
  // Duration for the progress animation in ms (default 3s)
  durationMs?: number;
};

export const PWASplashScreen: React.FC<Props>
  = ({ durationMs = 3000 }) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

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
    setProgress(0);

    const duration = Math.max(300, durationMs);
    startRef.current = performance.now();

    const step = (now: number) => {
      const start = startRef.current ?? now;
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        // Smooth finish before hiding
        window.setTimeout(() => setVisible(false), 300);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    // Skip animation on click or Enter/Space
    const onClick = () => {
      setProgress(100);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.setTimeout(() => setVisible(false), 150);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        setProgress(100);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.setTimeout(() => setVisible(false), 150);
      }
    };
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [shouldShow, durationMs]);

  if (!visible) return null;

  return (
    <div
      aria-label="App is loading"
      aria-busy="true"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-white text-slate-800"
    >
      <div className="flex flex-col items-center gap-5 px-6">
        <div className="flex items-center gap-3">
          <img
            src="/pwa-192x192.png"
            width={56}
            height={56}
            alt="AiLinc logo"
            className="rounded-xl shadow-sm"
          />
          {/* <span className="text-2xl font-semibold tracking-tight">AiLinc</span> */}
        </div>

        <div
          className="w-64 h-2 rounded-full bg-slate-200 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full bg-emerald-500 transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-sm text-slate-500" aria-live="polite">
          {progress < 30
            ? 'Initializing...'
            : progress < 60
            ? 'Loading components...'
            : progress < 90
            ? 'Almost ready...'
            : `Welcome to ${CLIENT_NAME}!`}
        </div>
      </div>
    </div>
  );
};

export default PWASplashScreen;
