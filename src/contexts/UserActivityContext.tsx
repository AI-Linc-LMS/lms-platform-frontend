import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logActivityEvent } from '../utils/activityDebugger';
import { getDeviceFingerprint } from '../utils/deviceIdentifier';
import { shouldResetDailyActivity, performDailyReset, markDailyReset } from '../utils/dailyReset';
import { sendSessionEndData, sendSessionEndDataViaBeacon } from '../utils/userActivitySync';
import { getCurrentUserId } from '../utils/userIdHelper';

interface UserActivityContextType {
  isActive: boolean;
  totalTimeSpent: number; // in seconds
  currentSessionStart: number | null;
  activityHistory: ActivitySession[];
  lastResetDate: string | null;
}

export interface ActivitySession {
  startTime: number;
  endTime: number | null;
  duration: number; // in seconds
}

interface UserActivityProviderProps {
  children: ReactNode;
}

// Battery API interfaces
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

// Local storage keys
const STORAGE_KEYS = {
  LAST_ACTIVITY_STATE: 'lastActivityState',
  PENDING_ACTIVITY_DATA: 'pendingActivityData',
  SESSION_BACKUP: 'sessionBackup',
  TOTAL_TIME_BACKUP: 'totalTimeBackup',
  LAST_RESET_DATE: 'lastActivityResetDate',
  ACTIVITY_HISTORY: 'activityHistory',
  LAST_SYNC_DATA: 'lastSyncData',
  LAST_SYNC_TIME: 'lastSyncTime'
};

// Minimum time between syncs to prevent duplicates (in milliseconds)
const MIN_SYNC_INTERVAL = 30000; // 30 seconds

// Function to check if we should skip sync due to recent identical sync
const shouldSkipDuplicateSync = (totalTimeInSeconds: number): boolean => {
  try {
    const lastSyncTimeStr = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
    const lastSyncDataStr = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_DATA);
    
    if (!lastSyncTimeStr || !lastSyncDataStr) {
      return false;
    }
    
    const lastSyncTime = parseInt(lastSyncTimeStr, 10);
    const lastSyncData = parseInt(lastSyncDataStr, 10);
    const now = Date.now();
    
    // If we synced the same data recently, skip this sync
    if (now - lastSyncTime < MIN_SYNC_INTERVAL && lastSyncData === totalTimeInSeconds) {
      logActivityEvent('Skipping duplicate sync', { 
        timeSinceLastSync: now - lastSyncTime,
        lastSyncData,
        currentData: totalTimeInSeconds
      });
      return true;
    }
    
    return false;
  } catch {
    // If there's any error in the deduplication logic, don't block the sync
    return false;
  }
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

const initialState: UserActivityContextType = {
  isActive: true,
  totalTimeSpent: 0,
  currentSessionStart: null,
  activityHistory: [],
  lastResetDate: null
};

export const UserActivityContext = createContext<UserActivityContextType>(initialState);

export const useUserActivity = () => useContext(UserActivityContext);

