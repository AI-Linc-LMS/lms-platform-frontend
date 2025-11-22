import { ActivitySession } from "../contexts/UserActivityContext";
import {
  sendActivityData,
  storeActivityDataLocally,
  syncOfflineActivityData,
  ActivityData,
} from "../services/activityTrackingApi";
import { getDeviceFingerprint /*, getDeviceId*/ } from "./deviceIdentifier";
import { logActivityEvent } from "./activityDebugger";
import { getCurrentUserId /*, getAuthenticatedUserId*/ } from "./userIdHelper";

// Storage keys for deduplication (must match UserActivityContext)
const STORAGE_KEYS = {
  LAST_SYNC_DATA: "lastSyncData",
  LAST_SYNC_TIME: "lastSyncTime",
  LAST_SESSION_SENT: "lastSessionSent", // New key for session deduplication
};

// Function to check if we should skip sync due to recent identical session sync
const shouldSkipDuplicateSessionSync = (
  sessionId: string,
  sessionDuration: number
): boolean => {
  try {
    const lastSessionSentStr = localStorage.getItem(
      STORAGE_KEYS.LAST_SESSION_SENT
    );

    if (!lastSessionSentStr) {
      return false;
    }

    const lastSessionSent = JSON.parse(lastSessionSentStr);
    const now = Date.now();

    // If we sent the same session data recently, skip this sync (30 seconds)
    if (
      now - lastSessionSent.timestamp < 30000 &&
      lastSessionSent.sessionId === sessionId &&
      lastSessionSent.sessionDuration === sessionDuration
    ) {
      logActivityEvent("Skipping duplicate session sync in userActivitySync", {
        timeSinceLastSync: now - lastSessionSent.timestamp,
        sessionId,
        sessionDuration,
      });
      return true;
    }

    return false;
  } catch {
    // If there's any error in the deduplication logic, don't block the sync
    return false;
  }
};

// Function to record a successful session sync for deduplication
const recordSuccessfulSessionSync = (
  sessionId: string,
  sessionDuration: number
): void => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.LAST_SESSION_SENT,
      JSON.stringify({
        sessionId,
        sessionDuration,
        timestamp: Date.now(),
      })
    );
  } catch {
    logActivityEvent("Failed to record session sync data in userActivitySync");
  }
};

// Add a helper function to check processed sessions
const isSessionProcessed = (sessionStart: number, sessionDuration: number): boolean => {
  try {
    const processedSessionsStr = localStorage.getItem('processedSessions');
    if (!processedSessionsStr) {
      return false;
    }

    const processedSessions = JSON.parse(processedSessionsStr);
    const sessionKey = `${sessionStart}-${sessionDuration}`;
    
    return processedSessions.includes(sessionKey);
  } catch {
    return false;
  }
};

// Add function to mark processed sessions
const markSessionAsProcessed = (sessionStart: number, sessionDuration: number): void => {
  try {
    const processedSessionsStr = localStorage.getItem('processedSessions');
    const processedSessions = processedSessionsStr ? JSON.parse(processedSessionsStr) : [];
    
    const sessionKey = `${sessionStart}-${sessionDuration}`;
    
    if (!processedSessions.includes(sessionKey)) {
      processedSessions.push(sessionKey);
      
      // Keep only the last 50 processed sessions to avoid storage bloat
      if (processedSessions.length > 50) {
        processedSessions.splice(0, processedSessions.length - 50);
      }
      
      localStorage.setItem('processedSessions', JSON.stringify(processedSessions));
    }
  } catch {
    // Silently fail if localStorage is not available
  }
};

/**
 * Attempts to send activity data to the backend
 * Falls back to local storage if offline
 */
export const syncUserActivity = async (
  userId: string,
  totalTimeSpent: number,
  activitySessions: ActivitySession[]
): Promise<void> => {
  // Get device fingerprint info
  const { session_id, device_info } = getDeviceFingerprint();

  const activityData: ActivityData = {
    userId,
    totalTimeSpent,
    activitySessions,
    timestamp: Date.now(),
    session_id,
    device_info,
  };

  // Check if online
  if (navigator.onLine) {
    try {
      await sendActivityData(activityData);
      // Also try to sync any offline data we may have
      await syncOfflineActivityData();

      logActivityEvent("Activity data synced successfully", {
        totalTimeSpent,
        sessionId: session_id,
        timestamp: activityData.timestamp,
      });
    } catch (error) {
      logActivityEvent("Failed to send activity data, storing locally", {
        error: (error as Error).message,
      });
      // If online but API call failed, store locally
      storeActivityDataLocally(activityData);
    }
  } else {
    // If offline, store locally for later sync
    logActivityEvent("Offline: storing activity data locally", {
      totalTimeSpent,
    });
    storeActivityDataLocally(activityData);
  }
};

