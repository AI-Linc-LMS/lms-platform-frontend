"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getProctoringService,
  ProctoringConfig,
  ProctoringViolation,
  FaceDetectionResult,
} from "@/lib/services/proctoring.service";

interface UseProctoringOptions extends Partial<ProctoringConfig> {
  autoStart?: boolean;
  videoConstraints?: MediaStreamConstraints["video"];
}

interface UseProctoringReturn {
  isActive: boolean;
  isInitializing: boolean;
  faceCount: number;
  status: FaceDetectionResult["status"];
  latestViolation: ProctoringViolation | null;
  violations: ProctoringViolation[];
  error: string | null;

  startProctoring: () => Promise<void>;
  stopProctoring: () => void;
  takeSnapshot: () => Promise<string | null>;
  clearViolations: () => void;
  getStatistics: ReturnType<typeof getProctoringService>["getStatistics"];

  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useProctoring(
  options: UseProctoringOptions = {}
): UseProctoringReturn {
  const { autoStart = false, videoConstraints, ...config } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const serviceRef = useRef(getProctoringService());

  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  /** ✅ FIXED FACE COUNT STATE */
  const [faceState, setFaceState] = useState<{
    count: number;
    updatedAt: number;
  }>({
    count: 0,
    updatedAt: 0,
  });

  const [status, setStatus] = useState<FaceDetectionResult["status"]>("NORMAL");
  const [latestViolation, setLatestViolation] =
    useState<ProctoringViolation | null>(null);
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onViolationRef = useRef(config.onViolation);
  const onStatusChangeRef = useRef(config.onStatusChange);
  const onFaceCountChangeRef = useRef(config.onFaceCountChange);

  onViolationRef.current = config.onViolation;
  onStatusChangeRef.current = config.onStatusChange;
  onFaceCountChangeRef.current = config.onFaceCountChange;

  /** 🔁 CONFIGURE SERVICE ONCE */
  useEffect(() => {
    const service = serviceRef.current;

    const {
      onViolation: _v,
      onStatusChange: _s,
      onFaceCountChange: _f,
      ...staticConfig
    } = config;

    service.updateConfig({
      ...staticConfig,

      onViolation: (violation) => {
        if (violation.type === "NORMAL") {
          setLatestViolation(null);
        } else {
          setLatestViolation(violation);
          setViolations((prev) => {
            const exists = prev.some(
              (v) =>
                v.type === violation.type && v.timestamp === violation.timestamp
            );
            return exists ? prev : [...prev, violation];
          });
        }
        onViolationRef.current?.(violation);
      },

      onStatusChange: (newStatus) => {
        setStatus((prev) => (prev !== newStatus ? newStatus : prev));
        onStatusChangeRef.current?.(newStatus);
      },

      /** ✅ FIXED FACE COUNT CALLBACK */
      onFaceCountChange: (count) => {
        setFaceState({
          count,
          updatedAt: Date.now(), // 🔥 forces re-render
        });

        if (count === 1) {
          setLatestViolation((prev) =>
            prev && (prev.type === "NO_FACE" || prev.type === "MULTIPLE_FACES")
              ? null
              : prev
          );
        }

        onFaceCountChangeRef.current?.(count);
      },
    });
  }, []);

  const startProctoring = useCallback(async () => {
    if (!videoRef.current) {
      setError("Video element not found");
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);

      await serviceRef.current.startProctoring(videoRef.current, {
        video: videoConstraints || {
          width: 640,
          height: 480,
          facingMode: "user",
        },
        audio: false,
      });

      setIsActive(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start proctoring"
      );
    } finally {
      setIsInitializing(false);
    }
  }, [videoConstraints]);

  const stopProctoring = useCallback(() => {
    serviceRef.current.stopProctoring();
    setIsActive(false);
    setFaceState({ count: 0, updatedAt: Date.now() });
    setStatus("NORMAL");
    setLatestViolation(null);
    setError(null);
  }, []);

  const takeSnapshot = useCallback(() => {
    return serviceRef.current.takeSnapshot();
  }, []);

  const clearViolations = useCallback(() => {
    serviceRef.current.clearViolationHistory();
    setViolations([]);
    setLatestViolation(null);
  }, []);

  const getStatistics = useCallback(() => {
    return serviceRef.current.getStatistics();
  }, []);

  /** 🔄 AUTO START */
  useEffect(() => {
    if (autoStart && videoRef.current && !isActive && !isInitializing) {
      startProctoring();
    }
  }, [autoStart, isActive, isInitializing, startProctoring]);

  /** 🧹 CLEANUP */
  const isActiveRef = useRef(false);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        serviceRef.current.stopProctoring();
      }
    };
  }, []);

  return {
    isActive,
    isInitializing,
    faceCount: faceState.count, // ✅ exposed as number
    status,
    latestViolation,
    violations,
    error,
    startProctoring,
    stopProctoring,
    takeSnapshot,
    clearViolations,
    getStatistics,
    videoRef,
  };
}
