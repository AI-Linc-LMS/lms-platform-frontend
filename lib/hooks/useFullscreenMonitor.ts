"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface FullscreenViolation {
  timestamp: string;
  timestamp_returned?: string;
  type: "FULLSCREEN_EXIT";
}

interface UseFullscreenMonitorReturn {
  isFullscreen: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  violations: FullscreenViolation[];
  clearViolations: () => void;
}

/**
 * Hook to monitor fullscreen state and track violations
 */
export function useFullscreenMonitor(): UseFullscreenMonitorReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState<FullscreenViolation[]>([]);
  const exitTimestampRef = useRef<string | null>(null);

  // Check fullscreen state
  const checkFullscreen = useCallback(() => {
    const isFS =
      !!document.fullscreenElement ||
      !!(document as any).webkitFullscreenElement ||
      !!(document as any).mozFullScreenElement ||
      !!(document as any).msFullscreenElement;
    setIsFullscreen(isFS);
    return isFS;
  }, []);

  // Enter fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      checkFullscreen();
    } catch (error) {
      // Fullscreen entry failed - allow the application to continue without fullscreen
      // Fullscreen is optional and should not block the assessment
      checkFullscreen();
    }
  }, [checkFullscreen]);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      checkFullscreen();
    } catch (error) {
      // Silently handle fullscreen exit error
    }
  }, [checkFullscreen]);

  // Clear violations
  const clearViolations = useCallback(() => {
    setViolations([]);
    exitTimestampRef.current = null;
  }, []);

  // Set up fullscreen change listeners
  useEffect(() => {
    // Initial check
    checkFullscreen();

    const handleFullscreenChange = () => {
      const wasFullscreen = isFullscreen;
      const isFS = checkFullscreen();

      // If we exited fullscreen (was true, now false)
      if (wasFullscreen && !isFS) {
        const timestamp = new Date().toISOString();
        exitTimestampRef.current = timestamp;

        setViolations((prev) => [
          ...prev,
          {
            timestamp,
            type: "FULLSCREEN_EXIT",
          },
        ]);
      }

      // If we re-entered fullscreen (was false, now true)
      if (!wasFullscreen && isFS && exitTimestampRef.current) {
        const returnTimestamp = new Date().toISOString();

        // Update the last violation with return timestamp
        setViolations((prev) => {
          const updated = [...prev];
          const lastViolation = updated[updated.length - 1];
          if (lastViolation && lastViolation.type === "FULLSCREEN_EXIT") {
            lastViolation.timestamp_returned = returnTimestamp;
          }
          return updated;
        });

        exitTimestampRef.current = null;
      }
    };

    // Listen to all fullscreen change events
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [isFullscreen, checkFullscreen]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    violations,
    clearViolations,
  };
}