/**
 * Set up listeners to sync data when coming back online and handle page unload
 */
export const setupActivitySyncListeners = (): void => {
  // Try to sync when coming back online
  window.addEventListener("online", async () => {
    try {
      await syncOfflineActivityData();
    } catch {
      // Handle error silently
    }
  });

  // Store current data when going offline
  window.addEventListener("offline", () => {
    // Handle offline state
  });

  // Enhanced page unload handler with better context integration
  window.addEventListener("beforeunload", () => {
    try {
      // Try multiple sources for current session data
      let sessionData = null;
      
      // Method 1: Check localStorage for current session
      const currentSessionStr = localStorage.getItem('currentActiveSession');
      if (currentSessionStr) {
        sessionData = JSON.parse(currentSessionStr);
      }
      
      // Method 2: Check for any activity context data
      if (!sessionData) {
        const activityContextStr = localStorage.getItem('userActivityContext');
        if (activityContextStr) {
          const contextData = JSON.parse(activityContextStr);
          if (contextData.isActive && contextData.currentSessionStart) {
            sessionData = {
              isActive: contextData.isActive,
              startTime: contextData.currentSessionStart
            };
          }
        }
      }
      
      
      if (sessionData && sessionData.isActive && sessionData.startTime) {
        const now = Date.now();
        const sessionDuration = Math.floor((now - sessionData.startTime) / 1000);
        
        
        if (sessionDuration > 0) {
          const { device_info } = getDeviceFingerprint();
          const userId = getCurrentUserId();
          
          // Create emergency data
          const emergencyData = {
            sessionDuration,
            sessionStart: sessionData.startTime,
            sessionEnd: now,
            timestamp: now,
            userId,
            deviceType: device_info.deviceType,
            isRefresh: true,
            source: 'beforeunload'
          };
          
          
          // Save to localStorage
          localStorage.setItem('emergencySessionData', JSON.stringify(emergencyData));
          
          // Try immediate API call with beacon
          const apiUrl = import.meta.env.VITE_API_URL;
          const clientId = import.meta.env.VITE_CLIENT_ID;
          
          if (apiUrl && clientId) {
            const payload = {
              "time_spent_seconds": sessionDuration,
              "session_id": userId,
              "date": formatDateForApi(),
              "device_type": device_info.deviceType,
              "session_only": true,
              "event_type": "page_unload"
            };
            
            // Use beacon for immediate send
            const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
            navigator.sendBeacon(
              `${apiUrl}/activity/clients/${clientId}/track-time/`,
              blob
            );
            
          }
        }
      }
    } catch (error) {
      // Error in beforeunload handler
    }
  });

  // Handle page hide for mobile browsers
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) return;
    
    try {
      const currentSessionStr = localStorage.getItem('currentActiveSession');
      if (currentSessionStr) {
        const sessionData = JSON.parse(currentSessionStr);
        const now = Date.now();
        
        if (sessionData.startTime && sessionData.isActive) {
          const sessionDuration = Math.floor((now - sessionData.startTime) / 1000);
          
          if (sessionDuration > 0) {
            const { device_info } = getDeviceFingerprint();
            const userId = getCurrentUserId();
            
            emergencySessionCapture(
              sessionDuration,
              sessionData.startTime,
              device_info,
              userId,
              false
            );
          }
        }
      }
    } catch (error) {
      // Error in pagehide handler
    }
  });
};

/**
 * Calculates the current session duration in seconds
 * @param isActive Whether the session is currently active
 * @param currentSessionStart Timestamp when the session started
 * @returns Duration in seconds
 */
