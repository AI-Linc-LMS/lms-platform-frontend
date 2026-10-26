"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useProctoring } from "./useProctoring";
import {
  useFullscreenMonitor,
  FullscreenViolation,
} from "./useFullscreenMonitor";
import {
  useTabSwitchDetector,
  TabSwitchViolation,
} from "./useTabSwitchDetector";
import { canEnterFullscreen } from "@/lib/fullscreen/fullscreenSupport";
import {
  getClientDeviceClass,
  type AssessmentDeviceClass,
} from "@/lib/utils/assessment-device";
import type { ProctoringViolation } from "@/lib/services/proctoring.service";
import type { ViolationScreenshotSample } from "@/lib/services/assessment.service";

export interface AssessmentMetadata {
  proctoring: {
    face_violations: Array<{
      type:
        | "NO_FACE"
        | "MULTIPLE_FACES"
        | "FACE_NOT_VISIBLE"
        | "LOOKING_AWAY"
        | "EYE_MOVEMENT"
        | "FACE_TOO_CLOSE"
        | "FACE_TOO_FAR"
        | "POOR_LIGHTING";
      timestamp: string;
      duration_seconds?: number;
    }>;
    eye_movement_violations: Array<{
      timestamp: string;
      duration_seconds?: number;
    }>;
    eye_movement_count: number;
    tab_switches: TabSwitchViolation[];
    fullscreen_exits: FullscreenViolation[];
    /** Legacy shape for submission payload; always empty (trackpad detection removed). */
    trackpad_swipes: Array<{
      timestamp: string;
      deltaX: number;
      deltaY: number;
      deltaMode: number;
    }>;
    total_violation_count: number;
    violation_threshold_reached: boolean;
    violation_screenshot_samples?: ViolationScreenshotSample[];
    /**
     * What invigilation was actually POSSIBLE and actually IN FORCE on this learner's device.
     *
     * An iPhone cannot enter fullscreen at all, so an attempt sat there has an empty
     * `fullscreen_exits` list for the same reason a perfectly behaved desktop attempt does. Those
     * two are not the same thing and the record must not let a reader confuse them: this platform
     * has already shipped score-forgery and proctoring bugs, and an unproctored attempt reported
     * as a proctored one is exactly that class of defect. These three fields say which it was.
     *
     * Named for the backend handoff (`assessment.models` has no per-assessment fullscreen flag);
     * `device_class` reuses the same `getClientDeviceClass()` the device rules and the
     * `X-Client-Device-Type` header use, rather than adding a second source of truth.
     */
    fullscreen_supported: boolean;
    /**
     * The word the SERVER reads (assessment/integrity.py `read_fullscreen_enforcement`), not a
     * boolean of our own.
     *
     * "enforced" is a claim about the SITTING and is only ever written once fullscreen has
     * actually been held; "unavailable" is a claim about the BROWSER. A sitting on a capable
     * browser where fullscreen was simply never entered sends neither, because "we were not told"
     * is a real third state and a boolean cannot hold it without inventing one of the two.
     */
    fullscreen_enforcement?: "enforced" | "unavailable";
    device_class: AssessmentDeviceClass;
  };
  timing: {
    started_at: string;
    submitted_at?: string;
    total_time_seconds?: number;
  };
}

interface UseAssessmentProctoringOptions {
  assessmentId: number;
  maxViolations?: number;
  onViolationThresholdReached?: () => void;
  autoStart?: boolean;
  /**
   * When false, tab/window visibility listeners are off (no tab-switch violations).
   * Default true. Prefer enabling only during an active proctored session.
   */
  tabSwitchDetectionEnabled?: boolean;
}

interface UseAssessmentProctoringReturn {
  // Proctoring state
  isActive: boolean;
  isInitializing: boolean;
  faceCount: number;
  status: "NORMAL" | "WARNING" | "VIOLATION";
  isFullscreen: boolean;
  /** False where the browser has no Fullscreen API at all (iPhone Safari, blocked iframe). */
  isFullscreenSupported: boolean;
  isVisible: boolean;
  latestViolation: ProctoringViolation | null;

  // Violations
  faceViolations: ProctoringViolation[];
  tabSwitchCount: number;
  fullscreenViolations: FullscreenViolation[];
  totalViolationCount: number;
  metadata: AssessmentMetadata;

  // Actions
  startProctoring: () => Promise<void>;
  stopProctoring: () => void;
  /** Resolves to whether fullscreen is actually held afterwards; never throws. */
  enterFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<void>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  clearViolations: () => void;
  /** Last error from starting face/camera proctoring (e.g. permission denied). */
  proctoringError: string | null;
}

const DEFAULT_MAX_VIOLATIONS = 10;

/**
 * Master hook that combines all proctoring features:
 * - Face detection
 * - Tab switch detection
 * - Fullscreen monitoring
 * - Metadata aggregation
 */
