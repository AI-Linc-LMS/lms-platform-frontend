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

  // Keep onTimeUp ref updated without triggering useEffect
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeUpRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, remainingSeconds]); // Removed onTimeUp from deps to prevent restart

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTimeSeconds: number) => {
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

