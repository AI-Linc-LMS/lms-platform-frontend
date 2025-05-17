import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logActivityEvent } from '../utils/activityDebugger';
import { getDeviceFingerprint } from '../utils/deviceIdentifier';

interface UserActivityContextType {
  isActive: boolean;
  totalTimeSpent: number; // in seconds
  currentSessionStart: number | null;
  activityHistory: ActivitySession[];
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
  TOTAL_TIME_BACKUP: 'totalTimeBackup'
};

const initialState: UserActivityContextType = {
  isActive: true,
  totalTimeSpent: 0,
  currentSessionStart: null,
  activityHistory: [],
};

export const UserActivityContext = createContext<UserActivityContextType>(initialState);

export const useUserActivity = () => useContext(UserActivityContext);

export const UserActivityProvider = ({ children }: UserActivityProviderProps) => {
  // Initialize state from localStorage if available
  const initializeFromStorage = (): UserActivityContextType => {
    try {
      // Check for backup data
      const backupDataStr = localStorage.getItem(STORAGE_KEYS.SESSION_BACKUP);
      if (backupDataStr) {
        const backupData = JSON.parse(backupDataStr);
        logActivityEvent('Recovered state from backup', backupData);
        return {
          ...initialState,
          totalTimeSpent: backupData.totalTimeSpent || 0,
          activityHistory: backupData.activityHistory || [],
          currentSessionStart: Date.now(), // Always start a new session
        };
      }
    } catch (error) {
      logActivityEvent('Failed to load from backup', { error: (error as Error).message });
    }

    return {
      ...initialState,
      currentSessionStart: Date.now(),
    };
  };

  const [activityState, setActivityState] = useState<UserActivityContextType>(initializeFromStorage);

  // Backup activity state to localStorage every 10 seconds
  useEffect(() => {
    const backupInterval = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, JSON.stringify({
          totalTimeSpent: activityState.totalTimeSpent,
          activityHistory: activityState.activityHistory,
          lastBackup: Date.now()
        }));
        
        // Also store just the total time as a separate item for extra redundancy
        localStorage.setItem(STORAGE_KEYS.TOTAL_TIME_BACKUP, activityState.totalTimeSpent.toString());
      } catch (error) {
        logActivityEvent('Failed to backup state', { error: (error as Error).message });
      }
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(backupInterval);
  }, [activityState.totalTimeSpent, activityState.activityHistory]);

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
  const endSession = () => {
    setActivityState(prev => {
      if (!prev.currentSessionStart) {
        logActivityEvent('End session called but no active session found');
        return prev;
      }
      
      const now = Date.now();
      const sessionDuration = Math.floor((now - prev.currentSessionStart) / 1000);
      
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
    // Capture current session data just in case
    sendActivityDataUsingBeacon();
    // Also backup when power status changes
    backupCurrentState();
  };

  // Handle pagehide event (mobile browsers, some desktop browsers)
  const handlePageHide = () => {
    logActivityEvent('Page hide event');
    endSession();
    sendActivityDataUsingBeacon();
    backupCurrentState();
  };

  // Handle page freeze (Chrome on mobile when tab is inactive)
  const handlePageFreeze = () => {
    logActivityEvent('Page freeze event');
    endSession();
    sendActivityDataUsingBeacon();
    backupCurrentState();
  };

  // Utility function to backup current state
  const backupCurrentState = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_STATE, JSON.stringify({
        totalTimeSpent: activityState.totalTimeSpent,
        activityHistory: activityState.activityHistory,
        lastSeen: Date.now()
      }));
      localStorage.setItem(STORAGE_KEYS.TOTAL_TIME_BACKUP, activityState.totalTimeSpent.toString());
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

      // Get a user identifier - using a placeholder here
      // In a real app, this would get the actual user ID
      const userId = localStorage.getItem('userId') || 'anonymous';
      
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
      
      // Format data for API
      const syncData = {
        date: formattedDate,
        "time-spend": Math.round(pendingData.totalTimeSpent / 60), // Convert seconds to minutes
        session_id: session_id,
        device_info: device_info,
        user_id: userId // Include user ID for server-side aggregation
      };
      
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
        } else {
          throw new Error(`Sync failed with status ${response.status}`);
        }
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
      
      // Get the activityState from localStorage as we can't access React state during beforeunload
      let state = null;
      try {
        const stateStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY_STATE);
        if (stateStr) {
          state = JSON.parse(stateStr);
        }
      } catch (err) {
        logActivityEvent('Failed to parse state for beacon', { error: (err as Error).message });
      }
      
      if (!state) {
        logActivityEvent('No state to send via beacon');
        return;
      }
      
      // Format data for API
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Get device fingerprint for multi-device tracking
      const { session_id, device_info } = getDeviceFingerprint();
      
      const beaconData = {
        date: formattedDate,
        "time-spend": Math.round(state.totalTimeSpent / 60), // Convert seconds to minutes
        session_id: session_id,
        device_info: device_info
      };
      
      // Use the Beacon API which is designed for exit events
      const blob = new Blob([JSON.stringify(beaconData)], { type: 'application/json' });
      navigator.sendBeacon(`${apiUrl}/activity/clients/${clientId}/activity-log/`, blob);
      
      logActivityEvent('Sent activity data via beacon');
    } catch (error) {
      logActivityEvent('Failed to send via beacon', { error: (error as Error).message });
    }
  };

  // Handle page unload (user closes the tab or navigates away)
  const handleBeforeUnload = () => {
    logActivityEvent('Before unload event');
    endSession();
    sendActivityDataUsingBeacon();
    // Also backup current state
    backupCurrentState();
    
    // Store data to be synced on next visit
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA, JSON.stringify({
        totalTimeSpent: activityState.totalTimeSpent,
        timestamp: Date.now()
      }));
      logActivityEvent('Stored pending activity data for next visit');
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
        if (!clientId) {
          logActivityEvent('Client ID not found, cannot sync');
          return;
        }
        
        // Calculate current session duration if active
        let currentSessionDuration = 0;
        if (activityState.isActive && activityState.currentSessionStart) {
          currentSessionDuration = Math.floor((Date.now() - activityState.currentSessionStart) / 1000);
        }
        
        // Total time in seconds, including current session if active
        const totalTimeInSeconds = activityState.totalTimeSpent + currentSessionDuration;
        
        // Format date in YYYY-MM-DD format
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // Prepare the data in the format required by the API
        const activityData = {
          date: formattedDate,
          "time-spend": Math.round(totalTimeInSeconds / 60) // Convert seconds to minutes and round
        };
        
        // Also backup the state
        backupCurrentState();
        
        // Send using fetch instead of beacon for periodic updates
        fetch(`${import.meta.env.VITE_API_URL || ''}/activity/clients/${clientId}/activity-log/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(activityData)
        }).then(() => {
          logActivityEvent('Periodic sync successful', { data: activityData });
        }).catch(error => {
          logActivityEvent('Periodic sync failed', { error: error.message });
          
          // Store the data as pending if sync fails
          localStorage.setItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA, JSON.stringify(activityData));
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