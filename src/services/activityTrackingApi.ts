import axios from "axios";
import { ActivitySession } from "../contexts/UserActivityContext";
// import { getAuthenticatedUserId } from '../utils/userIdHelper';
// import { getDeviceId } from '../utils/deviceIdentifier';

// Base axios instance with common configurations
const activityTrackingInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Use your API URL from environment variables
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor for authentication
activityTrackingInstance.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem("token");

    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface ActivityData {
  userId: string;
  totalTimeSpent: number;
  activitySessions: ActivitySession[];
  timestamp: number;
  session_id: string;
  device_info: {
    browser: string;
    os: string;
    deviceType: string;
  };
}

/**
 * Sends user activity data to the backend
 */
export const sendActivityData = async (data: ActivityData): Promise<void> => {
  // Calculate only current session duration (not cumulative)
  const currentSessionDuration =
    data.activitySessions.length > 0
      ? Math.floor(
          (Date.now() -
            data.activitySessions[data.activitySessions.length - 1].startTime) /
            1000
        )
      : 0;

  // Send only the current session time, not total accumulated time
  const sessionTimeToSend = currentSessionDuration;

  // Clean API payload with only session time
  const apiData = {
    time_spent_seconds: sessionTimeToSend, // Send only current session time
    session_id: data.userId,
    date: new Date(data.timestamp).toISOString().split("T")[0], // YYYY-MM-DD format
    device_type: data.device_info.deviceType,
    session_only: true, // Indicate this is session-only data
  };

  const clientId = import.meta.env.VITE_CLIENT_ID;
  const endpoint = `/activity/clients/${clientId}/track-time/`;

  // Send the actual API call
  await activityTrackingInstance.post(endpoint, apiData);
};

/**
 * Store activity data locally for offline usage
 */
export const storeActivityDataLocally = (data: ActivityData): void => {
  try {
    const existingDataStr = localStorage.getItem("offlineActivityData");
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];

    existingData.push(data);
    localStorage.setItem("offlineActivityData", JSON.stringify(existingData));
  } catch {
    // Silently fail if localStorage is not available
  }
};

/**
 * Sync offline activity data when back online
 */
export const syncOfflineActivityData = async (): Promise<void> => {
  try {
    const storedData = localStorage.getItem("offlineActivityData");
    if (!storedData) return;

    const offlineData: ActivityData[] = JSON.parse(storedData);
    if (offlineData.length === 0) return;

    const clientId = import.meta.env.VITE_CLIENT_ID;

    // Process each offline activity record
    const promises = offlineData.map((data) => {
      // Calculate only the session duration for each record (not cumulative)
      const sessionDuration =
        data.activitySessions.length > 0
          ? Math.floor(
              (data.timestamp -
                data.activitySessions[data.activitySessions.length - 1]
                  .startTime) /
                1000
            )
          : 0;

      // Send only the session time for this record
      const apiData = {
        time_spent_seconds: sessionDuration, // Send only session time
        session_id: data.userId,
        date: new Date(data.timestamp).toISOString().split("T")[0], // YYYY-MM-DD format
        device_type: data.device_info.deviceType,
        session_only: true, // Indicate this is session-only data
      };

      // Send API call for each offline record
      return activityTrackingInstance.post(
        `/activity/clients/${clientId}/track-time/`,
        apiData
      );
    });

    await Promise.all(promises);

    // Clear synced data
    localStorage.removeItem("offlineActivityData");
  } catch {
    // Silently fail - offline sync will be retried later
  }
};

/**
 * Marks a session as processed to prevent duplicate sends
 */
export const markSessionAsProcessed = (
  sessionStart: number,
  sessionDuration: number
): void => {
  try {
    const processedSessionsStr = localStorage.getItem("processedSessions");
    const processedSessions = processedSessionsStr
      ? JSON.parse(processedSessionsStr)
      : [];

    const sessionKey = `${sessionStart}-${sessionDuration}`;

    if (!processedSessions.includes(sessionKey)) {
      processedSessions.push(sessionKey);

      // Keep only the last 50 processed sessions to avoid storage bloat
      if (processedSessions.length > 50) {
        processedSessions.splice(0, processedSessions.length - 50);
      }

      localStorage.setItem(
        "processedSessions",
        JSON.stringify(processedSessions)
      );
    }
  } catch {
    // Silently fail if localStorage is not available
  }
};

/**
 * Attempts to recover and send any emergency session data from previous page loads
 */
export const recoverAndSendEmergencyData = async (): Promise<void> => {
  try {
    const emergencyDataStr = localStorage.getItem("emergencySessionData");
    if (!emergencyDataStr) {
      return;
    }

    const emergencyData = JSON.parse(emergencyDataStr);

    // Validate the emergency data
    if (
      typeof emergencyData.sessionDuration === "number" &&
      emergencyData.sessionDuration > 0 &&
      typeof emergencyData.userId === "string"
    ) {
      const clientId = import.meta.env.VITE_CLIENT_ID;

      // Prepare recovery payload
      const recoveryPayload = {
        time_spent_seconds: emergencyData.sessionDuration,
        session_id: emergencyData.userId,
        date: new Date(emergencyData.timestamp).toISOString().split("T")[0],
        device_type: emergencyData.deviceType || "unknown",
        session_only: true,
        event_type: "recovered_session",
      };

      // Send the recovered data
      await activityTrackingInstance.post(
        `/activity/clients/${clientId}/track-time/`,
        recoveryPayload
      );

      console.log("Emergency session data recovered and sent:", {
        sessionDuration: emergencyData.sessionDuration,
        recoveredAt: new Date().toISOString(),
      });
    }

    // Clear the emergency data after successful recovery
    localStorage.removeItem("emergencySessionData");
  } catch (error) {
    console.error("Failed to recover emergency session data:", error);
    // Clear potentially corrupted data
    localStorage.removeItem("emergencySessionData");
  }
};
