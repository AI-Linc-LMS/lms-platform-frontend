"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TabSwitchViolation {
  timestamp: string;
  duration_seconds: number;
}

interface UseTabSwitchDetectorOptions {
  /**
   * When false, listeners are detached (no tab-switch state updates).
   * Use while the proctored session is inactive to avoid noise (e.g. editors).
   */
  enabled?: boolean;
}

interface UseTabSwitchDetectorReturn {
  isVisible: boolean;
  tabSwitchCount: number;
  violations: TabSwitchViolation[];
  clearViolations: () => void;
}

/** Cross-browser hidden check (Safari/WebKit legacy + Gecko prefixes). */
function isPageHidden(doc: Document): boolean {
  if (doc.visibilityState === "hidden") return true;
  const d = doc as Document & {
    hidden?: boolean;
    webkitHidden?: boolean;
    mozHidden?: boolean;
  };
  return d.hidden === true || d.webkitHidden === true || d.mozHidden === true;
}

/**
 * Detects leaving / returning to the assessment tab (or minimizing the window).
 * Uses visibility + prefixed visibility events and delayed reconcile on
 * window blur/focus so Firefox / Safari match Chromium when the API updates late.
 */
export function useTabSwitchDetector(
  options: UseTabSwitchDetectorOptions = {}
): UseTabSwitchDetectorReturn {
  const { enabled = true } = options;
  const [isVisible, setIsVisible] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [violations, setViolations] = useState<TabSwitchViolation[]>([]);
  const hiddenTimestampRef = useRef<number | null>(null);
  const reconcileTimerIdsRef = useRef<number[]>([]);

  const clearViolations = useCallback(() => {
    setViolations([]);
    setTabSwitchCount(0);
    hiddenTimestampRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      reconcileTimerIdsRef.current.forEach((id) => clearTimeout(id));
      reconcileTimerIdsRef.current = [];
      return;
    }

    const clearScheduledReconciles = () => {
      reconcileTimerIdsRef.current.forEach((id) => clearTimeout(id));
      reconcileTimerIdsRef.current = [];
    };

    const applyVisibilityTransition = () => {
      const hidden = isPageHidden(document);

      if (hidden) {
        setIsVisible(false);
        if (hiddenTimestampRef.current === null) {
          hiddenTimestampRef.current = Date.now();
        }
        return;
      }

      setIsVisible(true);
      if (hiddenTimestampRef.current !== null) {
        const duration = (Date.now() - hiddenTimestampRef.current) / 1000;
        hiddenTimestampRef.current = null;
        setTabSwitchCount((prev) => prev + 1);
        setViolations((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            duration_seconds: duration,
          },
        ]);
      }
    };

    const onVisibilityEvent = () => {
      applyVisibilityTransition();
    };

    const scheduleReconcile = () => {
      clearScheduledReconciles();
      const delays = [0, 50, 120, 250];
      delays.forEach((ms) => {
        const id = window.setTimeout(() => {
          applyVisibilityTransition();
        }, ms);
        reconcileTimerIdsRef.current.push(id);
      });
    };

    // WebKit (Safari) older builds used webkitvisibilitychange; Gecko/Chromium use visibilitychange.
    const docEvents = ["visibilitychange", "webkitvisibilitychange"] as const;

    docEvents.forEach((evt) => {
      document.addEventListener(evt, onVisibilityEvent);
    });

    window.addEventListener("blur", scheduleReconcile);
    window.addEventListener("focus", scheduleReconcile);

    applyVisibilityTransition();

    return () => {
      clearScheduledReconciles();
      docEvents.forEach((evt) => {
        document.removeEventListener(evt, onVisibilityEvent);
      });
      window.removeEventListener("blur", scheduleReconcile);
      window.removeEventListener("focus", scheduleReconcile);
    };
  }, [enabled]);

  return {
    isVisible,
    tabSwitchCount,
    violations,
    clearViolations,
  };
}