export const UserActivityProvider = ({ children }: UserActivityProviderProps) => {
  // Initialize state from localStorage if available
  const initializeFromStorage = (): UserActivityContextType => {
    try {
      // Check if we need to reset the daily counter
      if (shouldResetDailyActivity()) {
        // Get the last stored total time before resetting
        const totalTimeBackupStr = localStorage.getItem(STORAGE_KEYS.TOTAL_TIME_BACKUP);
        let prevTotalTime = 0;

        if (totalTimeBackupStr) {
          prevTotalTime = parseInt(totalTimeBackupStr, 10);
          if (isNaN(prevTotalTime)) {
            prevTotalTime = 0;
          }
        }

        // Perform the daily reset, storing the previous total and resetting to 0
        performDailyReset(prevTotalTime);

        // Return a fresh state with zeroed total time
        return {
          ...initialState,
          currentSessionStart: Date.now(),
          lastResetDate: new Date().toISOString()
        };
      }

      // Regular initialization (no daily reset needed)
      const backupDataStr = localStorage.getItem(STORAGE_KEYS.SESSION_BACKUP);
      const lastResetStr = localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);

      if (backupDataStr) {
        const backupData = JSON.parse(backupDataStr);
        logActivityEvent('Recovered state from backup', backupData);
        return {
          ...initialState,
          totalTimeSpent: backupData.totalTimeSpent || 0,
          activityHistory: backupData.activityHistory || [],
          currentSessionStart: Date.now(), // Always start a new session
          lastResetDate: lastResetStr
        };
      }
    } catch (error) {
      logActivityEvent('Failed to load from backup', { error: (error as Error).message });
    }

    return {
      ...initialState,
      currentSessionStart: Date.now(),
      lastResetDate: localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE)
    };
  };

  const [activityState, setActivityState] = useState<UserActivityContextType>(initializeFromStorage);

  // Check for daily reset at periodic intervals
  useEffect(() => {
    const checkDailyResetInterval = setInterval(() => {
      // Check if we need to reset the daily counter
      if (shouldResetDailyActivity()) {
        logActivityEvent('Initiating daily reset check');

        setActivityState(prev => {
          // Store the current total before resetting
          const resetResult = performDailyReset(prev.totalTimeSpent);

          return {
            ...prev,
            totalTimeSpent: resetResult,
            lastResetDate: new Date().toISOString()
          };
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkDailyResetInterval);
  }, []);

  // Backup activity state to localStorage every 10 seconds
  useEffect(() => {
    const backupInterval = setInterval(() => {
      try {
        // Calculate current session duration if there's an active session
        let currentTotalTime = activityState.totalTimeSpent;
        let currentSessionDuration = 0;

        if (activityState.isActive && activityState.currentSessionStart) {
          currentSessionDuration = Math.floor((Date.now() - activityState.currentSessionStart) / 1000);
          if (currentSessionDuration > 0) {
            currentTotalTime += currentSessionDuration;
          }
        }

        localStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, JSON.stringify({
          totalTimeSpent: currentTotalTime,
          activityHistory: activityState.activityHistory,
          lastBackup: Date.now(),
          activeSessionDuration: currentSessionDuration > 0 ? currentSessionDuration : null
        }));

        // Also store just the total time as a separate item for extra redundancy
        localStorage.setItem(STORAGE_KEYS.TOTAL_TIME_BACKUP, currentTotalTime.toString());

        // Log backup with active session info if applicable
        if (currentSessionDuration > 0) {
          logActivityEvent('Periodic backup with active session', {
            totalTime: currentTotalTime,
            sessionDuration: currentSessionDuration
          });
        }
      } catch (error) {
        logActivityEvent('Failed to backup state', { error: (error as Error).message });
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(backupInterval);
  }, [activityState.totalTimeSpent, activityState.activityHistory, activityState.isActive, activityState.currentSessionStart]);

  // Start session when component mounts
  useEffect(() => {
    logActivityEvent('UserActivityProvider mounted');

    // Check for pending activity data that may not have been sent
    try {
      const pendingDataStr = localStorage.getItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
      if (pendingDataStr) {
        logActivityEvent('Found pending activity data');
        // We'll try to send this in the network status handler
      }
    } catch (error) {
      logActivityEvent('Error checking for pending data', { error: (error as Error).message });
    }

    // Ensure we have a reset date set (for initial app usage)
    if (!localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE)) {
      markDailyReset();
      setActivityState(prev => ({
        ...prev,
        lastResetDate: new Date().toISOString()
      }));
    }

    startSession();

    // Add event listeners for browser visibility and focus
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Add additional events for power-related events (works in some browsers)
    const navigatorWithBattery = navigator as NavigatorWithBattery;
    if (navigatorWithBattery.getBattery) {
      navigatorWithBattery.getBattery().then((battery: BatteryManager) => {
        battery.addEventListener('chargingchange', handlePowerChange);
      }).catch((err: Error) => {
        logActivityEvent('Battery API not available', { error: err.message });
      });
    }

    // Network status change
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    // Additional browser-specific events that might indicate the user is leaving
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('freeze', handlePageFreeze);

    // Check network status immediately
    if (navigator.onLine) {
      // Try to send any pending data
      syncPendingData();
    }

    logActivityEvent('Event listeners added');

    // Cleanup event listeners when component unmounts
    return () => {
      logActivityEvent('UserActivityProvider unmounting');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('freeze', handlePageFreeze);

      const navigatorWithBattery = navigator as NavigatorWithBattery;
      if (navigatorWithBattery.getBattery) {
        navigatorWithBattery.getBattery().then((battery: BatteryManager) => {
          battery.removeEventListener('chargingchange', handlePowerChange);
        }).catch(() => {
          // Silently fail if not available
        });
      }

      // End the session when component unmounts
      endSession();
    };
  }, []);

  // Function to start a new session
  const startSession = () => {
    const now = Date.now();
    logActivityEvent('Starting new session', { timestamp: now });

    setActivityState(prev => ({
      ...prev,
      isActive: true,
      currentSessionStart: now,
    }));
  };

  // Function to end current session
  const endSession = async () => {
    setActivityState(prev => {
      if (!prev.currentSessionStart) {
        logActivityEvent('End session called but no active session found');
        return prev;
      }

      const now = Date.now();
      let sessionDuration = Math.floor((now - prev.currentSessionStart) / 1000);

      // Safety check: ensure session duration is positive and reasonable
      if (sessionDuration < 0) {
        logActivityEvent('Negative session duration detected, using 0', {
          startTime: prev.currentSessionStart,
          endTime: now,
          calculatedDuration: sessionDuration
        });
        sessionDuration = 0;
      } else if (sessionDuration > 86400) { // More than 24 hours
        logActivityEvent('Unreasonably long session detected, capping at 24 hours', {
          startTime: prev.currentSessionStart,
          endTime: now,
          calculatedDuration: sessionDuration
        });
        sessionDuration = 86400;
      }

      const newSession: ActivitySession = {
        startTime: prev.currentSessionStart,
        endTime: now,
        duration: sessionDuration,
      };

      logActivityEvent('Ending session', {
        startTime: new Date(prev.currentSessionStart).toISOString(),
        endTime: new Date(now).toISOString(),
        duration: sessionDuration
      });

      const newState = {
        ...prev,
        isActive: false,
        currentSessionStart: null,
        totalTimeSpent: prev.totalTimeSpent + sessionDuration,
        activityHistory: [...prev.activityHistory, newSession],
      };

      // Immediately backup the state after ending a session
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, JSON.stringify({
          totalTimeSpent: newState.totalTimeSpent,
          activityHistory: newState.activityHistory,
          lastBackup: Date.now()
        }));
        localStorage.setItem(STORAGE_KEYS.TOTAL_TIME_BACKUP, newState.totalTimeSpent.toString());
      } catch (error) {
        logActivityEvent('Failed to backup state after session end', { error: (error as Error).message });
      }

      // Immediately send session-end data to backend with exact timing
      if (sessionDuration > 0) { // Only send if there was actual activity
        const { session_id, device_info } = getDeviceFingerprint();
        const userId = getCurrentUserId();
        
        // Send session-end data immediately (async, don't block state update)
        sendSessionEndData(
          prev.currentSessionStart,
          now,
          sessionDuration,
          newState.totalTimeSpent,
          session_id,
          device_info,
          userId
        ).catch(error => {
          logActivityEvent('Failed to send immediate session-end data', { 
            error: error.message,
            sessionDuration,
            totalTime: newState.totalTimeSpent
          });
        });
      }

      return newState;
    });
  };

  // Handle document visibility change (user switches tabs or minimizes window)
  const handleVisibilityChange = () => {
    logActivityEvent('Visibility changed', { visibilityState: document.visibilityState });

    if (document.visibilityState === 'visible') {
      startSession();
    } else {
      endSession();
      // Also backup when page becomes hidden
      backupCurrentState();
    }
  };

  // Handle window focus (user returns to the tab)
  const handleFocus = () => {
    logActivityEvent('Window focus gained');
    startSession();
  };

  // Handle window blur (user leaves the tab)
  const handleBlur = () => {
    logActivityEvent('Window focus lost');
    endSession();
    // Also backup when window loses focus
    backupCurrentState();
  };

  // Handle power/charging change
  const handlePowerChange = () => {
    logActivityEvent('Power status changed');
    // End current session and send data immediately
    endSession();
    // Also backup when power status changes
    backupCurrentState();
  };

  // Handle pagehide event (mobile browsers, some desktop browsers)
  const handlePageHide = () => {
    logActivityEvent('Page hide event');
    
    // Calculate session data before ending
    if (activityState.isActive && activityState.currentSessionStart) {
      const now = Date.now();
      const sessionDuration = Math.floor((now - activityState.currentSessionStart) / 1000);
      const totalTimeWithSession = activityState.totalTimeSpent + sessionDuration;
      
      if (sessionDuration > 0) {
        const { session_id, device_info } = getDeviceFingerprint();
        const userId = getCurrentUserId();
        
        // Use beacon for guaranteed delivery during page hide
        sendSessionEndDataViaBeacon(
          activityState.currentSessionStart,
          now,
          sessionDuration,
          totalTimeWithSession,
          session_id,
          device_info,
          userId
        );
      }
    }
    
    endSession();
    backupCurrentState();
  };

  // Handle page freeze (Chrome on mobile when tab is inactive)
  const handlePageFreeze = () => {
    logActivityEvent('Page freeze event');
    
    // Calculate session data before ending
    if (activityState.isActive && activityState.currentSessionStart) {
      const now = Date.now();
      const sessionDuration = Math.floor((now - activityState.currentSessionStart) / 1000);
      const totalTimeWithSession = activityState.totalTimeSpent + sessionDuration;
      
      if (sessionDuration > 0) {
        const { session_id, device_info } = getDeviceFingerprint();
        const userId = getCurrentUserId();
        
        // Use beacon for guaranteed delivery during page freeze
        sendSessionEndDataViaBeacon(
          activityState.currentSessionStart,
          now,
          sessionDuration,
          totalTimeWithSession,
          session_id,
          device_info,
          userId
        );
      }
    }
    
    endSession();
    backupCurrentState();
  };

  // Utility function to backup current state
  const backupCurrentState = () => {
    try {
      // Calculate current session duration if there's an active session
      let currentTotalTime = activityState.totalTimeSpent;
      let currentSessionDuration = 0;

      if (activityState.isActive && activityState.currentSessionStart) {
        currentSessionDuration = Math.floor((Date.now() - activityState.currentSessionStart) / 1000);
        currentTotalTime += currentSessionDuration;
        logActivityEvent('Including active session in backup', { sessionDuration: currentSessionDuration });
      }

      // Store the state including active session data
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_STATE, JSON.stringify({
        totalTimeSpent: currentTotalTime,
        activityHistory: activityState.activityHistory,
        lastSeen: Date.now(),
        activeSessionDuration: currentSessionDuration > 0 ? currentSessionDuration : null
      }));

      // Also store the current total time as a separate backup
      localStorage.setItem(STORAGE_KEYS.TOTAL_TIME_BACKUP, currentTotalTime.toString());

      if (currentSessionDuration > 0) {
        logActivityEvent('Backed up state with active session', {
          totalTime: currentTotalTime,
          sessionDuration: currentSessionDuration
        });
      } else {
        logActivityEvent('Backed up state', { totalTime: currentTotalTime });
      }
    } catch (error) {
      logActivityEvent('Failed to backup current state', { error: (error as Error).message });
    }
  };

  // Handle network changes
  const handleNetworkChange = () => {
    const isOnline = navigator.onLine;
    logActivityEvent('Network status changed', { online: isOnline });

    if (!isOnline) {
      // Save state to local storage when going offline
      backupCurrentState();
    } else {
      // Try to send data when coming back online
      syncPendingData();
      sendActivityDataUsingBeacon();
    }
  };

  // Function to sync pending activity data to the backend
  const syncPendingData = () => {
    try {
      const pendingDataStr = localStorage.getItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
      if (!pendingDataStr) {
        return;
      }

      // Get a user identifier - using the new helper function
      const userId = getCurrentUserId();
      
      // Get device fingerprint for multi-device tracking
      const { session_id, device_info } = getDeviceFingerprint();
      
      // Format the date as the API expects
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Use the Fetch API rather than Beacon for better network tab visibility
      const clientId = import.meta.env.VITE_CLIENT_ID;
      const apiUrl = import.meta.env.VITE_API_URL;
      
      if (!clientId || !apiUrl) {
        logActivityEvent('Missing client ID or API URL for sync');
        return;
      }
      
      // Parse the pending data
      const pendingData = JSON.parse(pendingDataStr);
      
      // Validate the data before sending
      if (typeof pendingData.totalTimeSpent !== 'number' || pendingData.totalTimeSpent < 0) {
        logActivityEvent('Invalid pending data detected', { pendingData });
        localStorage.removeItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
        return;
      }
      
      // Check for duplicate sync
      if (shouldSkipDuplicateSync(pendingData.totalTimeSpent)) {
        localStorage.removeItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
        logActivityEvent('Skipped duplicate pending data sync');
        return;
      }
      
      // Format data for API
      const syncData = {
        date: formattedDate,
        "time-spend-seconds": pendingData.totalTimeSpent, // Send exact seconds for precision
        "time-spend": Math.floor(pendingData.totalTimeSpent / 60), // Use floor to avoid inflating time
        session_id: session_id,
        device_info: device_info,
        user_id: userId, // Include user ID for server-side aggregation
        timestamp: Date.now() // Include client timestamp for verification
      };
      
      logActivityEvent('Syncing pending data', { 
        totalSeconds: pendingData.totalTimeSpent,
        apiUrl: `${apiUrl}/activity/clients/${clientId}/activity-log/`
      });
      
      // Prepare the fetch request
      fetch(`${apiUrl}/activity/clients/${clientId}/activity-log/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(syncData)
      })
        .then(response => {
          if (response.ok) {
            // Clear the pending data only after a successful sync
            localStorage.removeItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
            logActivityEvent('Synced pending activity data successfully');
            
            // Record this sync to prevent duplicates
            recordSuccessfulSync(pendingData.totalTimeSpent);
            
            return response.json();
          } else {
            throw new Error(`Sync failed with status ${response.status}`);
          }
        })
        .then(data => {
          logActivityEvent('Sync response received', { response: data });
        })
        .catch(error => {
          logActivityEvent('Failed to sync pending data', { error: (error as Error).message });
        });
    } catch (error) {
      logActivityEvent('Error processing pending data', { error: (error as Error).message });
    }
  };

  // Function to send data using regular fetch instead of Beacon API for better visibility
  const sendActivityDataUsingBeacon = () => {
    try {
      const clientId = import.meta.env.VITE_CLIENT_ID;
      const apiUrl = import.meta.env.VITE_API_URL;
      
      if (!clientId || !apiUrl) {
        logActivityEvent('Missing client ID or API URL for beacon');
        return;
      }
      
      // Calculate current total including active session if exists
      let totalTimeToSend = 0;
      let currentSessionDuration = 0;
      
      // First try to get the current state directly from React state
      if (activityState.totalTimeSpent !== undefined) {
        totalTimeToSend = activityState.totalTimeSpent;
        
        // Add current session if active
        if (activityState.isActive && activityState.currentSessionStart) {
          currentSessionDuration = Math.floor((Date.now() - activityState.currentSessionStart) / 1000);
          totalTimeToSend += currentSessionDuration;
        }
      } else {
        // Fallback to localStorage if we can't access React state
        try {
          const stateStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY_STATE);
          if (stateStr) {
            const state = JSON.parse(stateStr);
            totalTimeToSend = state.totalTimeSpent || 0;
          } else {
            // Try backup
            const backupStr = localStorage.getItem(STORAGE_KEYS.TOTAL_TIME_BACKUP);
            if (backupStr) {
              totalTimeToSend = parseInt(backupStr, 10) || 0;
            }
          }
        } catch (err) {
          logActivityEvent('Failed to parse state for beacon', { error: (err as Error).message });
        }
      }
      
      if (totalTimeToSend === 0) {
        logActivityEvent('No time data to send via beacon');
        return;
      }
      
      // Check for duplicate sync
      if (shouldSkipDuplicateSync(totalTimeToSend)) {
        logActivityEvent('Skipped duplicate beacon sync');
        return;
      }
      
      // Format data for API
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Get device fingerprint for multi-device tracking
      const { session_id, device_info } = getDeviceFingerprint();
      
      const beaconData = {
        date: formattedDate,
        "time-spend-seconds": totalTimeToSend, // Send exact seconds for precision
        "time-spend": Math.floor(totalTimeToSend / 60), // Use floor to avoid inflating time
        session_id: session_id,
        device_info: device_info,
        current_session_duration: currentSessionDuration, // Send current session separately for diagnostics
        user_id: getCurrentUserId(),
        timestamp: Date.now()
      };
      
      // Use the Beacon API which is designed for exit events
      const blob = new Blob([JSON.stringify(beaconData)], { type: 'application/json' });
      const success = navigator.sendBeacon(`${apiUrl}/activity/clients/${clientId}/activity-log/`, blob);
      
      if (success) {
        // Record this sync to prevent duplicates
        recordSuccessfulSync(totalTimeToSend);
      }
      
      logActivityEvent('Sent activity data via beacon', { 
        totalSeconds: totalTimeToSend,
        currentSessionSeconds: currentSessionDuration,
        success
      });
    } catch (error) {
      logActivityEvent('Failed to send via beacon', { error: (error as Error).message });
    }
  };

  // Handle page unload (user closes the tab or navigates away)
  const handleBeforeUnload = () => {
    logActivityEvent('Before unload event');

    // Calculate session data before ending for beacon
    if (activityState.isActive && activityState.currentSessionStart) {
      const now = Date.now();
      const sessionDuration = Math.floor((now - activityState.currentSessionStart) / 1000);
      const totalTimeWithSession = activityState.totalTimeSpent + sessionDuration;
      
      if (sessionDuration > 0) {
        const { session_id, device_info } = getDeviceFingerprint();
        const userId = getCurrentUserId();
        
        // Use beacon for guaranteed delivery during unload
        sendSessionEndDataViaBeacon(
          activityState.currentSessionStart,
          now,
          sessionDuration,
          totalTimeWithSession,
          session_id,
          device_info,
          userId
        );
      }
    }

    // End the current session if active
    endSession();

    // Also backup current state
    backupCurrentState();

    // Calculate the most accurate total time
    let accurateTotalTime = activityState.totalTimeSpent;

    // If there's still an active session (rare but possible due to event timing)
    if (activityState.isActive && activityState.currentSessionStart) {
      const currentSessionDuration = Math.floor((Date.now() - activityState.currentSessionStart) / 1000);
      accurateTotalTime += currentSessionDuration;
      logActivityEvent('Including active session in before unload', { sessionDuration: currentSessionDuration });
    }

    // Store data to be synced on next visit
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA, JSON.stringify({
        totalTimeSpent: accurateTotalTime,
        timestamp: Date.now()
      }));
      logActivityEvent('Stored pending activity data for next visit', { totalTimeSpent: accurateTotalTime });
    } catch (error) {
      logActivityEvent('Failed to store pending data', { error: (error as Error).message });
    }
  };

  // Periodic sync every 3 minutes to reduce data loss in case of crashes
  useEffect(() => {
    const syncInterval = setInterval(() => {
      logActivityEvent('Performing periodic activity data sync');
      
      // We don't end the session here, just send the current data
      try {
        const clientId = import.meta.env.VITE_CLIENT_ID;
        const apiUrl = import.meta.env.VITE_API_URL;
        
        if (!clientId || !apiUrl) {
          logActivityEvent('Client ID or API URL not found, cannot sync');
          return;
        }
        
        // Calculate current session duration if active
        let currentSessionDuration = 0;
        if (activityState.isActive && activityState.currentSessionStart) {
          currentSessionDuration = Math.floor((Date.now() - activityState.currentSessionStart) / 1000);
          
          // Safety check for negative duration (clock skew)
          if (currentSessionDuration < 0) {
            logActivityEvent('Negative session duration detected in periodic sync, using 0');
            currentSessionDuration = 0;
          }
        }
        
        // Total time in seconds, including current session if active
        const totalTimeInSeconds = activityState.totalTimeSpent + currentSessionDuration;
        
        // Check for duplicate sync
        if (shouldSkipDuplicateSync(totalTimeInSeconds)) {
          logActivityEvent('Skipped duplicate periodic sync');
          return;
        }
        
        // Format date in YYYY-MM-DD format
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // Prepare the data in the format required by the API
        const activityData = {
          date: formattedDate,
          "time-spend-seconds": totalTimeInSeconds, // Exact seconds for precision
          "time-spend": Math.floor(totalTimeInSeconds / 60), // Use floor to avoid inflating time
          current_session_duration: currentSessionDuration, // Include current session data for diagnostics
          session_id: getDeviceFingerprint().session_id,
          device_info: getDeviceFingerprint().device_info,
          user_id: getCurrentUserId(),
          timestamp: Date.now() // Include client timestamp for verification
        };
        
        // Also backup the state
        backupCurrentState();
        
        logActivityEvent('Sending periodic sync data', { 
          totalSeconds: totalTimeInSeconds,
          sessionDuration: currentSessionDuration,
          apiUrl: `${apiUrl}/activity/clients/${clientId}/activity-log/`
        });
        
        // Send using fetch instead of beacon for periodic updates
        fetch(`${apiUrl}/activity/clients/${clientId}/activity-log/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(activityData)
        }).then(response => {
          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
          }
          
          // Record this sync to prevent duplicates
          recordSuccessfulSync(totalTimeInSeconds);
          
          return response.json();
        }).then(data => {
          logActivityEvent('Periodic sync successful', { 
            data: activityData,
            response: data
          });
        }).catch(error => {
          logActivityEvent('Periodic sync failed', { error: error.message });
          
          // Store the data as pending if sync fails
          localStorage.setItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA, JSON.stringify({
            totalTimeSpent: totalTimeInSeconds,
            timestamp: Date.now()
          }));
        });
        
      } catch (error) {
        logActivityEvent('Error in periodic sync', { error: (error as Error).message });
      }
    }, 3 * 60 * 1000); // 3 minutes
    
    return () => clearInterval(syncInterval);
  }, [activityState]);

  // Additional sync at shorter interval just for localStorage backup
  useEffect(() => {
    const quickBackupInterval = setInterval(() => {
      backupCurrentState();
    }, 30 * 1000); // Every 30 seconds

    return () => clearInterval(quickBackupInterval);
  }, [activityState]);

  // Log state changes for debugging
  useEffect(() => {
    logActivityEvent('Activity state updated', {
      isActive: activityState.isActive,
      totalTimeSpent: activityState.totalTimeSpent,
      currentSessionStart: activityState.currentSessionStart ?
        new Date(activityState.currentSessionStart).toISOString() : null,
      sessionsCount: activityState.activityHistory.length
    });
  }, [
    activityState.isActive,
    activityState.totalTimeSpent,
    activityState.currentSessionStart,
    activityState.activityHistory.length
  ]);

  return (
    <UserActivityContext.Provider value={activityState}>
      {children}
    </UserActivityContext.Provider>
  );
}; 