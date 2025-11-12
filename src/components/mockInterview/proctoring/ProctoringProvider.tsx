import React, { createContext, useContext, useEffect, useState } from "react";
import type { ProctoringContextType, ProctoringEvent, ProctoringEventType } from "./types";

export const ProctoringContext = createContext<ProctoringContextType | undefined>(undefined);

export const ProctoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eventLog, setEventLog] = useState<ProctoringEvent[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Always start with fresh events for each interview session
  useEffect(() => {
    const interviewId = getInterviewId();
    // Clear any existing events for this interview
    localStorage.removeItem(`proctoring_events_${interviewId}`);
    setEventLog([]);
  }, []);

  // Clear all proctoring events for current interview
  const clearProctoringEvents = () => {
    const interviewId = getInterviewId();
    setEventLog([]);
    localStorage.removeItem(`proctoring_events_${interviewId}`);
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      setIsScreenSharing(true);
      logEvent("SCREEN_SHARE_START");
    } catch (error) {
      setIsScreenSharing(false);
      throw error;
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    setIsScreenSharing(false);
    logEvent("SCREEN_SHARE_STOP");
  };

  // Get current interview ID from URL or generate one
  const getInterviewId = () => {
    const path = window.location.pathname;
    const match = path.match(/\/mock-interview/);
    return match ? `mock-interview-${Date.now()}` : 'current_interview';
  };

  // Helper to log events and persist to localStorage
  const logEvent = (type: ProctoringEventType, details?: Record<string, any>) => {
    const newEvent = { type, timestamp: Date.now(), details };
    
    setEventLog((prev) => {
      const updated = [...prev, newEvent];
      
      // Persist to localStorage for post-interview analysis
      const interviewId = getInterviewId();
      try {
        localStorage.setItem(`proctoring_events_${interviewId}`, JSON.stringify(updated));
      } catch (error) {
        // Silently fail
      }
      
      return updated;
    });
  };

  // Tab/Window focus/blur tracking
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        logEvent("TAB_BLUR");
      } else if (document.visibilityState === "visible") {
        logEvent("TAB_FOCUS");
      }
    };

    const handleWindowBlur = () => {
      logEvent("WINDOW_BLUR");
    };
    
    const handleWindowFocus = () => {
      logEvent("WINDOW_FOCUS");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  // Expose event log and controls
  const getEventLog = () => eventLog;

  return (
    <ProctoringContext.Provider
      value={{
        eventLog,
        getEventLog,
        clearProctoringEvents,
        startScreenShare,
        stopScreenShare,
        isScreenSharing,
      }}
    >
      {children}
    </ProctoringContext.Provider>
  );
};

export const useProctoringContext = () => {
  const ctx = useContext(ProctoringContext);
  if (!ctx) throw new Error("useProctoringContext must be used within ProctoringProvider");
  return ctx;
};