export function useAssessmentProctoring(
  options: UseAssessmentProctoringOptions
): UseAssessmentProctoringReturn {
  const {
    assessmentId,
    maxViolations = DEFAULT_MAX_VIOLATIONS,
    onViolationThresholdReached,
    autoStart = false,
    tabSwitchDetectionEnabled = true,
  } = options;

  const startedAtRef = useRef<string>(new Date().toISOString());
  const onViolationThresholdReachedRef = useRef(onViolationThresholdReached);
  const thresholdCallbackFiredRef = useRef(false);

  // Update ref when callback changes
  useEffect(() => {
    onViolationThresholdReachedRef.current = onViolationThresholdReached;
  }, [onViolationThresholdReached]);

  const [metadata, setMetadata] = useState<AssessmentMetadata>(() => ({
    proctoring: {
      face_violations: [],
      eye_movement_violations: [],
      eye_movement_count: 0,
      tab_switches: [],
      fullscreen_exits: [],
      trackpad_swipes: [],
      total_violation_count: 0,
      violation_threshold_reached: false,
      fullscreen_supported: canEnterFullscreen(),
      ...(canEnterFullscreen() ? {} : { fullscreen_enforcement: "unavailable" as const }),
      device_class: getClientDeviceClass(),
    },
    timing: {
      started_at: startedAtRef.current,
    },
  }));

  // Face detection proctoring (tuned for stability and fewer false positives)
  const {
    isActive: isFaceProctoringActive,
    isInitializing,
    faceCount,
    status,
    violations: faceViolations,
    latestViolation: latestFaceViolation,
    startProctoring: startFaceProctoring,
    stopProctoring: stopFaceProctoring,
    videoRef,
    clearViolations: clearFaceViolations,
    error: proctoringError,
  } = useProctoring({
    autoStart: false, // We'll control this manually
    includeAudio: true,
    // Detection runs BlazeFace ML inference on every tick. On low-end Windows laptops
    // with integrated GPUs, the old 800ms cadence was pinning the CPU and starving the
    // React render loop - clicks felt unresponsive, code editor lagged. 2000ms cuts CPU
    // work by ~60% vs the original while keeping proctoring fidelity: a sustained
    // violation (looking away, phone use, second face) confirms in ~4s, which is well
    // below any realistic cheating window. For tighter detection we'd move BlazeFace
    // to a Web Worker so the main thread is never blocked regardless of cadence.
    detectionInterval: 2000,
    violationCooldown: 2500,
    minFaceSize: 20, // Strictly reject faces beyond 2-3 meters
    maxFaceSize: 75,
    lookingAwayThreshold: 0.3,
    minConfidence: 0.4,
    smoothFrameCount: 2,
    poorLightingThreshold: 0.4,
  });

  // Fullscreen monitoring
  const {
    isFullscreen,
    isSupported: isFullscreenSupported,
    hasEnteredFullscreen,
    enterFullscreen,
    exitFullscreen,
    violations: fullscreenViolations,
    clearViolations: clearFullscreenViolations,
  } = useFullscreenMonitor();

  // Tab switch detection
  const {
    isVisible,
    tabSwitchCount,
    violations: tabSwitchViolations,
    clearViolations: clearTabSwitchViolations,
  } = useTabSwitchDetector({ enabled: tabSwitchDetectionEnabled });

  const latestViolation = latestFaceViolation;

  const totalViolationCount =
    faceViolations.length +
    tabSwitchViolations.length +
    fullscreenViolations.length;

  // Use refs to track previous values and prevent unnecessary updates
  const prevViolationLengthsRef = useRef({
    face: 0,
    tab: 0,
    fullscreen: 0,
    total: 0,
  });

  // Update metadata whenever violations change
  useEffect(() => {
    const currentLengths = {
      face: faceViolations.length,
      tab: tabSwitchViolations.length,
      fullscreen: fullscreenViolations.length,
      total: totalViolationCount,
    };

    // Check if lengths actually changed
    const lengthsChanged =
      prevViolationLengthsRef.current.face !== currentLengths.face ||
      prevViolationLengthsRef.current.tab !== currentLengths.tab ||
      prevViolationLengthsRef.current.fullscreen !==
        currentLengths.fullscreen ||
      prevViolationLengthsRef.current.total !== currentLengths.total;

    if (!lengthsChanged) {
      return; // No changes, skip update
    }

    // Update ref
    prevViolationLengthsRef.current = currentLengths;

    const violationThresholdReached = totalViolationCount >= maxViolations;

    // Convert face violations and separate eye movement violations
    const faceViolationsForMetadata = faceViolations.map((v) => ({
      type: v.type as AssessmentMetadata["proctoring"]["face_violations"][0]["type"],
      timestamp: new Date(v.timestamp).toISOString(),
    }));

    // Extract eye movement violations separately
    const eyeMovementViolations = faceViolations
      .filter((v) => v.type === "EYE_MOVEMENT")
      .map((v) => ({
        timestamp: new Date(v.timestamp).toISOString(),
      }));

    setMetadata((prev) => ({
      ...prev,
      proctoring: {
        face_violations: faceViolationsForMetadata,
        eye_movement_violations: eyeMovementViolations,
        eye_movement_count: eyeMovementViolations.length,
        tab_switches: tabSwitchViolations,
        fullscreen_exits: fullscreenViolations,
        trackpad_swipes: [],
        total_violation_count: totalViolationCount,
        violation_threshold_reached: violationThresholdReached,
        // Carried forward, not recomputed: this setter replaces the whole proctoring object, and
        // dropping these would make every attempt look like a fullscreen-enforced one.
        fullscreen_supported: prev.proctoring.fullscreen_supported,
        fullscreen_enforcement: prev.proctoring.fullscreen_enforcement,
        device_class: prev.proctoring.device_class,
      },
    }));

    // Trigger callback if threshold reached (only once when threshold is first reached)
    if (
      violationThresholdReached &&
      !thresholdCallbackFiredRef.current &&
      onViolationThresholdReachedRef.current
    ) {
      thresholdCallbackFiredRef.current = true;
      onViolationThresholdReachedRef.current();
    } else if (!violationThresholdReached) {
      // Reset the flag if violations go below threshold (shouldn't happen, but just in case)
      thresholdCallbackFiredRef.current = false;
    }
  }, [
    faceViolations.length,
    tabSwitchViolations.length,
    fullscreenViolations.length,
    totalViolationCount,
    maxViolations,
    // Note: faceViolations, tabSwitchViolations, fullscreenViolations used inside
    // but not in deps to avoid infinite loops. We track changes via their lengths.
  ]);

  /**
   * What fullscreen invigilation this device could and did carry. Kept in the same metadata the
   * attempt is submitted with, so the record states what was ENFORCED rather than leaving a reader
   * to infer it from an empty `fullscreen_exits` list - which an iPhone and a perfectly behaved
   * desktop produce identically.
   */
  useEffect(() => {
    const supported = canEnterFullscreen();
    const deviceClass = getClientDeviceClass();
    // Three states, not two. "enforced" is earned by fullscreen having actually been HELD at
    // some point; "unavailable" is the browser saying it has no Fullscreen API. A capable
    // browser where it was simply never entered sends neither, and the server reads that silence
    // as "not recorded" rather than as either claim.
    const enforcement: "enforced" | "unavailable" | undefined = !supported
      ? "unavailable"
      : hasEnteredFullscreen
        ? "enforced"
        : undefined;
    setMetadata((prev) => {
      if (
        prev.proctoring.fullscreen_supported === supported &&
        prev.proctoring.fullscreen_enforcement === enforcement &&
        prev.proctoring.device_class === deviceClass
      ) {
        return prev;
      }
      return {
        ...prev,
        proctoring: {
          ...prev.proctoring,
          fullscreen_supported: supported,
          fullscreen_enforcement: enforcement,
          device_class: deviceClass,
        },
      };
    });
  }, [isFullscreenSupported, hasEnteredFullscreen]);

  // Start proctoring (camera + face detection only). Fullscreen is entered separately by the page.
  const startProctoring = useCallback(async () => {
    await startFaceProctoring();
  }, [startFaceProctoring]);

  // Stop proctoring
  const stopProctoring = useCallback(() => {
    stopFaceProctoring();
    // Note: We don't exit fullscreen automatically, let the user do it
  }, [stopFaceProctoring]);

  // Clear all violations
  const clearViolations = useCallback(() => {
    clearFaceViolations();
    clearFullscreenViolations();
    clearTabSwitchViolations();
    setMetadata((prev) => ({
      ...prev,
      proctoring: {
        ...prev.proctoring,
        face_violations: [],
        eye_movement_violations: [],
        eye_movement_count: 0,
        tab_switches: [],
        fullscreen_exits: [],
        trackpad_swipes: [],
        total_violation_count: 0,
        violation_threshold_reached: false,
      },
    }));
  }, [
    clearFaceViolations,
    clearFullscreenViolations,
    clearTabSwitchViolations,
  ]);

  // Update submission timestamp when stopping
  const updateSubmissionTime = useCallback(() => {
    const submittedAt = new Date().toISOString();
    const totalTimeSeconds =
      (new Date(submittedAt).getTime() -
        new Date(startedAtRef.current).getTime()) /
      1000;

    setMetadata((prev) => ({
      ...prev,
      timing: {
        ...prev.timing,
        submitted_at: submittedAt,
        total_time_seconds: totalTimeSeconds,
      },
    }));
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && videoRef.current) {
      startProctoring();
    }
  }, [autoStart, startProctoring]);

  // Stable wrapper: update metadata then stop - prevents infinite loop when
  // take page effect depends on stopProctoring (new ref each render caused re-runs)
  const stopProctoringWithMetadata = useCallback(() => {
    updateSubmissionTime();
    stopProctoring();
  }, [updateSubmissionTime, stopProctoring]);

  return {
    // State
    isActive: isFaceProctoringActive,
    isInitializing,
    faceCount,
    status,
    isFullscreen,
    isFullscreenSupported,
    isVisible,
    latestViolation,

    // Violations
    faceViolations,
    tabSwitchCount,
    fullscreenViolations,
    totalViolationCount,
    metadata,

    // Actions
    startProctoring,
    stopProctoring: stopProctoringWithMetadata,
    enterFullscreen,
    exitFullscreen,
    videoRef,
    clearViolations,
    proctoringError,
  };
}
