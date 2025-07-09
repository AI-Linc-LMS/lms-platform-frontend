import { ActivitySession } from '../contexts/UserActivityContext';
import { sendActivityData, storeActivityDataLocally, syncOfflineActivityData, ActivityData } from '../services/activityTrackingApi';
import { getDeviceFingerprint } from './deviceIdentifier';
import { logActivityEvent } from './activityDebugger';
import { getCurrentUserId } from './userIdHelper';

// Storage keys for deduplication (must match UserActivityContext)
const STORAGE_KEYS = {
  LAST_SYNC_DATA: 'lastSyncData',
  LAST_SYNC_TIME: 'lastSyncTime'
};

// Function to record a successful sync for deduplication
const recordSuccessfulSync = (totalTimeInSeconds: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_DATA, totalTimeInSeconds.toString());
  } catch {
    logActivityEvent('Failed to record sync data');
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
    device_info
  };

  // Check if online
  if (navigator.onLine) {
    try {
      await sendActivityData(activityData);
      // Also try to sync any offline data we may have
      await syncOfflineActivityData();
      
      logActivityEvent('Activity data synced successfully', {
        totalTimeSpent,
        sessionId: session_id,
        timestamp: activityData.timestamp
      });
    } catch (error) {
      //console.error('Failed to sync activity data:', error);
      logActivityEvent('Failed to sync activity data, storing locally', { error: (error as Error).message });
      // If online but API call failed, store locally
      storeActivityDataLocally(activityData);
    }
  } else {
    // If offline, store locally for later sync
    logActivityEvent('Offline: storing activity data locally', { totalTimeSpent });
    storeActivityDataLocally(activityData);
  }
};

/**
 * Set up listeners to sync data when coming back online
 */
export const setupActivitySyncListeners = (): void => {
  // Try to sync when coming back online
  window.addEventListener('online', async () => {
    //console.log('Device back online, attempting to sync activity data');
    try {
      await syncOfflineActivityData();
    } catch (error) {
      //console.error('Failed to sync offline data when coming back online:', error);
    }
  });

  // Store current data when going offline
  window.addEventListener('offline', () => {
    //console.log('Device offline, activity data will be stored locally');
  });
};

/**
 * Calculates the current session duration in seconds
 * @param isActive Whether the session is currently active
 * @param currentSessionStart Timestamp when the session started
 * @returns Duration in seconds
 */
export const calculateCurrentSessionDuration = (isActive: boolean, currentSessionStart: number | null): number => {
  if (!isActive || !currentSessionStart) {
    return 0;
  }

  const now = Date.now();
  const durationMs = now - currentSessionStart;
  
  // Safety check for negative duration (clock skew)
  if (durationMs < 0) {
    logActivityEvent('Negative session duration detected in calculation, using 0', {
      startTime: currentSessionStart,
      currentTime: now,
      difference: durationMs
    });
    return 0;
  }
  
  // Safety check for unreasonably long durations (over 24 hours)
  if (durationMs > 86400000) { // 24 hours in milliseconds
    logActivityEvent('Unreasonably long session detected in calculation, capping at 24 hours', {
      startTime: currentSessionStart,
      currentTime: now,
      difference: durationMs
    });
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
export const validateTimeValue = (timeValue: unknown, defaultValue: number = 0): number => {
  // Check if it's a valid number
  if (typeof timeValue !== 'number' || isNaN(timeValue)) {
    return defaultValue;
  }
  
  // Check for negative values
  if (timeValue < 0) {
    return defaultValue;
  }
  
  // Check for unreasonably large values (more than 24 hours)
  if (timeValue > 86400) { // 24 hours in seconds
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
  const currentSessionDuration = calculateCurrentSessionDuration(isActive, currentSessionStart);
  
  // Return combined time
  return validatedTotalTime + currentSessionDuration;
};

/**
 * Formats a timestamp for consistent date representation
 * @param date Date object or timestamp
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatDateForApi = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    timestamp: Date.now()
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
    timestamp: timestamp // Client timestamp for verification
  };
};

/**
 * Immediately sends session-end data to the backend with exact timing
 * This ensures no time loss and includes session-end information
 * @param sessionStartTime When the session started (timestamp)
 * @param sessionEndTime When the session ended (timestamp)
 * @param sessionDuration Duration of the session in seconds
 * @param totalTimeSpent Total time spent including this session
 * @param sessionId Session identifier
 * @param deviceInfo Device information
 * @param userId User identifier
 * @returns Promise that resolves when data is sent
 */
export const sendSessionEndData = async (
  sessionStartTime: number,
  sessionEndTime: number,
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
      logActivityEvent('Missing API URL or Client ID for session-end sync');
      return;
    }
    
    // Validate time values
    const validatedSessionDuration = validateTimeValue(sessionDuration);
    const validatedTotalTime = validateTimeValue(totalTimeSpent);
    
    // Get user ID (use provided userId or get current user ID)
    const finalUserId = userId || getCurrentUserId();
    
    // Create session-end payload with exact timing
    const sessionEndPayload = {
      date: formatDateForApi(new Date(sessionEndTime)),
      "time-spend-seconds": validatedTotalTime, // Total time including this session
      "time-spend": Math.floor(validatedTotalTime / 60), // Total minutes (no inflation)
      session_id: sessionId,
      device_info: deviceInfo,
      user_id: finalUserId,
      timestamp: sessionEndTime, // Exact end time
      
      // Session-specific information
      session_start_time: sessionStartTime,
      session_end_time: sessionEndTime,
      session_duration_seconds: validatedSessionDuration,
      event_type: "session-end", // Mark this as a session-end event
      
      // Additional context
      client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      session_end_reason: "user_inactive" // Could be extended for different reasons
    };
    
    logActivityEvent('Sending immediate session-end data', {
      sessionDuration: validatedSessionDuration,
      totalTime: validatedTotalTime,
      sessionStartTime: new Date(sessionStartTime).toISOString(),
      sessionEndTime: new Date(sessionEndTime).toISOString(),
      endpoint: `${apiUrl}/activity/clients/${clientId}/activity-log/`
    });
    
    // Use fetch for immediate sending (not beacon, for better error handling)
    const response = await fetch(`${apiUrl}/activity/clients/${clientId}/activity-log/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        } : {})
      },
      body: JSON.stringify(sessionEndPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Session-end API call failed with status ${response.status}`);
    }
    
    const responseData = await response.json();
    
    logActivityEvent('Session-end data sent successfully', {
      sessionDuration: validatedSessionDuration,
      totalTime: validatedTotalTime,
      response: responseData
    });
    
    // Record this sync to prevent duplicates
    recordSuccessfulSync(validatedTotalTime);
    
  } catch (error) {
    logActivityEvent('Failed to send session-end data', { 
      error: (error as Error).message,
      sessionDuration,
      totalTime: totalTimeSpent
    });
    
    // Store as pending data if immediate send fails
    try {
      const pendingData = {
        totalTimeSpent,
        sessionStartTime,
        sessionEndTime,
        sessionDuration,
        timestamp: sessionEndTime,
        eventType: 'session-end'
      };
      
      localStorage.setItem('pendingSessionEndData', JSON.stringify(pendingData));
      logActivityEvent('Stored session-end data as pending for later sync');
    } catch (storageError) {
      logActivityEvent('Failed to store pending session-end data', { 
        error: (storageError as Error).message 
      });
    }
    
    throw error; // Re-throw to allow caller to handle
  }
};

