"use client";

import { useEffect, useRef } from "react";
import {
  activityService,
  getTimeTrackingSessionId,
} from "@/lib/services/activity.service";

export const useTimeTracking = (active: boolean = true) => {
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedTimeRef = useRef<number>(0);

  const getDeviceType = () => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width <= 768) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  };

  const getFormattedDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const sendTrackingData = async (isSessionEnd: boolean = false) => {
    const now = Date.now();
    const sessionSeconds = Math.floor((now - startTimeRef.current) / 1000);
    const totalToSend = sessionSeconds + accumulatedTimeRef.current;

    if (totalToSend <= 0) return;

    try {
      await activityService.trackTime({
        time_spent_seconds: totalToSend,
        session_id: getTimeTrackingSessionId(),
        date: getFormattedDate(),
        device_type: getDeviceType(),
        session_only: isSessionEnd,
      });

      startTimeRef.current = now;
      accumulatedTimeRef.current = 0;
    } catch (error) {
      // Silently fail as requested (without user knowing)
    }
  };

  const resetSegmentStart = () => {
    startTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
  };

  useEffect(() => {
    if (!active) return;

    resetSegmentStart();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tab or left — send time for this segment
        sendTrackingData(true);
      } else {
        // User came back — new segment, same session_id
        resetSegmentStart();
      }
    };

    const handleBeforeUnload = () => {
      sendTrackingData(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [active]);

  return null;
};