export const calculateCurrentSessionDuration = (
  isActive: boolean,
  currentSessionStart: number | null
): number => {
  if (!isActive || !currentSessionStart) {
    return 0;
  }

  const now = Date.now();
  const durationMs = now - currentSessionStart;

  // Safety check for negative duration (clock skew)
  if (durationMs < 0) {
    logActivityEvent(
      "Negative session duration detected in calculation, using 0",
      {
        startTime: currentSessionStart,
        currentTime: now,
        difference: durationMs,
      }
    );
    return 0;
  }

  // Safety check for unreasonably long durations (over 24 hours)
  if (durationMs > 86400000) {
    // 24 hours in milliseconds
    logActivityEvent(
      "Unreasonably long session detected in calculation, capping at 24 hours",
      {
        startTime: currentSessionStart,
        currentTime: now,
        difference: durationMs,
      }
    );
    return 86400; // 24 hours in seconds
  }

  return Math.floor(durationMs / 1000);
};

/**
 * Validates a time value to ensure it's a reasonable number
 * @param timeValue Time value in seconds to validate
 * @param defaultValue Default value to return if invalid
 * @returns Validated time value
 */
export const validateTimeValue = (
  timeValue: unknown,
  defaultValue: number = 0
): number => {
  // Check if it's a valid number
  if (typeof timeValue !== "number" || isNaN(timeValue)) {
    return defaultValue;
  }

  // Check for negative values
  if (timeValue < 0) {
    return defaultValue;
  }

  // Check for unreasonably large values (more than 24 hours)
  if (timeValue > 86400) {
    // 24 hours in seconds
    return 86400;
  }

  return timeValue;
};

/**
 * Safely combines total time with current session time
 * @param totalTimeSpent Total time spent so far (excluding current session)
 * @param isActive Whether a session is currently active
 * @param currentSessionStart Timestamp when the current session started
 * @returns Combined time in seconds
 */
export const calculateTotalTimeWithSession = (
  totalTimeSpent: number,
  isActive: boolean,
  currentSessionStart: number | null
): number => {
  // Validate base time
  const validatedTotalTime = validateTimeValue(totalTimeSpent);

  // If no active session, just return the validated total
  if (!isActive || !currentSessionStart) {
    return validatedTotalTime;
  }

  // Calculate and validate current session duration
  const currentSessionDuration = calculateCurrentSessionDuration(
    isActive,
    currentSessionStart
  );

  // Return combined time
  return validatedTotalTime + currentSessionDuration;
};

/**
 * Formats a timestamp for consistent date representation
 * @param date Date object or timestamp
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatDateForApi = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

/**
 * Sends session data immediately on page refresh using fetch with keepalive
 * @param sessionDuration Duration of the current session in seconds
 * @param deviceInfo Device information
 * @param userId User identifier
 * @returns Promise that resolves when data is sent
 */
