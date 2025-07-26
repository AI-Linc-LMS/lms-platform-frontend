import { ActivitySession } from "../contexts/UserActivityContext";
import {
  sendActivityData,
  storeActivityDataLocally,
  syncOfflineActivityData,
  ActivityData,
} from "../services/activityTrackingApi";
import { getDeviceFingerprint, getDeviceId } from "./deviceIdentifier";
import { logActivityEvent } from "./activityDebugger";
import { getCurrentUserId, getAuthenticatedUserId } from "./userIdHelper";

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
 * Set up listeners to sync data when coming back online
 */
export const setupActivitySyncListeners = (): void => {
  // Try to sync when coming back online
  window.addEventListener("online", async () => {
    //console.log('Device back online, attempting to sync activity data');
    try {
      await syncOfflineActivityData();
    } catch {
      //console.error('Failed to sync offline data when coming back online:', error);
    }
  });

  // Store current data when going offline
  window.addEventListener("offline", () => {
    //console.log('Device offline, activity data will be stored locally');
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
  sessionId: string,
  deviceInfo: { browser: string; os: string; deviceType: string }
) => {
  // Validate time values
  const validatedTotalTime = validateTimeValue(totalTimeSpent);
  const validatedSessionDuration = validateTimeValue(currentSessionDuration);

  // Get user ID (authenticated user ID or unique anonymous ID)
  const userId = getCurrentUserId();

  return {
    date: formatDateForApi(),
    "time-spend-seconds": validatedTotalTime,
    "time-spend": Math.floor(validatedTotalTime / 60),
    current_session_duration: validatedSessionDuration,
    session_id: sessionId,
    device_info: deviceInfo,
    user_id: userId,
    timestamp: Date.now(),
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
  sessionId: string,
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
    "time-spend-seconds": validatedTotalTime, // Exact seconds for precision
    "time-spend": Math.floor(validatedTotalTime / 60), // Use floor to avoid inflating time
    current_session_duration: validatedSessionDuration, // Current session data for diagnostics
    session_id: sessionId,
    device_info: deviceInfo,
    user_id: finalUserId,
    timestamp: timestamp, // Client timestamp for verification
  };
};

/**
 * Immediately sends session-end data to the backend with total accumulated time
 * @param sessionStartTime When the session started (timestamp)
 * @param sessionEndTime When the session ended (timestamp)
 * @param sessionDuration Duration of the session in seconds
 * @param totalTimeSpent Total time spent including this session (Today's Total)
 * @param sessionId Session identifier
 * @param deviceInfo Device information
 * @param userId User identifier
 * @returns Promise that resolves when data is sent
 */
export const sendSessionEndData = async (
  _sessionStartTime: number,
  _sessionEndTime: number,
  sessionDuration: number,
  totalTimeSpent: number,
  sessionId: string,
  deviceInfo: { browser: string; os: string; deviceType: string },
  userId?: string
): Promise<void> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!apiUrl || !clientId) {
      logActivityEvent("Missing API URL or Client ID for session-end sync");
      return;
    }

    // Validate time values
    const validatedSessionDuration = validateTimeValue(sessionDuration);
    const validatedTotalTime = validateTimeValue(totalTimeSpent);

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

    // Create session-end payload with total accumulated time (Today's Total)
    const sessionEndPayload = {
      "total-time-seconds": validatedTotalTime, // Send Today's Total (accumulated time)
      "session_id": sessionId,
      "account_id": getAuthenticatedUserId(), // User's account ID (same across all devices)
      "user_id": finalUserId, // Keep for backward compatibility
      "device_id": getDeviceId(), // Unique device/browser identifier
      "date": formatDateForApi(),
      "device_type": deviceInfo.deviceType,
      "timestamp": Date.now()
    };

    logActivityEvent("Sending session-end data with total accumulated time", {
      sessionDuration: validatedSessionDuration,
      totalAccumulatedTime: validatedTotalTime,
      sessionId: sessionId,
      endpoint: `${apiUrl}/activity/clients/${clientId}/activity-log/`,
    });

    // Use fetch for immediate sending
    const response = await fetch(
      `${apiUrl}/activity/clients/${clientId}/activity-log/`,
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
      totalAccumulatedTime: validatedTotalTime,
      response: responseData,
    });

    // Record this sync to prevent duplicates
    recordSuccessfulSessionSync(sessionId, validatedSessionDuration);
  } catch (error) {
    logActivityEvent("Failed to send session-end data", {
      error: (error as Error).message,
      sessionDuration,
      totalTimeForLogging: totalTimeSpent,
    });

    // Store as pending data if immediate send fails
    try {
      const pendingData = {
        sessionDuration,
        sessionStartTime: _sessionStartTime,
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
 * Sends session-end data using Beacon API for critical exit events with total accumulated time
 * @param sessionStartTime When the session started (timestamp)
 * @param sessionEndTime When the session ended (timestamp)
 * @param sessionDuration Duration of the session in seconds
 * @param totalTimeSpent Total time spent including this session (Today's Total)
 * @param sessionId Session identifier
 * @param deviceInfo Device information
 * @param userId User identifier
 * @returns Boolean indicating if beacon was successfully queued
 */
export const sendSessionEndDataViaBeacon = (
  _sessionStartTime: number,
  _sessionEndTime: number,
  sessionDuration: number,
  totalTimeSpent: number,
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
    const validatedTotalTime = validateTimeValue(totalTimeSpent);

    // Get user ID (use provided userId or get current user ID)
    const finalUserId = userId || getCurrentUserId();

    // Create session-end payload with total accumulated time (Today's Total)
    const sessionEndPayload = {
      "total-time-seconds": validatedTotalTime, // Send Today's Total (accumulated time)
      "session_id": sessionId,
      "account_id": getAuthenticatedUserId(), // User's account ID (same across all devices)
      "user_id": finalUserId, // Keep for backward compatibility
      "device_id": getDeviceId(), // Unique device/browser identifier
      "date": formatDateForApi(),
      "device_type": deviceInfo.deviceType,
      "timestamp": Date.now()
    };

    // Use Beacon API for guaranteed delivery during page unload
    const blob = new Blob([JSON.stringify(sessionEndPayload)], {
      type: "application/json",
    });
    const success = navigator.sendBeacon(
      `${apiUrl}/activity/clients/${clientId}/activity-log/`,
      blob
    );

    logActivityEvent("Sent session-end data via beacon with total accumulated time", {
      sessionDuration: validatedSessionDuration,
      totalAccumulatedTime: validatedTotalTime,
      sessionId: sessionId,
      success,
    });

    return success;
  } catch (error) {
    logActivityEvent("Failed to send session-end data via beacon", {
      error: (error as Error).message,
      sessionDuration,
      totalTimeForLogging: totalTimeSpent,
    });
    return false;
  }
};

/**
 * Creates a simplified activity payload that only sends session-specific time
 * This allows the backend to handle cumulative time tracking across multiple devices/sessions
 * @param sessionDuration Duration of the current session in seconds
 * @param sessionId Session identifier
 * @param userId User identifier
 * @returns Formatted payload object with session-specific time only
 */
export const createSessionOnlyActivityPayload = (
  sessionDuration: number,
  sessionId: string,
  userId?: string
) => {
  // Validate time values
  const validatedSessionDuration = validateTimeValue(sessionDuration);

  // Get user ID (use provided userId or get current user ID)
  const finalUserId = userId || getCurrentUserId();

  return {
    "time-spend-seconds": validatedSessionDuration,
    session_id: sessionId,
    user_id: finalUserId,
    session_only: true,
  };
};

/**
 * Sends periodic session update with total accumulated time (Today's Total)
 * @param sessionId Session identifier
 * @param deviceInfo Device information
 * @param sessionStartTime When the current session started
 * @param userId User identifier
 * @param totalTimeSpent Total time spent before current session
 * @returns Promise that resolves when data is sent
 */
export const sendPeriodicSessionUpdate = async (
  sessionId: string,
  deviceInfo: { browser: string; os: string; deviceType: string },
  sessionStartTime: number,
  userId?: string,
  totalTimeSpent: number = 0
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

    // Calculate total accumulated time (Today's Total = previous total + current session)
    const totalAccumulatedTime = validateTimeValue(totalTimeSpent) + validatedSessionDuration;

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

    // Create session update payload with total accumulated time (Today's Total)
    const sessionUpdatePayload = {
      "total-time-seconds": totalAccumulatedTime, // Send Today's Total (accumulated time)
      "session_id": sessionId,
      "account_id": getAuthenticatedUserId(), // User's account ID (same across all devices)
      "user_id": finalUserId, // Keep for backward compatibility
      "device_id": getDeviceId(), // Unique device/browser identifier
      "date": formatDateForApi(),
      "device_type": deviceInfo.deviceType,
      "timestamp": Date.now()
    };

    logActivityEvent("Sending periodic session update with total accumulated time", {
      sessionDuration: validatedSessionDuration,
      totalAccumulatedTime: totalAccumulatedTime,
      sessionId: sessionId,
      endpoint: `${apiUrl}/activity/clients/${clientId}/activity-log/`,
    });

    // Send the session update
    const response = await fetch(
      `${apiUrl}/activity/clients/${clientId}/activity-log/`,
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
      totalAccumulatedTime: totalAccumulatedTime,
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
