import { ActivitySession } from '../contexts/UserActivityContext';
import { sendActivityData, storeActivityDataLocally, syncOfflineActivityData, ActivityData } from '../services/activityTrackingApi';
import { getDeviceFingerprint } from './deviceIdentifier';

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
    } catch (error) {
      console.error('Failed to sync activity data:', error);
      // If online but API call failed, store locally
      storeActivityDataLocally(activityData);
    }
  } else {
    // If offline, store locally for later sync
    storeActivityDataLocally(activityData);
  }
};

/**
 * Set up listeners to sync data when coming back online
 */
export const setupActivitySyncListeners = (): void => {
  // Try to sync when coming back online
  window.addEventListener('online', async () => {
    console.log('Device back online, attempting to sync activity data');
    try {
      await syncOfflineActivityData();
    } catch (error) {
      console.error('Failed to sync offline data when coming back online:', error);
    }
  });

  // Store current data when going offline
  window.addEventListener('offline', () => {
    console.log('Device offline, activity data will be stored locally');
  });
};

/**
 * Calculate current session duration in seconds
 */
export const calculateCurrentSessionDuration = (
  isActive: boolean, 
  currentSessionStart: number | null
): number => {
  if (!isActive || !currentSessionStart) return 0;
  return Math.floor((Date.now() - currentSessionStart) / 1000);
}; 