/**
 * Sends session-end data using Beacon API for critical exit events
 * This is used when the page is unloading and we need guaranteed delivery
 * @param sessionStartTime When the session started (timestamp)
 * @param sessionEndTime When the session ended (timestamp)
 * @param sessionDuration Duration of the session in seconds
 * @param totalTimeSpent Total time spent including this session
 * @param sessionId Session identifier
 * @param deviceInfo Device information
 * @param userId User identifier
 * @returns Boolean indicating if beacon was successfully queued
 */
export const sendSessionEndDataViaBeacon = (
  sessionStartTime: number,
  sessionEndTime: number,
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
      logActivityEvent('Missing API URL or Client ID for beacon session-end');
      return false;
    }
    
    // Validate time values
    const validatedSessionDuration = validateTimeValue(sessionDuration);
    const validatedTotalTime = validateTimeValue(totalTimeSpent);
    
    // Get user ID (use provided userId or get current user ID)
    const finalUserId = userId || getCurrentUserId();
    
    // Create session-end payload with exact timing
    const sessionEndPayload = {
      date: formatDateForApi(new Date(sessionEndTime)),
      "time-spend-seconds": validatedTotalTime,
      "time-spend": Math.floor(validatedTotalTime / 60),
      session_id: sessionId,
      device_info: deviceInfo,
      user_id: finalUserId,
      timestamp: sessionEndTime,
      
      // Session-specific information
      session_start_time: sessionStartTime,
      session_end_time: sessionEndTime,
      session_duration_seconds: validatedSessionDuration,
      event_type: "session-end-beacon", // Mark this as a beacon session-end event
      
      // Additional context
      client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      session_end_reason: "page_unload"
    };
    
    // Use Beacon API for guaranteed delivery during page unload
    const blob = new Blob([JSON.stringify(sessionEndPayload)], { type: 'application/json' });
    const success = navigator.sendBeacon(`${apiUrl}/activity/clients/${clientId}/activity-log/`, blob);
    
    logActivityEvent('Sent session-end data via beacon', {
      sessionDuration: validatedSessionDuration,
      totalTime: validatedTotalTime,
      sessionStartTime: new Date(sessionStartTime).toISOString(),
      sessionEndTime: new Date(sessionEndTime).toISOString(),
      success
    });
    
    if (success) {
      // Record this sync to prevent duplicates
      recordSuccessfulSync(validatedTotalTime);
    }
    
    return success;
  } catch (error) {
    logActivityEvent('Failed to send session-end data via beacon', { 
      error: (error as Error).message 
    });
    return false;
  }
}; 