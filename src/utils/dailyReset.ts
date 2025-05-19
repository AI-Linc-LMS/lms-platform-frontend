/**
 * Utility for managing daily reset of activity tracking
 */

import { logActivityEvent } from './activityDebugger';

// Storage key for tracking the last reset date
const LAST_RESET_DATE_KEY = 'lastActivityResetDate';

/**
 * Check if a reset should occur by comparing the current date with the last reset date
 * @returns boolean indicating if a reset should occur
 */
export const shouldResetDailyActivity = (): boolean => {
  try {
    const lastResetStr = localStorage.getItem(LAST_RESET_DATE_KEY);
    if (!lastResetStr) {
      // No reset has occurred yet, so we should reset and set the initial date
      return true;
    }

    const lastReset = new Date(lastResetStr);
    const now = new Date();
    
    // Check if it's a new day (compare year, month, and day)
    return (
      lastReset.getFullYear() !== now.getFullYear() ||
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getDate() !== now.getDate()
    );
  } catch (error) {
    // If there's an error, default to not resetting to be safe
    logActivityEvent('Error checking daily reset', { error: (error as Error).message });
    return false;
  }
};

/**
 * Mark the current date as the last reset date
 */
export const markDailyReset = (): void => {
  try {
    const today = new Date();
    localStorage.setItem(LAST_RESET_DATE_KEY, today.toISOString());
    logActivityEvent('Marked daily reset', { date: today.toISOString() });
  } catch (error) {
    logActivityEvent('Error marking daily reset', { error: (error as Error).message });
  }
};

/**
 * Store the previous day's activity for historical tracking
 * @param totalTimeSpent The total time spent on the previous day in seconds
 * @param date Optional date string in YYYY-MM-DD format (defaults to yesterday)
 */
export const storeHistoricalActivity = (totalTimeSpent: number, date?: string): void => {
  try {
    // Get or initialize the history object
    const historyStr = localStorage.getItem('activityHistory') || '{}';
    const history = JSON.parse(historyStr);
    
    // Default to yesterday's date if not provided
    const targetDate = date || getYesterdayDateString();
    
    // Store the time spent on this date
    history[targetDate] = totalTimeSpent;
    
    // Save back to localStorage
    localStorage.setItem('activityHistory', JSON.stringify(history));
    logActivityEvent('Stored historical activity', { date: targetDate, totalTimeSpent });
  } catch (error) {
    logActivityEvent('Error storing historical activity', { error: (error as Error).message });
  }
};

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
};

/**
 * Get historical activity data
 * @returns Object mapping date strings to seconds spent
 */
export const getHistoricalActivity = (): Record<string, number> => {
  try {
    const historyStr = localStorage.getItem('activityHistory') || '{}';
    return JSON.parse(historyStr);
  } catch (error) {
    logActivityEvent('Error retrieving historical activity', { error: (error as Error).message });
    return {};
  }
};

/**
 * Handle the daily reset process, storing the previous day's activity and resetting the counter
 * @param currentTotalTime The current total time spent in seconds
 * @returns 0 (reset time)
 */
export const performDailyReset = (currentTotalTime: number): number => {
  try {
    // Store the current total time as yesterday's activity
    storeHistoricalActivity(currentTotalTime);
    
    // Mark that we've reset today
    markDailyReset();
    
    logActivityEvent('Performed daily activity reset', { previousTotal: currentTotalTime });
    
    // Return 0 to reset the time
    return 0;
  } catch (error) {
    logActivityEvent('Error during daily reset', { error: (error as Error).message });
    // Return the current time in case of failure (don't reset)
    return currentTotalTime;
  }
}; 