import axios from 'axios';
import { ActivitySession } from '../contexts/UserActivityContext';
// import { getAuthenticatedUserId } from '../utils/userIdHelper';
// import { getDeviceId } from '../utils/deviceIdentifier';

// Base axios instance with common configurations
const activityTrackingInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Use your API URL from environment variables
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
activityTrackingInstance.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
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
  const currentSessionDuration = data.activitySessions.length > 0 
    ? Math.floor((Date.now() - data.activitySessions[data.activitySessions.length - 1].startTime) / 1000)
    : 0;
  
  // Send only the current session time, not total accumulated time
  const sessionTimeToSend = currentSessionDuration;
  
  // Clean API payload with only session time
  const apiData = {
    "time_spent_seconds": sessionTimeToSend, // Send only current session time
    "session_id": data.userId,
    "date": new Date(data.timestamp).toISOString().split('T')[0], // YYYY-MM-DD format
    "device_type": data.device_info.deviceType,
    "session_only": true // Indicate this is session-only data
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
    const existingDataStr = localStorage.getItem('offlineActivityData');
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
    
    existingData.push(data);
    localStorage.setItem('offlineActivityData', JSON.stringify(existingData));
  } catch {
    // Silently fail if localStorage is not available
  }
};

/**
 * Sync offline activity data when back online
 */
export const syncOfflineActivityData = async (): Promise<void> => {
  try {
    const storedData = localStorage.getItem('offlineActivityData');
    if (!storedData) return;
    
    const offlineData: ActivityData[] = JSON.parse(storedData);
    if (offlineData.length === 0) return;
    
    const clientId = import.meta.env.VITE_CLIENT_ID;
    
    // Process each offline activity record
    const promises = offlineData.map(data => {
      // Calculate only the session duration for each record (not cumulative)
      const sessionDuration = data.activitySessions.length > 0 
        ? Math.floor((data.timestamp - data.activitySessions[data.activitySessions.length - 1].startTime) / 1000)
        : 0;
      
      // Send only the session time for this record
      const apiData = {
        "time_spent_seconds": sessionDuration, // Send only session time
        "session_id": data.userId,
        "date": new Date(data.timestamp).toISOString().split('T')[0], // YYYY-MM-DD format
        "device_type": data.device_info.deviceType,
        "session_only": true // Indicate this is session-only data
      };
      
      // Send API call for each offline record
      return activityTrackingInstance.post(`/activity/clients/${clientId}/track-time/`, apiData);
    });
    
    await Promise.all(promises);
    
    // Clear synced data
    localStorage.removeItem('offlineActivityData');
  } catch {
    // Silently fail - offline sync will be retried later
  }
};