"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TabSwitchViolation {
  timestamp: string;
  duration_seconds: number;
}

interface UseTabSwitchDetectorReturn {
  isVisible: boolean;
  tabSwitchCount: number;
  violations: TabSwitchViolation[];
  clearViolations: () => void;
}

/**
 * Hook to detect tab switches and window visibility changes
 */
export function useTabSwitchDetector(): UseTabSwitchDetectorReturn {
  const [isVisible, setIsVisible] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [violations, setViolations] = useState<TabSwitchViolation[]>([]);
  const hiddenTimestampRef = useRef<number | null>(null);

  // Clear violations
  const clearViolations = useCallback(() => {
    setViolations([]);
    setTabSwitchCount(0);
    hiddenTimestampRef.current = null;
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;

      if (isHidden) {
        // Tab was switched or window was minimized
        setIsVisible(false);
        hiddenTimestampRef.current = Date.now();
      } else {
        // Tab/window is visible again
        setIsVisible(true);

        if (hiddenTimestampRef.current !== null) {
          // Calculate duration
          const duration = (Date.now() - hiddenTimestampRef.current) / 1000;
          hiddenTimestampRef.current = null;

          // Increment counter and add violation
          setTabSwitchCount((prev) => prev + 1);
          setViolations((prev) => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              duration_seconds: duration,
            },
          ]);
        }
      }
    };

    // Listen to visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Don't add blur/focus listeners - they cause infinite loops with Monaco editor
    // The visibilitychange event is sufficient for tab switch detection

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    isVisible,
    tabSwitchCount,
    violations,
    clearViolations,
  };
}

