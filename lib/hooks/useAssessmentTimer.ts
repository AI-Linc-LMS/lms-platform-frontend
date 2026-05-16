"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

interface UseAssessmentTimerOptions {
  initialTimeSeconds: number;
  onTimeUp?: () => void;
  autoStart?: boolean;
}

export function useAssessmentTimer(options: UseAssessmentTimerOptions) {
  const { initialTimeSeconds, onTimeUp, autoStart = true } = options;
  const [remainingSeconds, setRemainingSeconds] = useState(initialTimeSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const remainingSecondsRef = useRef(initialTimeSeconds);
  // Wallclock target — Date.now() ms when timer should hit zero.
  // Set on (re)start, cleared on pause/reset. Drives all remaining-time math
  // so background-throttled intervals and system sleep can't cause drift.
  const deadlineMsRef = useRef<number | null>(null);
  const timeUpFiredRef = useRef(false);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  const hasInitializedRef = useRef(false);
  const lastInitialTimeRef = useRef(initialTimeSeconds);

  useEffect(() => {
    const timeDiff = Math.abs(lastInitialTimeRef.current - initialTimeSeconds);
    if (!hasInitializedRef.current || timeDiff > 10) {
      hasInitializedRef.current = true;
      lastInitialTimeRef.current = initialTimeSeconds;
      remainingSecondsRef.current = initialTimeSeconds;
      timeUpFiredRef.current = false;
      setRemainingSeconds(initialTimeSeconds);
      if (isRunning) {
        deadlineMsRef.current = Date.now() + initialTimeSeconds * 1000;
      }
    }
  }, [initialTimeSeconds, isRunning]);

  const computeRemaining = useCallback((): number => {
    const deadline = deadlineMsRef.current;
    if (deadline == null) return remainingSecondsRef.current;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }, []);

  const tick = useCallback(() => {
    const next = computeRemaining();
    remainingSecondsRef.current = next;
    setRemainingSeconds(next);
    if (next <= 0 && !timeUpFiredRef.current) {
      timeUpFiredRef.current = true;
      deadlineMsRef.current = null;
      setIsRunning(false);
      onTimeUpRef.current?.();
    }
  }, [computeRemaining]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && remainingSecondsRef.current > 0) {
      if (deadlineMsRef.current == null) {
        deadlineMsRef.current = Date.now() + remainingSecondsRef.current * 1000;
      }
      timeUpFiredRef.current = false;
      intervalRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, tick]);

  // When the tab becomes visible after being hidden, browsers may have
  // throttled the 1s interval. Recompute immediately from the wallclock
  // deadline so the displayed time and any time-up callback are accurate.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState === "visible" && isRunning) {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isRunning, tick]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (deadlineMsRef.current != null) {
      const snapshot = Math.max(
        0,
        Math.ceil((deadlineMsRef.current - Date.now()) / 1000),
      );
      remainingSecondsRef.current = snapshot;
      setRemainingSeconds(snapshot);
    }
    deadlineMsRef.current = null;
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTimeSeconds: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    remainingSecondsRef.current = newTimeSeconds;
    setRemainingSeconds(newTimeSeconds);
    setIsRunning(false);
    deadlineMsRef.current = null;
    timeUpFiredRef.current = false;
    hasInitializedRef.current = true;
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const formattedTime = useMemo(
    () => formatTime(remainingSeconds),
    [remainingSeconds, formatTime]
  );

  return useMemo(
    () => ({
      remainingSeconds,
      formattedTime,
      isRunning,
      start,
      pause,
      reset,
    }),
    [remainingSeconds, formattedTime, isRunning, start, pause, reset]
  );
}
