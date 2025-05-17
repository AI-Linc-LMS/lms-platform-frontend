import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logActivityEvent } from '../utils/activityDebugger';

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

  // Function to sync pending data that might be stored from previous sessions
  const syncPendingData = async () => {
    try {
      const pendingDataStr = localStorage.getItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
      if (!pendingDataStr) return;
      
      logActivityEvent('Attempting to sync pending activity data');
      
      const pendingData = JSON.parse(pendingDataStr);
      const clientId = import.meta.env.VITE_CLIENT_ID;
      
      if (!clientId) {
        logActivityEvent('Client ID not found, cannot sync pending data');
        return;
      }
      
      // If the pending data is in the old format, convert it to the new format
      let dataToSend = pendingData;
      
      // Check if we need to convert from the old format to the new format
      if (pendingData.totalTimeSpent !== undefined && !pendingData.date) {
        // Format date in YYYY-MM-DD format
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        dataToSend = {
          date: formattedDate,
          "time-spend": Math.round(pendingData.totalTimeSpent / 60) // Convert seconds to minutes
        };
        
        logActivityEvent('Converted pending data from old format to new format', { 
          oldData: pendingData,
          newData: dataToSend
        });
      }
      
      // Send using fetch for pending data
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/activity/clients/${clientId}/activity-log/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (response.ok) {
        logActivityEvent('Successfully synced pending activity data', { data: dataToSend });
        localStorage.removeItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
      } else {
        logActivityEvent('Failed to sync pending data', { status: response.status });
      }
    } catch (error) {
      logActivityEvent('Error syncing pending data', { error: (error as Error).message });
    }
  };

  // Function to send data using regular fetch instead of Beacon API for better visibility
  const sendActivityDataUsingBeacon = () => {
    try {
      // Get user data for client ID
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const clientId = import.meta.env.VITE_CLIENT_ID;
      
      // End current session to update state correctly
      if (activityState.currentSessionStart) {
        endSession();
      }
      
      // Format date in YYYY-MM-DD format
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Prepare the data in the format required by the API
      const activityData = {
        date: formattedDate,
        "time-spend": Math.round(activityState.totalTimeSpent / 60) // Convert seconds to minutes and round
      };
      
      // Log the API call for debugging
      console.log('Sending activity data to API:', activityData);
      logActivityEvent('Sending activity data to API', { 
        endpoint: `/activity/clients/${clientId}/activity-log/`,
        data: activityData
      });
      
      // Using regular fetch instead of beacon for better visibility in network tab during testing
      const apiUrl = `${import.meta.env.VITE_API_URL || ''}/activity/clients/${clientId}/activity-log/`;
      
      // Use fetch for more reliable network tab visibility
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(activityData),
        // For testing purposes, use keepalive to help with visibility
        keepalive: true
      })
      .then(response => {
        if (response.ok) {
          logActivityEvent('Successfully sent activity data', { data: activityData });
        } else {
          logActivityEvent('Failed to send activity data', { status: response.status });
          // Store in localStorage as backup
          localStorage.setItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA, JSON.stringify(activityData));
        }
      })
      .catch(error => {
        logActivityEvent('Error sending activity data', { error: error.message });
        // Store in localStorage as backup
        localStorage.setItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA, JSON.stringify(activityData));
      });
      
    } catch (error) {
      logActivityEvent('Failed to send activity data', { error: (error as Error).message });
      // Store in localStorage as backup
      const backupData = {
        totalTimeSpent: activityState.totalTimeSpent,
        activityHistory: activityState.activityHistory,
        lastSeen: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA, JSON.stringify(backupData));
    }
  };

  // Handle page unload (user closes the tab or navigates away)
  const handleBeforeUnload = () => {
    logActivityEvent('Page unloading');
    
    // Use Beacon API to send data reliably during page unload
    sendActivityDataUsingBeacon();
    
    // Also end the session normally
    endSession();
    
    // Perform one final backup
    backupCurrentState();
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