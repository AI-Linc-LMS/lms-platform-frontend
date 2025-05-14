import { useContext } from 'react';
import { UserActivityContext, ActivitySession } from '../contexts/UserActivityContext';

export interface UserActivityData {
  isActive: boolean;
  totalTimeSpent: number;
  currentSessionStart: number | null;
  activityHistory: ActivitySession[];
  formatTime: (seconds: number) => string;
}

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

  return {
    ...activityContext,
    formatTime,
  };
};

export default useUserActivityTracking; 