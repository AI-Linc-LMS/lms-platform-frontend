import axios from 'axios';
import { ActivitySession } from '../contexts/UserActivityContext';

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
}

/**
 * Sends user activity data to the backend
 * Note: This is a placeholder for future implementation
 */
export const sendActivityData = async (data: ActivityData): Promise<void> => {
  try {
    // This is commented out for now since the backend endpoint is not ready
    // When ready, uncomment this code and replace with the actual endpoint
    /*
    await activityTrackingInstance.post('/user-activity', data);
    console.log('Activity data sent successfully');
    */
    
    // For now, just log the data that would be sent
    console.log('Activity data ready to send:', data);
  } catch (error) {
    console.error('Failed to send activity data:', error);
    throw error;
  }
};

/**
 * Store activity data locally when offline
 */
export const storeActivityDataLocally = (data: ActivityData): void => {
  try {
    // Get any existing offline data
    const storedData = localStorage.getItem('offlineActivityData');
    let offlineData: ActivityData[] = storedData ? JSON.parse(storedData) : [];
    
    // Add new data
    offlineData.push(data);
    
    // Store back in localStorage (limited to most recent 50 sessions to prevent storage issues)
    if (offlineData.length > 50) {
      offlineData = offlineData.slice(-50);
    }
    
    localStorage.setItem('offlineActivityData', JSON.stringify(offlineData));
  } catch (error) {
    console.error('Failed to store activity data locally:', error);
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
    
    // This is commented out for now since the backend endpoint is not ready
    // When ready, uncomment this code and replace with the actual endpoint
    /*
    await activityTrackingInstance.post('/user-activity/batch', { activities: offlineData });
    console.log('Offline activity data synced successfully');
    */
    
    // Clear synced data
    localStorage.removeItem('offlineActivityData');
    
    console.log('Would sync offline data:', offlineData);
  } catch (error) {
    console.error('Failed to sync offline activity data:', error);
  }
}; 