import React, { useEffect, useMemo, useRef, useState } from "react";

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
  // Total splash spinner phase duration before switching to progress bar
  splashDelayMs?: number;
  // Duration over which progress fills to 100%
  progressDurationMs?: number;
};

export const PWASplashScreen: React.FC<Props>
  = ({ splashDelayMs = 1800, progressDurationMs = 1000 }) => {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"splash" | "progress">("splash");
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

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
    setPhase("splash");
    // After splash phase, switch to progress phase
    timeoutRef.current = window.setTimeout(() => {
      setPhase("progress");
      setProgress(10);

      const startedAt = Date.now();
      const duration = Math.max(400, progressDurationMs);

      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const pct = Math.min(100, Math.round((elapsed / duration) * 100));
        setProgress(pct);
        if (pct >= 100) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          // Small delay for a pleasant finish
          window.setTimeout(() => setVisible(false), 200);
        }
      }, 80);
    }, Math.max(500, splashDelayMs));

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [shouldShow, splashDelayMs, progressDurationMs]);

  if (!visible) return null;

  return (
    <div
      aria-label="App is loading"
      aria-busy="true"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-white text-slate-800"
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
          {/* <span className="text-2xl font-semibold tracking-tight">AiLinc</span> */}
        </div>

        {phase === "splash" ? (
          <div className="flex items-center gap-3" role="status">
            <span className="sr-only">Loading</span>
            {/* Inline SVG spinner */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 50 50"
              xmlns="http://www.w3.org/2000/svg"
              className="text-emerald-500"
              aria-hidden="true"
            >
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeOpacity="0.2"
              />
              <path
                d="M45 25a20 20 0 0 1-20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 25 25"
                  to="360 25 25"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>
        ) : (
          <div className="w-64 h-2 rounded-full bg-slate-200 overflow-hidden" aria-label="Loading progress">
            <div
              className="h-full bg-emerald-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="text-sm text-slate-500">Preparing your experience…</div>
      </div>
    </div>
  );
};

export default PWASplashScreen;
