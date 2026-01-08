"use client";

import { useEffect, useRef } from "react";
import { activityService } from "@/lib/services/activity.service";

export const useTimeTracking = (active: boolean = true) => {
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedTimeRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        session_id: sessionIdRef.current,
        date: getFormattedDate(),
        device_type: getDeviceType(),
        session_only: isSessionEnd,
      });

      // After a successful heartbeat, reset start time and accumulated time
      // so we don't double count in the next heartbeat
      startTimeRef.current = now;
      accumulatedTimeRef.current = 0;
    } catch (error) {
      // Silently fail as requested (without user knowing)
    }
  };

  const startNewSession = () => {
    sessionIdRef.current = crypto.randomUUID();
    startTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    
    // Start heartbeat
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(() => {
      sendTrackingData(false);
    }, 30000); // 30 second heartbeat
  };

  const endCurrentSession = async () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    await sendTrackingData(true);
  };

  useEffect(() => {
    if (!active) return;

    // Initial session start
    startNewSession();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tab or left browser - end session
        endCurrentSession();
      } else {
        // User came back - start new session
        startNewSession();
      }
    };

    const handleBeforeUnload = () => {
      // Tab is being closed
      sendTrackingData(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [active]);

  return null;
};







