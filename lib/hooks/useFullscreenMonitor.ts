"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  canEnterFullscreen,
  exitDocumentFullscreen,
  isDocumentFullscreen,
  requestDocumentFullscreen,
} from "@/lib/fullscreen/fullscreenSupport";

export interface FullscreenViolation {
  timestamp: string;
  timestamp_returned?: string;
  type: "FULLSCREEN_EXIT";
}

interface UseFullscreenMonitorReturn {
  isFullscreen: boolean;
  /**
   * False when this browser cannot enter fullscreen at all (iPhone Safari; an iframe without
   * `allow="fullscreen"`). Callers MUST check this before demanding fullscreen of a learner.
   */
  isSupported: boolean;
  /**
   * True once fullscreen has actually been held at least once during this session. This is the
   * evidence that the fullscreen requirement was really in force, as opposed to merely asked for,
   * and it is what the attempt's record reports.
   */
  hasEnteredFullscreen: boolean;
  /** Resolves to whether fullscreen is actually held afterwards. Never throws. */
  enterFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<void>;
  violations: FullscreenViolation[];
  clearViolations: () => void;
}

/**
 * Monitors fullscreen state and records FULLSCREEN_EXIT violations.
 *
 * Fullscreen is treated as MANDATORY by the callers of this hook: the assessment take page puts up
 * a blocking modal when it is not held, and logs an integrity violation when it is lost. This hook
 * therefore has to tell the truth about two different things, which the previous version conflated:
 *
 *   - whether fullscreen is currently held (`isFullscreen`), and
 *   - whether this browser can hold it at all (`isSupported`).
 *
 * The old `enterFullscreen` resolved successfully after doing literally nothing on a browser with
 * no Fullscreen API, and its comment claimed "fullscreen is optional and should not block the
 * assessment" - which was not what any caller did with it. An iPhone learner got the blocking modal
 * and a button that silently no-opped, for ever, with the clock running. Where fullscreen cannot be
 * entered, it cannot be required and it cannot be violated: no listeners, no violations, and
 * callers are told so instead of being handed a false success.
 */
export function useFullscreenMonitor(): UseFullscreenMonitorReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);
  const [violations, setViolations] = useState<FullscreenViolation[]>([]);
  const exitTimestampRef = useRef<string | null>(null);

  // Check fullscreen state
  const checkFullscreen = useCallback(() => {
    const isFS = isDocumentFullscreen();
    setIsFullscreen(isFS);
    if (isFS) setHasEnteredFullscreen(true);
    return isFS;
  }, []);

  // Enter fullscreen. Reports whether fullscreen is actually held afterwards, so a caller can
  // distinguish "the learner declined" from "this device has no fullscreen to enter".
  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    const entered = await requestDocumentFullscreen();
    checkFullscreen();
    return entered;
  }, [checkFullscreen]);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    await exitDocumentFullscreen();
    checkFullscreen();
  }, [checkFullscreen]);

  // Clear violations
  const clearViolations = useCallback(() => {
    setViolations([]);
    exitTimestampRef.current = null;
  }, []);

  // Capability is a property of the document, so it is read once on mount (it cannot change for
  // the life of the page) and kept in state so render output is stable between server and client.
  useEffect(() => {
    setIsSupported(canEnterFullscreen());
  }, []);

  // Set up fullscreen change listeners
  useEffect(() => {
    // Initial check
    checkFullscreen();

    // Nothing to monitor, and nothing that could be a violation: a device with no Fullscreen API
    // never enters fullscreen, so it must never be recorded as having LEFT it.
    if (!canEnterFullscreen()) return;

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
    isSupported,
    hasEnteredFullscreen,
    enterFullscreen,
    exitFullscreen,
    violations,
    clearViolations,
  };
}