export const sendRefreshSessionData = async (
  sessionDuration: number,
  deviceInfo: { browser: string; os: string; deviceType: string },
  userId?: string
): Promise<void> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!apiUrl || !clientId) {
      logActivityEvent("Missing API URL or Client ID for refresh session sync");
      return;
    }

    // Validate session duration
    const validatedSessionDuration = validateTimeValue(sessionDuration);

    if (validatedSessionDuration === 0) {
      logActivityEvent("No session time to send on refresh");
      return;
    }

    // Get user ID (use provided userId or get current user ID)
    const finalUserId = userId || getCurrentUserId();

    // Create refresh-specific payload
    const refreshPayload = {
      "time_spent_seconds": validatedSessionDuration,
      "session_id": finalUserId,
      "date": formatDateForApi(),
      "device_type": deviceInfo.deviceType,
      "session_only": true,
      "event_type": "page_refresh", // Special flag for refresh events
    };

    logActivityEvent("Sending refresh session data", {
      sessionDuration: validatedSessionDuration,
      endpoint: `${apiUrl}/activity/clients/${clientId}/track-time/`,
    });

    // Use fetch with keepalive to ensure the request completes even during page unload
    const response = await fetch(
      `${apiUrl}/activity/clients/${clientId}/track-time/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token")
            ? {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }
            : {}),
        },
        body: JSON.stringify(refreshPayload),
        keepalive: true, // Critical for page refresh scenarios
      }
    );

    if (!response.ok) {
      throw new Error(
        `Refresh session API call failed with status ${response.status}`
      );
    }

    const responseData = await response.json();

    logActivityEvent("Refresh session data sent successfully", {
      sessionDuration: validatedSessionDuration,
      response: responseData,
    });
  } catch (error) {
    logActivityEvent("Failed to send refresh session data", {
      error: (error as Error).message,
      sessionDuration,
    });

    throw error;
  }
};

/**
 * Creates a standardized activity payload for API
 * @param totalTimeSpent Total time spent in seconds
 * @param currentSessionDuration Current session duration in seconds
 * @param sessionId Session identifier
 * @param deviceInfo Device information
 * @returns Formatted payload object
 */
export const createActivityPayload = (
  totalTimeSpent: number,
  currentSessionDuration: number,
  // sessionId: string,
  deviceInfo: { browser: string; os: string; deviceType: string }
) => {
  // Validate time values
  const validatedTotalTime = validateTimeValue(totalTimeSpent);
  const validatedSessionDuration = validateTimeValue(currentSessionDuration);

  // Get user ID (authenticated user ID or unique anonymous ID)
  const userId = getCurrentUserId();

  return {
    date: formatDateForApi(),
    "time_spent_seconds": validatedTotalTime,
    "time-spend": Math.floor(validatedTotalTime / 60),
    current_session_duration: validatedSessionDuration,
    // session_id: sessionId,
    device_info: deviceInfo,
    session_id: userId,
    // timestamp: Date.now(),
  };
};

/**
 * Creates a standardized activity payload for API with exact time recording
 * This ensures consistent time precision across all API calls
 * @param totalTimeSpent Total time spent in seconds
 * @param currentSessionDuration Current session duration in seconds
 * @param sessionId Session identifier
 * @param deviceInfo Device information
 * @param userId User identifier
 * @param customTimestamp Optional custom timestamp (defaults to current time)
 * @returns Formatted payload object with exact time precision
 */
export const createPreciseActivityPayload = (
  totalTimeSpent: number,
  currentSessionDuration: number,
  // sessionId: string,
  deviceInfo: { browser: string; os: string; deviceType: string },
  userId?: string,
  customTimestamp?: number
) => {
  // Validate time values
  const validatedTotalTime = validateTimeValue(totalTimeSpent);
  const validatedSessionDuration = validateTimeValue(currentSessionDuration);

  // Get user ID (use provided userId or get current user ID)
  const finalUserId = userId || getCurrentUserId();

  // Use provided timestamp or current time
  const timestamp = customTimestamp || Date.now();

  return {
    date: formatDateForApi(new Date(timestamp)),
    "time_spent_seconds": validatedTotalTime, // Exact seconds for precision
    "time-spend": Math.floor(validatedTotalTime / 60), // Use floor to avoid inflating time
    current_session_duration: validatedSessionDuration, // Current session data for diagnostics
    // session_id: sessionId,
    device_info: deviceInfo,
    session_id: finalUserId,
    // timestamp: timestamp, // Client timestamp for verification
  };
};

/**
 * Immediately sends session-end data to the backend with only current session time
 * Now includes processed session tracking to prevent duplicates
 */
export const sendSessionEndData = async (
  sessionStartTime: number,
  _sessionEndTime: number,
  sessionDuration: number,
  _totalTimeSpent: number,
  sessionId: string,
  deviceInfo: { browser: string; os: string; deviceType: string },
  userId?: string
): Promise<void> => {
  try {
    // Check if this session has already been processed
    if (isSessionProcessed(sessionStartTime, sessionDuration)) {
      logActivityEvent("Session already processed, skipping API call", {
        sessionStart: sessionStartTime,
        sessionDuration
      });
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!apiUrl || !clientId) {
      logActivityEvent("Missing API URL or Client ID for session-end sync");
      return;
    }

    // Validate time values
    const validatedSessionDuration = validateTimeValue(sessionDuration);

    // Get user ID (use provided userId or get current user ID)
    const finalUserId = userId || getCurrentUserId();

    // Check if we should skip this sync due to recent identical session sync
    if (shouldSkipDuplicateSessionSync(sessionId, validatedSessionDuration)) {
      logActivityEvent("Skipping duplicate session-end sync", {
        sessionId,
        sessionDuration: validatedSessionDuration,
      });
      return;
    }

    // Create session-end payload with only session duration
    const sessionEndPayload = {
      "time_spent_seconds": validatedSessionDuration, // Send only current session time
      "session_id": finalUserId,
      "date": formatDateForApi(),
      "device_type": deviceInfo.deviceType,
      "session_only": true, // Indicate this is session-only data
    };

    logActivityEvent("Sending session-end data with session time only", {
      sessionDuration: validatedSessionDuration,
      sessionId: sessionId,
      endpoint: `${apiUrl}/activity/clients/${clientId}/track-time/`,
    });

    // Use fetch for immediate sending
    const response = await fetch(
      `${apiUrl}/activity/clients/${clientId}/track-time/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token")
            ? {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }
            : {}),
        },
        body: JSON.stringify(sessionEndPayload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Session-end API call failed with status ${response.status}`
      );
    }

    const responseData = await response.json();

    logActivityEvent("Session-end data sent successfully", {
      sessionDuration: validatedSessionDuration,
      response: responseData,
    });

    // Record this sync to prevent duplicates
    recordSuccessfulSessionSync(sessionId, validatedSessionDuration);
    
    // Mark session as processed
    markSessionAsProcessed(sessionStartTime, validatedSessionDuration);
  } catch (error) {
    logActivityEvent("Failed to send session-end data", {
      error: (error as Error).message,
      sessionDuration,
    });

    // Store as pending data if immediate send fails
    try {
      const pendingData = {
        sessionDuration,
        sessionStartTime,
        sessionEndTime: _sessionEndTime,
        timestamp: _sessionEndTime,
        eventType: "session-end",
      };

      localStorage.setItem(
        "pendingSessionEndData",
        JSON.stringify(pendingData)
      );
      logActivityEvent("Stored session-end data as pending for later sync");
    } catch (storageError) {
      logActivityEvent("Failed to store pending session-end data", {
        error: (storageError as Error).message,
      });
    }

    throw error;
  }
};

/**
 * Sends session-end data using Beacon API for critical exit events with only session time
 * @param sessionStartTime When the session started (timestamp)
 * @param sessionEndTime When the session ended (timestamp)
 * @param sessionDuration Duration of the session in seconds
 * @param _totalTimeSpent Total time spent (ignored, only session duration is sent)
 * @param sessionId Session identifier
 * @param deviceInfo Device information
 * @param userId User identifier
 * @returns Boolean indicating if beacon was successfully queued
 */
export const sendSessionEndDataViaBeacon = (
  _sessionStartTime: number,
  _sessionEndTime: number,
  sessionDuration: number,
  _totalTimeSpent: number, // Ignored parameter for backward compatibility
  sessionId: string,
  deviceInfo: { browser: string; os: string; deviceType: string },
  userId?: string
): boolean => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!apiUrl || !clientId) {
      logActivityEvent("Missing API URL or Client ID for beacon session-end");
      return false;
    }

    // Validate time values
    const validatedSessionDuration = validateTimeValue(sessionDuration);

    // Get user ID (use provided userId or get current user ID)
    const finalUserId = userId || getCurrentUserId();

    // Create session-end payload with only session duration
    const sessionEndPayload = {
      "time_spent_seconds": validatedSessionDuration, // Send only current session time
      "session_id": finalUserId,
      "date": formatDateForApi(),
      "device_type": deviceInfo.deviceType,
      "session_only": true, // Indicate this is session-only data
    };

    // Use Beacon API for guaranteed delivery during page unload
    const blob = new Blob([JSON.stringify(sessionEndPayload)], {
      type: "application/json",
    });
    const success = navigator.sendBeacon(
      `${apiUrl}/activity/clients/${clientId}/track-time/`,
      blob
    );

    logActivityEvent("Sent session-end data via beacon with session time only", {
      sessionDuration: validatedSessionDuration,
      sessionId: sessionId,
      success,
    });

    return success;
  } catch (error) {
    logActivityEvent("Failed to send session-end data via beacon", {
      error: (error as Error).message,
      sessionDuration,
    });
    return false;
  }
};

/**
 * Sends periodic session update with only current session time
 * @param sessionId Session identifier
 * @param deviceInfo Device information
 * @param sessionStartTime When the current session started
 * @param userId User identifier
 * @param _totalTimeSpent Total time spent (ignored parameter for backward compatibility)
 * @returns Promise that resolves when data is sent
 */
export const sendPeriodicSessionUpdate = async (
  sessionId: string,
  deviceInfo: { browser: string; os: string; deviceType: string },
  sessionStartTime: number,
  userId?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _totalTimeSpent: number = 0 // Ignored parameter for backward compatibility
): Promise<void> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!apiUrl || !clientId) {
      logActivityEvent(
        "Missing API URL or Client ID for periodic session update"
      );
      return;
    }

    // Calculate current session duration
    const now = Date.now();
    const sessionDuration = Math.floor((now - sessionStartTime) / 1000);

    // Validate session duration
    const validatedSessionDuration = validateTimeValue(sessionDuration);

    if (validatedSessionDuration === 0) {
      logActivityEvent("No session time to send in periodic update");
      return;
    }

    // Check if we should skip this sync due to recent identical session sync
    if (shouldSkipDuplicateSessionSync(sessionId, validatedSessionDuration)) {
      logActivityEvent("Skipping duplicate periodic session update", {
        sessionId,
        sessionDuration: validatedSessionDuration,
      });
      return;
    }

    // Get user ID (use provided userId or get current user ID)
    const finalUserId = userId || getCurrentUserId();

    // Create session update payload with only session duration
    const sessionUpdatePayload = {
      "time_spent_seconds": validatedSessionDuration, // Send only current session time
      "session_id": finalUserId,
      "date": formatDateForApi(),
      "device_type": deviceInfo.deviceType,
      "session_only": true, // Indicate this is session-only data
    };

    logActivityEvent("Sending periodic session update with session time only", {
      sessionDuration: validatedSessionDuration,
      sessionId: sessionId,
      endpoint: `${apiUrl}/activity/clients/${clientId}/track-time/`,
    });

    // Send the session update
    const response = await fetch(
      `${apiUrl}/activity/clients/${clientId}/track-time/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token")
            ? {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }
            : {}),
        },
        body: JSON.stringify(sessionUpdatePayload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Periodic session update failed with status ${response.status}`
      );
    }

    const responseData = await response.json();

    logActivityEvent("Periodic session update sent successfully", {
      sessionDuration: validatedSessionDuration,
      response: responseData,
    });

    // Record this sync to prevent duplicates
    recordSuccessfulSessionSync(sessionId, validatedSessionDuration);
  } catch (error) {
    logActivityEvent("Failed to send periodic session update", {
      error: (error as Error).message,
      sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000),
    });

    throw error;
  }
};

/**
 * Emergency function to capture session data during page refresh/unload
 * Uses multiple methods to ensure data is not lost
 * @param sessionDuration Duration of the current session in seconds
 * @param sessionStart When the session started (timestamp)
 * @param deviceInfo Device information
 * @param userId User identifier
 * @param isRefresh Whether this is a page refresh vs navigation
 * @returns Boolean indicating if any method succeeded
 */
export const emergencySessionCapture = (
  sessionDuration: number,
  sessionStart: number,
  deviceInfo: { browser: string; os: string; deviceType: string },
  userId?: string,
  isRefresh: boolean = false
): boolean => {
  const validatedSessionDuration = validateTimeValue(sessionDuration);

  if (validatedSessionDuration === 0) {
    logActivityEvent("No session time to capture in emergency");
    return false;
  }

  const finalUserId = userId || getCurrentUserId();
  const now = Date.now();
  let anySucceeded = false;

  // Method 1: localStorage backup (always succeeds unless storage is full)
  try {
    const emergencyData = {
      sessionDuration: validatedSessionDuration,
      sessionStart,
      sessionEnd: now,
      timestamp: now,
      isRefresh,
      userId: finalUserId,
      deviceType: deviceInfo.deviceType,
    };
    localStorage.setItem("emergencySessionData", JSON.stringify(emergencyData));
    anySucceeded = true;
    logActivityEvent("Emergency session saved to localStorage", {
      sessionDuration: validatedSessionDuration,
    });
  } catch (error) {
    logActivityEvent("Failed to save emergency session to localStorage", {
      error: (error as Error).message,
    });
  }

  // Method 2: Multiple beacon attempts
  const apiUrl = import.meta.env.VITE_API_URL;
  const clientId = import.meta.env.VITE_CLIENT_ID;

  if (apiUrl && clientId) {
    const payloads = [
      // Primary payload
      {
        "time_spent_seconds": validatedSessionDuration,
        "session_id": finalUserId,
        "date": formatDateForApi(),
        "device_type": deviceInfo.deviceType,
        "session_only": true,
        "event_type": isRefresh ? "page_refresh" : "page_unload",
      },
      // Backup payload with minimal data
      {
        "time_spent_seconds": validatedSessionDuration,
        "session_id": finalUserId,
        emergency: true,
      },
    ];

    // Try multiple beacon sends for redundancy
    payloads.forEach((payload, index) => {
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        const success = navigator.sendBeacon(
          `${apiUrl}/activity/clients/${clientId}/track-time/`,
          blob
        );

        if (success) {
          anySucceeded = true;
          logActivityEvent(`Emergency beacon ${index + 1} sent successfully`, {
            sessionDuration: validatedSessionDuration,
            isRefresh,
          });
        }
      } catch (error) {
        logActivityEvent(`Emergency beacon ${index + 1} failed`, {
          error: (error as Error).message,
        });
      }
    });
  }

  return anySucceeded;
};

/**
 * Recovers emergency session data after page reload
 * @returns Recovered session data or null
 */
export const recoverEmergencySession = (): {
  sessionDuration: number;
  sessionStart: number;
  sessionEnd: number;
  userId: string;
  deviceType: string;
} | null => {
  try {
    const emergencyDataStr = localStorage.getItem("emergencySessionData");
    if (!emergencyDataStr) {
      return null;
    }

    const emergencyData = JSON.parse(emergencyDataStr);

    // Validate the recovered data
    if (
      typeof emergencyData.sessionDuration === "number" &&
      emergencyData.sessionDuration > 0 &&
      typeof emergencyData.sessionStart === "number" &&
      typeof emergencyData.sessionEnd === "number"
    ) {
      logActivityEvent("Emergency session data recovered", {
        sessionDuration: emergencyData.sessionDuration,
        timeSinceCapture: Date.now() - emergencyData.timestamp,
      });

      // Clear the emergency data after successful recovery
      localStorage.removeItem("emergencySessionData");

      return {
        sessionDuration: emergencyData.sessionDuration,
        sessionStart: emergencyData.sessionStart,
        sessionEnd: emergencyData.sessionEnd,
        userId: emergencyData.userId || getCurrentUserId(),
        deviceType: emergencyData.deviceType || "unknown",
      };
    }
  } catch (error) {
    logActivityEvent("Error recovering emergency session data", {
      error: (error as Error).message,
    });
    // Clear potentially corrupted data
    localStorage.removeItem("emergencySessionData");
  }

  return null;
};

/**
 * Initializes activity tracking and recovers any emergency session data
 * Call this when your app starts up
 */
export const initializeActivityTracking = async (): Promise<void> => {
  
  try {
    // Set up event listeners first
    setupActivitySyncListeners();
    
    // Check for emergency data immediately
    const emergencyDataStr = localStorage.getItem('emergencySessionData');
    
    if (emergencyDataStr) {
      try {
        const emergencyData = JSON.parse(emergencyDataStr);
        
        if (
          typeof emergencyData.sessionDuration === 'number' &&
          emergencyData.sessionDuration > 0
        ) {
          const apiUrl = import.meta.env.VITE_API_URL;
          const clientId = import.meta.env.VITE_CLIENT_ID;
          
          
          if (apiUrl && clientId) {
            const payload = {
              "time_spent_seconds": emergencyData.sessionDuration,
              "session_id": emergencyData.userId || getCurrentUserId(),
              "date": formatDateForApi(),
              "device_type": emergencyData.deviceType || "unknown",
              "session_only": true,
              "event_type": "recovered_session"
            };
            
            
            const response = await fetch(
              `${apiUrl}/activity/clients/${clientId}/track-time/`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(localStorage.getItem("token")
                    ? {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                      }
                    : {}),
                },
                body: JSON.stringify(payload),
              }
            );
            
            
            if (response.ok) {
              const responseData = await response.json();
              logActivityEvent("Emergency session data recovered and sent successfully", {
                sessionDuration: emergencyData.sessionDuration,
                response: responseData
              });
            } else {
              // Failed to send recovery data
            }
          }
        }
      } catch (parseError) {
        // Error parsing emergency data
      }
      
      // Always clear emergency data after processing attempt
      localStorage.removeItem('emergencySessionData');
    }
    
    logActivityEvent("Activity tracking initialized successfully");
  } catch (error) {
    // Error initializing activity tracking
    logActivityEvent("Error initializing activity tracking", {
      error: (error as Error).message,
    });
  }
};
