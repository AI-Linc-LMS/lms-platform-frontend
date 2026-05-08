"use client";

import { forwardRef, memo, useImperativeHandle } from "react";
import { useAssessmentTimer } from "@/lib/hooks/useAssessmentTimer";
import { AssessmentTimerBar } from "./AssessmentTimerBar";
import type { LiveStreamStatus } from "@/lib/hooks/useLiveProctoringPublisher";

export interface AssessmentTimerControl {
  start(): void;
  pause(): void;
  reset(seconds: number): void;
  getRemainingSeconds(): number;
}

interface LiveAssessmentTimerBarProps {
  initialTimeSeconds: number;
  autoStart?: boolean;
  onTimeUp?: () => void;
  title: string;
  isLastQuestion: boolean;
  submitting: boolean;
  onSubmit: () => void;
  proctoringVideoRef?: React.RefObject<HTMLVideoElement | null>;
  proctoringStatus?: "NORMAL" | "WARNING" | "VIOLATION";
  faceCount?: number;
  assessmentToolsSlot?: React.ReactNode;
  liveStreamStatus?: LiveStreamStatus;
}

const LiveAssessmentTimerBarInner = forwardRef<
  AssessmentTimerControl,
  LiveAssessmentTimerBarProps
>(function LiveAssessmentTimerBarInner(
  { initialTimeSeconds, autoStart = false, onTimeUp, ...rest },
  ref,
) {
  const timer = useAssessmentTimer({ initialTimeSeconds, autoStart, onTimeUp });

  // The closure captures the latest `timer.remainingSeconds` because
  // useImperativeHandle re-runs whenever it changes.
  useImperativeHandle(
    ref,
    () => ({
      start: timer.start,
      pause: timer.pause,
      reset: timer.reset,
      getRemainingSeconds: () => timer.remainingSeconds,
    }),
    [timer.remainingSeconds, timer.start, timer.pause, timer.reset],
  );

  return <AssessmentTimerBar formattedTime={timer.formattedTime} {...rest} />;
});

export const LiveAssessmentTimerBar = memo(LiveAssessmentTimerBarInner);
