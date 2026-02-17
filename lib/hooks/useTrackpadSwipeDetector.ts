"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ProctoringViolation } from "@/lib/services/proctoring.service";
import { useToast } from "@/components/common/Toast";

export interface TrackpadSwipeViolation {
  timestamp: string;
  deltaX: number;
  deltaY: number;
  deltaMode: number;
}

/** Minimum horizontal delta to count as trackpad swipe (pixels or line units). Mouse wheel rarely has deltaX. */
const HORIZONTAL_SWIPE_THRESHOLD = 5;

/** Cooldown between recording swipe violations (ms) to avoid burst from one gesture. */
const SWIPE_VIOLATION_COOLDOWN_MS = 800;

export interface UseTrackpadSwipeDetectorOptions {
  /** When false, the wheel listener is not attached (e.g. proctoring not started). */
  enabled: boolean;
  /**
   * When false, trackpad swipe detection is turned off entirely (no warnings, no preventDefault).
   * Use this to control the feature per assessment or via client config.
   * @default true
   */
  detectionEnabled?: boolean;
}

interface UseTrackpadSwipeDetectorReturn {
  violations: TrackpadSwipeViolation[];
  /** ProctoringViolation for each swipe (for merging with face violations and toasts). */
  latestViolation: ProctoringViolation | null;
  clearViolations: () => void;
}

/**
 * Detects trackpad/touchpad horizontal swipes via wheel events.
 * - We cannot disable the laptop's physical trackpad or OS swipe gesture from a web app;
 *   only the OS or device settings can do that. We can only:
 *   (1) Block the result of the swipe: preventDefault() stops browser back/forward navigation.
 *   (2) Detect, record, and show all trackpad swipe errors/toasts.
 * - Mouse wheel: typically deltaY only → allowed (no error).
 * - Trackpad horizontal swipe: deltaX significant → we preventDefault (no back/forward),
 *   record violation, and show warning. All trackpad errors are shown.
 * Vertical scroll (mouse or trackpad) is not blocked so content stays scrollable.
 */
const TRACKPAD_SWIPE_MESSAGE =
  "Trackpad swipe detected. Please use the mouse wheel to scroll. Swipes are not allowed during the assessment.";

export function useTrackpadSwipeDetector(
  options: UseTrackpadSwipeDetectorOptions
): UseTrackpadSwipeDetectorReturn {
  const { enabled, detectionEnabled = true } = options;
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const [violations, setViolations] = useState<TrackpadSwipeViolation[]>([]);
  const [latestViolation, setLatestViolation] =
    useState<ProctoringViolation | null>(null);
  const lastSwipeTimeRef = useRef<number>(0);

  const clearViolations = useCallback(() => {
    setViolations([]);
    setLatestViolation(null);
    lastSwipeTimeRef.current = 0;
  }, []);

  const active = enabled && detectionEnabled;

  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    const handleWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);

      // Horizontal swipe: significant deltaX indicates trackpad/touchpad gesture
      // (mouse wheel almost never has deltaX). Prevents browser back/forward on macOS/Windows/Linux.
      if (absX >= HORIZONTAL_SWIPE_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();

        const now = Date.now();

        // Capture every movement in violations (for metadata/audit)
        const swipeViolation: TrackpadSwipeViolation = {
          timestamp: new Date().toISOString(),
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaMode: e.deltaMode,
        };
        setViolations((prev) => [...prev, swipeViolation]);

        // Toast + latestViolation when outside cooldown to avoid spam
        if (now - lastSwipeTimeRef.current >= SWIPE_VIOLATION_COOLDOWN_MS) {
          lastSwipeTimeRef.current = now;
          showToastRef.current(TRACKPAD_SWIPE_MESSAGE, "warning");
          setLatestViolation({
            type: "TRACKPAD_SWIPE",
            message: TRACKPAD_SWIPE_MESSAGE,
            severity: "medium",
            timestamp: Date.now(),
          });
        }
      }
      // Vertical only (deltaY): allow - mouse wheel and trackpad vertical scroll both work, no error
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [active]);

  return {
    violations,
    latestViolation,
    clearViolations,
  };
}
