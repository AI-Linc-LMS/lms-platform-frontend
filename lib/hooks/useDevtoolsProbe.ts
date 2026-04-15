"use client";

import { useEffect, useRef } from "react";

/**
 * Best-effort signal when devtools may be undocked (outer/inner width gap).
 * Easily bypassed; use with keyboard blocks in useAssessmentSecurity only as UX nudge.
 */
export function useDevtoolsProbe(options: {
  enabled: boolean;
  onPossibleDevtools?: () => void;
  thresholdPx?: number;
  pollMs?: number;
}) {
  const { enabled, onPossibleDevtools, thresholdPx = 160, pollMs = 4000 } =
    options;
  const lastFireRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const tick = () => {
      const gap = Math.abs(window.outerWidth - window.innerWidth);
      const gh = Math.abs(window.outerHeight - window.innerHeight);
      if (gap > thresholdPx || gh > thresholdPx) {
        const now = Date.now();
        if (now - lastFireRef.current > 15000) {
          lastFireRef.current = now;
          onPossibleDevtools?.();
        }
      }
    };

    const id = window.setInterval(tick, pollMs);
    return () => window.clearInterval(id);
  }, [enabled, onPossibleDevtools, thresholdPx, pollMs]);
}
