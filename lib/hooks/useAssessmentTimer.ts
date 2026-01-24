"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

  // Keep refs updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Sync ref with state
  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  // Update ref when initialTimeSeconds changes (for reset)
  useEffect(() => {
    remainingSecondsRef.current = initialTimeSeconds;
    setRemainingSeconds(initialTimeSeconds);
  }, [initialTimeSeconds]);

  // Timer interval - only depends on isRunning to prevent resets
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && remainingSecondsRef.current > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          const current = remainingSecondsRef.current;
          if (current <= 1) {
            setIsRunning(false);
            onTimeUpRef.current?.();
            remainingSecondsRef.current = 0;
            return 0;
          }
          const newValue = current - 1;
          remainingSecondsRef.current = newValue;
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]); // Only depend on isRunning to prevent interval recreation

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTimeSeconds: number) => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    remainingSecondsRef.current = newTimeSeconds;
    setRemainingSeconds(newTimeSeconds);
    setIsRunning(false);
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

  // Memoize formatted time to prevent unnecessary string operations
  const formattedTime = useRef(formatTime(remainingSeconds));
  
  useEffect(() => {
    formattedTime.current = formatTime(remainingSeconds);
  }, [remainingSeconds, formatTime]);

  return {
    remainingSeconds,
    formattedTime: formattedTime.current,
    isRunning,
    start,
    pause,
    reset,
  };
}

