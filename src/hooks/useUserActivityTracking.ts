import { useContext } from 'react';
import { UserActivityContext, ActivitySession } from '../contexts/UserActivityContext';

export interface UserActivityData {
  isActive: boolean;
  totalTimeSpent: number;
  currentSessionStart: number | null;
  activityHistory: ActivitySession[];
  formatTime: (seconds: number) => string;
  recoverFromLocalStorage: () => number;
  lastResetDate: string | null;
}

// Local storage backup keys (must match those in UserActivityContext)
const STORAGE_KEYS = {
  LAST_ACTIVITY_STATE: 'lastActivityState',
  PENDING_ACTIVITY_DATA: 'pendingActivityData',
  SESSION_BACKUP: 'sessionBackup',
  TOTAL_TIME_BACKUP: 'totalTimeBackup',
  LAST_RESET_DATE: 'lastActivityResetDate'
};

export const useUserActivityTracking = (): UserActivityData => {
  const activityContext = useContext(UserActivityContext);

  // Skip logging here since we're already doing it in the context
  // This avoids duplicate logs
  
  // Helper function to format seconds into a human-readable format
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Function to attempt recovery of total time spent if the context value is unreliable
  const recoverFromLocalStorage = (): number => {
    try {
      // First try the direct total time backup (most reliable)
      const totalTimeStr = localStorage.getItem(STORAGE_KEYS.TOTAL_TIME_BACKUP);
      if (totalTimeStr) {
        const totalTime = parseInt(totalTimeStr, 10);
        if (!isNaN(totalTime) && totalTime > 0) {
          //console.log(`Recovered total time from backup: ${totalTime}s`);
          return totalTime;
        }
      }
      
      // Next try the last activity state which now includes active session duration
      const lastActivityStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY_STATE);
      if (lastActivityStr) {
        const lastActivity = JSON.parse(lastActivityStr);
        if (lastActivity && typeof lastActivity.totalTimeSpent === 'number') {
          // The totalTimeSpent here already includes any active session duration
          //console.log(`Recovered total time from last activity: ${lastActivity.totalTimeSpent}s`);
          
          // Log if there was an active session at the time of backup
          if (lastActivity.activeSessionDuration) {
            //console.log(`Backup included active session of: ${lastActivity.activeSessionDuration}s`);
          }
          
          return lastActivity.totalTimeSpent;
        }
      }
      
      // Finally try the session backup
      const sessionBackupStr = localStorage.getItem(STORAGE_KEYS.SESSION_BACKUP);
      if (sessionBackupStr) {
        const sessionBackup = JSON.parse(sessionBackupStr);
        if (sessionBackup && typeof sessionBackup.totalTimeSpent === 'number') {
          //console.log(`Recovered total time from session backup: ${sessionBackup.totalTimeSpent}s`);
          return sessionBackup.totalTimeSpent;
        }
      }
      
      // If we reach here, no valid data was found
      return 0;
    } catch (error) {
      //console.error('Error recovering activity data from localStorage', error);
      return 0;
    }
  };

  return {
    ...activityContext,
    formatTime,
    recoverFromLocalStorage,
  };
};

export default useUserActivityTracking; 