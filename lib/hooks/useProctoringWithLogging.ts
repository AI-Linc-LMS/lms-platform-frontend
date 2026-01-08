"use client";

import { useCallback } from "react";
import { useProctoring } from "./useProctoring";
import { proctoringApiService } from "@/lib/services/proctoring-api.service";
import {
  ProctoringViolation,
  ProctoringConfig,
} from "@/lib/services/proctoring.service";

interface UseProctoringOptions extends Partial<ProctoringConfig> {
  autoStart?: boolean;
  videoConstraints?: MediaStreamConstraints["video"];
}

interface UseProctoringWithLoggingOptions extends UseProctoringOptions {
  assessmentId?: number;
  examId?: number;
  autoLogViolations?: boolean;
  captureSnapshots?: boolean;
  onLogSuccess?: (violationId: string) => void;
  onLogError?: (error: Error) => void;
}

/**
 * Enhanced proctoring hook that automatically logs violations to backend
 */
export function useProctoringWithLogging(
  options: UseProctoringWithLoggingOptions = {}
) {
  const {
    assessmentId,
    examId,
    autoLogViolations = true,
    captureSnapshots = true,
    onLogSuccess,
    onLogError,
    ...proctoringOptions
  } = options;

  const handleViolation = useCallback(
    async (violation: ProctoringViolation) => {
      // Call original callback if provided
      proctoringOptions.onViolation?.(violation);

      // Auto-log to backend if enabled
      if (autoLogViolations) {
        try {
          let snapshot: string | undefined;

          // Capture snapshot for high/medium severity if enabled
          if (
            captureSnapshots &&
            (violation.severity === "high" || violation.severity === "medium")
          ) {
            const capturedSnapshot = await takeSnapshot();
            if (capturedSnapshot) {
              snapshot = capturedSnapshot;
            }
          }

          const response = await proctoringApiService.logViolation({
            assessment_id: assessmentId,
            exam_id: examId,
            violation,
            snapshot,
          });

          onLogSuccess?.(response.violation_id);
        } catch (error) {
          onLogError?.(
            error instanceof Error ? error : new Error("Unknown error")
          );
        }
      }
    },
    [
      assessmentId,
      examId,
      autoLogViolations,
      captureSnapshots,
      onLogSuccess,
      onLogError,
      proctoringOptions.onViolation,
    ]
  );

  const proctoring = useProctoring({
    ...proctoringOptions,
    onViolation: handleViolation,
  });

  const { takeSnapshot } = proctoring;

  return {
    ...proctoring,
    // Add method to manually log current state
    logCurrentState: async () => {
      if (proctoring.latestViolation) {
        await handleViolation(proctoring.latestViolation);
      }
    },
  };
}

