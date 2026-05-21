"use client";

import { useEffect, useRef } from "react";

type WakeLockHandle = { release: () => Promise<void> };

/**
 * Keeps the screen awake during an active attempt (best-effort; HTTPS; not all browsers).
 */
export function useScreenWakeLock(enabled: boolean) {
  const lockRef = useRef<WakeLockHandle | null>(null);

  const release = () => {
    const l = lockRef.current;
    lockRef.current = null;
    if (l?.release) void l.release().catch(() => {});
  };

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined") {
      release();
      return;
    }

    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockHandle> };
    };

    const acquire = async () => {
      try {
        if (!nav.wakeLock?.request) return;
        release();
        lockRef.current = await nav.wakeLock.request("screen");
      } catch {
        /* NotAllowedError, unsupported, or tab not visible */
      }
    };

    void acquire();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && enabled) {
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      release();
    };
  }, [enabled]);
}
