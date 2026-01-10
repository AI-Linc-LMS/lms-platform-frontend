"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useProctoring } from "./useProctoring";
import {
  useFullscreenMonitor,
  FullscreenViolation,
} from "./useFullscreenMonitor";
import {
  useTabSwitchDetector,
  TabSwitchViolation,
} from "./useTabSwitchDetector";
import { ProctoringViolation } from "@/lib/services/proctoring.service";

export interface AssessmentMetadata {
  proctoring: {
    face_violations: Array<{
      type:
        | "NO_FACE"
        | "MULTIPLE_FACES"
        | "LOOKING_AWAY"
        | "FACE_TOO_CLOSE"
        | "FACE_TOO_FAR"
        | "POOR_LIGHTING";
      timestamp: string;
      duration_seconds?: number;
    }>;
    tab_switches: TabSwitchViolation[];
    fullscreen_exits: FullscreenViolation[];
    total_violation_count: number;
    violation_threshold_reached: boolean;
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
}

interface UseAssessmentProctoringReturn {
  // Proctoring state
  isActive: boolean;
  isInitializing: boolean;
  faceCount: number;
  status: "NORMAL" | "WARNING" | "VIOLATION";
  isFullscreen: boolean;
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
  enterFullscreen: () => Promise<void>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  clearViolations: () => void;
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
      tab_switches: [],
      fullscreen_exits: [],
      total_violation_count: 0,
      violation_threshold_reached: false,
    },
    timing: {
      started_at: startedAtRef.current,
    },
  }));

  // Face detection proctoring
  const {
    isActive: isFaceProctoringActive,
    isInitializing,
    faceCount,
    status,
    violations: faceViolations,
    latestViolation,
    startProctoring: startFaceProctoring,
    stopProctoring: stopFaceProctoring,
    videoRef,
    clearViolations: clearFaceViolations,
  } = useProctoring({
    autoStart: false, // We'll control this manually
    detectionInterval: 1000,
    violationCooldown: 3000,
  });

  // Fullscreen monitoring
  const {
    isFullscreen,
    enterFullscreen,
    violations: fullscreenViolations,
    clearViolations: clearFullscreenViolations,
  } = useFullscreenMonitor();

  // Tab switch detection
  const {
    isVisible,
    tabSwitchCount,
    violations: tabSwitchViolations,
    clearViolations: clearTabSwitchViolations,
  } = useTabSwitchDetector();

  // Calculate total violation count
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

    // Convert face violations
    const faceViolationsForMetadata = faceViolations.map((v) => ({
      type: v.type as AssessmentMetadata["proctoring"]["face_violations"][0]["type"],
      timestamp: new Date(v.timestamp).toISOString(),
    }));

    setMetadata((prev) => ({
      ...prev,
      proctoring: {
        face_violations: faceViolationsForMetadata,
        tab_switches: tabSwitchViolations,
        fullscreen_exits: fullscreenViolations,
        total_violation_count: totalViolationCount,
        violation_threshold_reached: violationThresholdReached,
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
    // Note: faceViolations, tabSwitchViolations, fullscreenViolations are used inside
    // but not in deps to avoid infinite loops. We track changes via their lengths.
  ]);

  // Start proctoring (face detection + fullscreen)
  const startProctoring = useCallback(async () => {
    // Try to enter fullscreen (optional - enterFullscreen won't throw, it just logs warnings)
    await enterFullscreen();

    // Start face detection (this is required)
    await startFaceProctoring();
  }, [enterFullscreen, startFaceProctoring]);

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
        tab_switches: [],
        fullscreen_exits: [],
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

  return {
    // State
    isActive: isFaceProctoringActive,
    isInitializing,
    faceCount,
    status,
    isFullscreen,
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
    stopProctoring: () => {
      updateSubmissionTime();
      stopProctoring();
    },
    enterFullscreen,
    videoRef,
    clearViolations,
  };
}
