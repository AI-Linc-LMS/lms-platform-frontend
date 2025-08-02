import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logActivityEvent } from '../utils/activityDebugger';
import { getDeviceFingerprint, clearCurrentSessionId, generateNewSessionId } from '../utils/deviceIdentifier';
import { shouldResetDailyActivity, performDailyReset, markDailyReset } from '../utils/dailyReset';
import { sendSessionEndData, sendSessionEndDataViaBeacon, sendPeriodicSessionUpdate, formatDateForApi } from '../utils/userActivitySync';
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
  LAST_SYNC_TIME: 'lastSyncTime',
  LAST_SESSION_SENT: 'lastSessionSent', // New key for session deduplication
  PROCESSED_SESSIONS: 'processedSessions', // New key to track processed sessions
  ACTIVE_API_CALLS: 'activeApiCalls' // New key to track active API calls
};

// Simple session lock to prevent duplicate API calls
let currentSessionLock: { sessionStart: number; inProgress: boolean } | null = null;

// Function to check if this session is already being processed
const isSessionBeingProcessed = (sessionStart: number): boolean => {
  if (!currentSessionLock) return false;
  return currentSessionLock.sessionStart === sessionStart && currentSessionLock.inProgress;
};

// Function to lock a session while processing
const lockSession = (sessionStart: number): boolean => {
  if (isSessionBeingProcessed(sessionStart)) {
    logActivityEvent('Session already being processed, skipping duplicate call', { sessionStart });
    return false;
  }
  
  currentSessionLock = { sessionStart, inProgress: true };
  logActivityEvent('Session locked for processing', { sessionStart });
  return true;
};

// Function to unlock a session after processing
const unlockSession = (sessionStart: number): void => {
  if (currentSessionLock && currentSessionLock.sessionStart === sessionStart) {
    currentSessionLock = null;
    logActivityEvent('Session unlocked after processing', { sessionStart });
  }
};

// Global state to prevent overlapping API calls
let isApiCallInProgress = false;
let pendingApiCall: Promise<void> | null = null;

// Function to ensure only one API call happens at a time
const executeApiCallSafely = async (apiCallFunction: () => Promise<void>, callSource: string): Promise<void> => {
  // If an API call is already in progress, wait for it to complete
  if (isApiCallInProgress && pendingApiCall) {
    logActivityEvent(`API call from ${callSource} waiting for previous call to complete`);
    await pendingApiCall;
    return;
  }

  // If another call started while we were waiting, skip this one
  if (isApiCallInProgress) {
    logActivityEvent(`API call from ${callSource} skipped - another call in progress`);
    return;
  }

  isApiCallInProgress = true;
  logActivityEvent(`Starting API call from ${callSource}`);

  try {
    pendingApiCall = apiCallFunction();
    await pendingApiCall;
    logActivityEvent(`API call from ${callSource} completed successfully`);
  } catch (error) {
    logActivityEvent(`API call from ${callSource} failed`, { error: (error as Error).message });
    throw error;
  } finally {
    isApiCallInProgress = false;
    pendingApiCall = null;
  }
};

// Minimum time between syncs to prevent duplicates (in milliseconds)
const MIN_SYNC_INTERVAL = 30000; // 30 seconds

// Function to check if we should skip sync due to recent identical session sync
const shouldSkipDuplicateSessionSync = (sessionId: string, sessionDuration: number): boolean => {
  try {
    const lastSessionSentStr = localStorage.getItem(STORAGE_KEYS.LAST_SESSION_SENT);

    if (!lastSessionSentStr) {
      return false;
    }

    const lastSessionSent = JSON.parse(lastSessionSentStr);
    const now = Date.now();

    // If we sent the same session data recently, skip this sync
    if (now - lastSessionSent.timestamp < MIN_SYNC_INTERVAL &&
      lastSessionSent.sessionId === sessionId &&
      lastSessionSent.sessionDuration === sessionDuration) {
      logActivityEvent('Skipping duplicate session sync', {
        timeSinceLastSync: now - lastSessionSent.timestamp,
        sessionId,
        sessionDuration
      });
      return true;
    }

    return false;
  } catch {
    // If there's any error in the deduplication logic, don't block the sync
    return false;
  }
};

// Function to record a successful session sync for deduplication
const recordSuccessfulSessionSync = (sessionId: string, sessionDuration: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SESSION_SENT, JSON.stringify({
      sessionId,
      sessionDuration,
      timestamp: Date.now()
    }));
  } catch {
    logActivityEvent('Failed to record session sync data');
  }
};

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

        // Generate a new session ID for the new day
        generateNewSessionId();
        logActivityEvent('Generated new session ID for daily reset');

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

        // Check if the user has been away for more than 30 minutes
        // If so, generate a new session ID to properly track the new session
        const lastBackup = backupData.lastBackup || 0;
        const timeSinceLastBackup = Date.now() - lastBackup;
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

        if (timeSinceLastBackup > thirtyMinutes) {
          generateNewSessionId();
          logActivityEvent('Generated new session ID after extended absence', {
            timeSinceLastBackup: Math.floor(timeSinceLastBackup / 1000)
          });
        }

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

    // If no backup data exists, this is likely a fresh start
    generateNewSessionId();
    logActivityEvent('Generated new session ID for fresh start');

    return {
      ...initialState,
      currentSessionStart: Date.now(),
      lastResetDate: localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE)
    };
  };

  const [activityState, setActivityState] = useState<UserActivityContextType>(initializeFromStorage);

  // Debug utility function for monitoring the timer system
  const getTimerStatus = () => {
    if (!activityState.isActive || !activityState.currentSessionStart) {
      return {
        isActive: false,
        message: 'No active session',
        nextSyncIn: null,
        currentSessionDuration: 0
      };
    }

    const now = Date.now();
    const currentSessionDuration = Math.floor((now - activityState.currentSessionStart) / 1000);
    const twoMinutesInSeconds = 2 * 60;
    const timeUntilNextSync = twoMinutesInSeconds - (currentSessionDuration % twoMinutesInSeconds);
    
    return {
      isActive: true,
      currentSessionDuration,
      timeUntilNextSync,
      nextSyncAt: new Date(now + (timeUntilNextSync * 1000)).toISOString(),
      message: `Next sync in ${timeUntilNextSync} seconds`
    };
  };

  // Expose timer status for debugging (you can call this from browser console)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { getActivityTimerStatus: () => ReturnType<typeof getTimerStatus> }).getActivityTimerStatus = getTimerStatus;
      
      // Simple duplicate call monitor
      (window as unknown as { 
        getActivityTimerStatus: () => ReturnType<typeof getTimerStatus>;
        checkDuplicateCalls: () => void;
      }).checkDuplicateCalls = () => {
        console.group('🔍 Duplicate Call Check');
        console.log('Current session lock:', currentSessionLock);
        console.log('Activity state:', {
          isActive: activityState.isActive,
          currentSessionStart: activityState.currentSessionStart,
          totalTimeSpent: activityState.totalTimeSpent
        });
        
        // Check recent processed sessions
        try {
          const processedSessionsStr = localStorage.getItem(STORAGE_KEYS.PROCESSED_SESSIONS);
          const lastSessionSentStr = localStorage.getItem(STORAGE_KEYS.LAST_SESSION_SENT);
          
          if (processedSessionsStr) {
            const processedSessions = JSON.parse(processedSessionsStr);
            console.log('Recently processed sessions:', processedSessions.slice(-5));
          }
          
          if (lastSessionSentStr) {
            const lastSessionSent = JSON.parse(lastSessionSentStr);
            console.log('Last session sent:', lastSessionSent);
          }
        } catch (error) {
          console.log('Error reading session data:', error);
        }
        
        console.groupEnd();
      };
    }
  }, [activityState]);

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

  // Simplified approach: Only track actual tab switching and page leaving, not internal focus changes
  
  // Function to start a new session
  const startSession = () => {
    const now = Date.now();
    logActivityEvent('Starting new session', { 
      timestamp: now,
      previousSessionActive: activityState.isActive
    });

    setActivityState(prev => ({
      ...prev,
      isActive: true,
      currentSessionStart: now,
    }));
  };

  // Enhanced function to end current session
  const endSession = async (reason: string = 'general') => {
    setActivityState(prev => {
      if (!prev.currentSessionStart) {
        logActivityEvent('End session called but no active session found', { reason });
        return prev;
      }

      // Check if this session is already being processed
      if (isSessionBeingProcessed(prev.currentSessionStart)) {
        logActivityEvent('Session already being processed, skipping duplicate endSession', { 
          sessionStart: prev.currentSessionStart,
          reason 
        });
        return prev;
      }

      const now = Date.now();
      let sessionDuration = Math.floor((now - prev.currentSessionStart) / 1000);

      // Safety check: ensure session duration is positive and reasonable
      if (sessionDuration < 0) {
        logActivityEvent('Negative session duration detected, using 0', {
          startTime: prev.currentSessionStart,
          endTime: now,
          calculatedDuration: sessionDuration,
          reason
        });
        sessionDuration = 0;
      } else if (sessionDuration > 86400) { // More than 24 hours
        logActivityEvent('Unreasonably long session detected, capping at 24 hours', {
          startTime: prev.currentSessionStart,
          endTime: now,
          calculatedDuration: sessionDuration,
          reason
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
        duration: sessionDuration,
        reason
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

      // Send session-end data ONLY if not already processed and has actual duration
      if (sessionDuration > 0 && !isSessionAlreadyProcessed(prev.currentSessionStart, sessionDuration)) {
        // Lock this session to prevent duplicate processing
        if (lockSession(prev.currentSessionStart)) {
          const { session_id, device_info } = getDeviceFingerprint();
          const userId = getCurrentUserId();

          // Check for duplicate session sync before sending
          if (!shouldSkipDuplicateSessionSync(session_id, sessionDuration)) {
            // Send session-end data immediately (async, don't block state update)
            sendSessionEndData(
              prev.currentSessionStart,
              now,
              sessionDuration,
              newState.totalTimeSpent,
              session_id,
              device_info,
              userId
            ).then(() => {
              // Mark session as processed and record successful sync
              if (prev.currentSessionStart !== null) {
                markSessionAsProcessed(prev.currentSessionStart, sessionDuration);
              }
              recordSuccessfulSessionSync(session_id, sessionDuration);
              // Unlock the session after successful processing
              if (prev.currentSessionStart !== null) {
                unlockSession(prev.currentSessionStart);
              }
              logActivityEvent('Session-end data sent and marked as processed', {
                sessionDuration,
                reason
              });
            }).catch(error => {
              // Unlock the session even if API call fails
              if (prev.currentSessionStart !== null) {
                unlockSession(prev.currentSessionStart);
              }
              logActivityEvent('Failed to send immediate session-end data', {
                error: error.message,
                sessionDuration,
                totalTime: newState.totalTimeSpent,
                reason
              });
            });
          } else {
            // Unlock session if skipping due to duplicate
            unlockSession(prev.currentSessionStart);
            logActivityEvent('Skipped duplicate session-end data send', { reason });
          }
        }
      } else if (sessionDuration > 0) {
        logActivityEvent('Session already processed, skipping endSession API call', {
          sessionStart: prev.currentSessionStart,
          sessionDuration,
          reason
        });
      }

      return newState;
    });
  };
  
  // Handle document visibility change (user switches tabs or minimizes window)
  const handleVisibilityChange = async () => {
    logActivityEvent('Visibility changed', { visibilityState: document.visibilityState });

    if (document.visibilityState === 'visible') {
      // User returned to the tab - start a fresh session
      logActivityEvent('User returned to tab - starting fresh session');
      startSession();
    } else {
      // User actually left the tab (switched to another tab or minimized)
      logActivityEvent('User left tab - ending session with immediate data send');
      
      // Use ONLY endSession, which already handles the API call
      // DO NOT use sendCurrentSessionImmediately AND endSession together
      await executeApiCallSafely(async () => {
        await endSession('visibility_change');
      }, 'handleVisibilityChange');
      
      backupCurrentState();
    }
  };

  // Handle window focus (user returns to the tab) - but be more selective
  const handleFocus = () => {
    // Only start session if we don't already have one
    if (!activityState.isActive) {
      logActivityEvent('Window focus gained - starting fresh session');
      startSession();
    } else {
      logActivityEvent('Window focus gained but session already active');
    }
  };

  // Handle window blur - but ignore internal page interactions
  const handleBlur = async (event: FocusEvent) => {
    // Check if the blur is happening because user clicked on another element within the same page
    const relatedTarget = event.relatedTarget as Element;
    
    // If the focus is moving to another element within the same document, ignore it
    if (relatedTarget && document.contains(relatedTarget)) {
      logActivityEvent('Focus moved within page - ignoring blur event');
      return;
    }
    
    // If there's no related target, it might be a click on an iframe (like Vimeo player)
    if (!relatedTarget) {
      // Check if user clicked on an iframe or video element
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'IFRAME' || activeElement.tagName === 'VIDEO')) {
        logActivityEvent('Focus moved to video/iframe - ignoring blur event');
        return;
      }
    }
    
    // Only end session if we're really sure the user left the platform
    logActivityEvent('Window focus lost - user likely left platform, ending session with data send');
    
    // Use ONLY endSession, which already handles the API call
    // DO NOT use sendCurrentSessionImmediately AND endSession together
    await executeApiCallSafely(async () => {
      await endSession('window_blur');
    }, 'handleBlur');
    
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

        // Check for duplicate session sync before sending via beacon
        if (!shouldSkipDuplicateSessionSync(session_id, sessionDuration)) {
          // Use beacon for guaranteed delivery during page hide
          const success = sendSessionEndDataViaBeacon(
            activityState.currentSessionStart,
            now,
            sessionDuration,
            totalTimeWithSession,
            session_id,
            device_info,
            userId
          );

          if (success) {
            // Record successful session sync
            recordSuccessfulSessionSync(session_id, sessionDuration);
          }
        } else {
          logActivityEvent('Skipped duplicate beacon send in page hide');
        }
      }
    }

    // Only end session if it hasn't been ended recently
    if (activityState.isActive) {
      endSession();
    }
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

        // Check for duplicate session sync before sending via beacon
        if (!shouldSkipDuplicateSessionSync(session_id, sessionDuration)) {
          // Use beacon for guaranteed delivery during page freeze
          const success = sendSessionEndDataViaBeacon(
            activityState.currentSessionStart,
            now,
            sessionDuration,
            totalTimeWithSession,
            session_id,
            device_info,
            userId
          );

          if (success) {
            // Record successful session sync
            recordSuccessfulSessionSync(session_id, sessionDuration);
          }
        } else {
          logActivityEvent('Skipped duplicate beacon send in page freeze');
        }
      }
    }

    // Only end session if it hasn't been ended recently
    if (activityState.isActive) {
      endSession();
    }
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

      // Get device fingerprint for session ID
      // const { session_id } = getDeviceFingerprint();

      // Use the Fetch API rather than Beacon for better network tab visibility
      const clientId = import.meta.env.VITE_CLIENT_ID;
      const apiUrl = import.meta.env.VITE_API_URL;

      if (!clientId || !apiUrl) {
        logActivityEvent('Missing client ID or API URL for sync');
        return;
      }

      // Parse the pending data
      const pendingData = JSON.parse(pendingDataStr);

      // Only handle legacy cumulative data (session-only data is handled by the new deduplication system)
      let syncData;

      if (pendingData.eventType === 'session-update' || pendingData.eventType === 'session-end') {
        // Skip session-only data - it's handled by the new deduplication system
        logActivityEvent('Skipping session-only pending data - handled by new system', { pendingData });
        localStorage.removeItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
        return;
      } else if (typeof pendingData.totalTimeSpent === 'number' && pendingData.totalTimeSpent >= 0) {
        // Handle legacy cumulative data (for backward compatibility)

        // Check for duplicate sync
        if (shouldSkipDuplicateSync(pendingData.totalTimeSpent)) {
          localStorage.removeItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
          logActivityEvent('Skipped duplicate pending data sync');
          return;
        }

        syncData = {
          "time_spent_seconds": pendingData.totalTimeSpent,
          // "session_id": session_id,
          "session_id": userId,
          "session_only": false // Legacy data
        };

        logActivityEvent('Syncing pending legacy data (simplified)', {
          totalSeconds: pendingData.totalTimeSpent,
          apiUrl: `${apiUrl}/activity/clients/${clientId}/track-time/`
        });
      } else {
        // Invalid or unrecognized pending data
        logActivityEvent('Invalid pending data format, removing', { pendingData });
        localStorage.removeItem(STORAGE_KEYS.PENDING_ACTIVITY_DATA);
        return;
      }

      // Prepare the fetch request
      fetch(`${apiUrl}/activity/clients/${clientId}/track-time/`, {
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

            // Record this sync to prevent duplicates (only for legacy data)
            if (!syncData.session_only) {
              recordSuccessfulSync(pendingData.totalTimeSpent);
            }

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

      // Calculate current session duration only (not cumulative)
      let currentSessionDuration = 0;

      if (activityState.isActive && activityState.currentSessionStart) {
        currentSessionDuration = Math.floor((Date.now() - activityState.currentSessionStart) / 1000);
      }

      // If no active session or very short session, don't send
      if (currentSessionDuration === 0) {
        logActivityEvent('No active session time to send via beacon');
        return;
      }

      // Check for duplicate sync using session duration only
      if (shouldSkipDuplicateSync(currentSessionDuration)) {
        logActivityEvent('Skipped duplicate beacon sync');
        return;
      }

      // Format data for API - send only current session time
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Get device fingerprint for session tracking
      const { device_info } = getDeviceFingerprint();

      const beaconData = {
        date: formattedDate,
        "time_spent_seconds": currentSessionDuration, // Send only current session time
        "time-spend": Math.floor(currentSessionDuration / 60), // Current session in minutes
        device_info: device_info,
        session_id: getCurrentUserId(),
        session_only: true // Indicate this is session-only data
      };

      // Use the Beacon API which is designed for exit events
      const blob = new Blob([JSON.stringify(beaconData)], { type: 'application/json' });
      const success = navigator.sendBeacon(`${apiUrl}/activity/clients/${clientId}/track-time/`, blob);

      if (success) {
        // Record this sync to prevent duplicates using session duration
        recordSuccessfulSync(currentSessionDuration);
      }

      logActivityEvent('Sent session-only activity data via beacon', {
        sessionSeconds: currentSessionDuration,
        success
      });
    } catch (error) {
      logActivityEvent('Failed to send via beacon', { error: (error as Error).message });
    }
  };

  // Handle page unload (user closes the tab or navigates away)
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // Detect if this is a page refresh vs navigation/close
    const extendedEvent = event as ExtendedBeforeUnloadEvent;
    const isPageRefresh = ('persisted' in event && extendedEvent.persisted) || 
      (window.performance && performance.navigation.type === performance.navigation.TYPE_RELOAD);
    
    logActivityEvent('Before unload event - page reload or navigation detected', {
      isPageRefresh,
      navigationType: window.performance ? performance.navigation.type : 'unknown',
      persisted: 'persisted' in event ? extendedEvent.persisted : undefined
    });

    // CRITICAL: Immediately capture and send session data before page unloads
    if (activityState.isActive && activityState.currentSessionStart) {
      const now = Date.now();
      const sessionDuration = Math.floor((now - activityState.currentSessionStart) / 1000);

      logActivityEvent('Page unload - capturing active session to prevent data loss', {
        sessionDuration,
        sessionStart: new Date(activityState.currentSessionStart).toISOString(),
        totalTimeBeforeSession: activityState.totalTimeSpent,
        isPageReload: isPageRefresh
      });

      if (sessionDuration > 0) {
        // Check if this exact session has already been processed
        if (isSessionAlreadyProcessed(activityState.currentSessionStart, sessionDuration)) {
          logActivityEvent('Session already processed, skipping duplicate send', {
            sessionStart: activityState.currentSessionStart,
            sessionDuration
          });
        } else {
          const { session_id, device_info } = getDeviceFingerprint();
          const userId = getCurrentUserId();

          // PRIORITY 1: Always save to localStorage first (immediate, synchronous)
          try {
            const emergencyBackup = {
              sessionDuration,
              sessionStart: activityState.currentSessionStart,
              sessionEnd: now,
              totalTimeBeforeSession: activityState.totalTimeSpent,
              timestamp: now,
              isPageRefresh,
              emergencyBackup: true
            };
            localStorage.setItem('emergencySessionBackup', JSON.stringify(emergencyBackup));
            logActivityEvent('Emergency session backup saved to localStorage', { sessionDuration });
          } catch (error) {
            logActivityEvent('Failed to save emergency backup', { error: (error as Error).message });
          }

          // PRIORITY 2: Send ONLY via beacon (single method to prevent duplicates)
          // Do NOT use both beacon and fetch to avoid double API calls
          if (!shouldSkipDuplicateSessionSync(session_id, sessionDuration)) {
            const refreshPayload = {
              "time_spent_seconds": sessionDuration,
              "session_id": userId,
              "date": formatDateForApi(),
              "device_type": device_info.deviceType,
              "session_only": true,
              "event_type": isPageRefresh ? "page_refresh" : "page_unload"
            };

            const apiUrl = import.meta.env.VITE_API_URL;
            const clientId = import.meta.env.VITE_CLIENT_ID;

            if (apiUrl && clientId) {
              // Use ONLY beacon API - single method to prevent duplicates
              const beaconBlob = new Blob([JSON.stringify(refreshPayload)], { 
                type: 'application/json' 
              });
              const beaconSuccess = navigator.sendBeacon(
                `${apiUrl}/activity/clients/${clientId}/track-time/`, 
                beaconBlob
              );

              if (beaconSuccess) {
                // Mark this session as processed to prevent future duplicates
                markSessionAsProcessed(activityState.currentSessionStart, sessionDuration);
                recordSuccessfulSessionSync(session_id, sessionDuration);
                logActivityEvent('Single beacon sent successfully - no duplicates', {
                  sessionDuration,
                  isPageRefresh,
                  method: 'beacon_only'
                });
              } else {
                logActivityEvent('Beacon failed - session will be recovered on reload', {
                  sessionDuration,
                  isPageRefresh
                });
              }
            }
          } else {
            logActivityEvent('Skipped duplicate session send based on deduplication rules');
          }

          // PRIORITY 3: Update the activity state to include this session
          try {
            const updatedTotalTime = activityState.totalTimeSpent + sessionDuration;
            const newSession: ActivitySession = {
              startTime: activityState.currentSessionStart,
              endTime: now,
              duration: sessionDuration,
            };
            
            const updatedState = {
              totalTimeSpent: updatedTotalTime,
              activityHistory: [...activityState.activityHistory, newSession],
              lastBackup: now
            };

            localStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, JSON.stringify(updatedState));
            localStorage.setItem(STORAGE_KEYS.TOTAL_TIME_BACKUP, updatedTotalTime.toString());
            
            logActivityEvent('Updated local state with session before unload', {
              sessionDuration,
              newTotalTime: updatedTotalTime
            });
          } catch (error) {
            logActivityEvent('Failed to update local state before unload', { 
              error: (error as Error).message 
            });
          }
        }
      }
    } else {
      logActivityEvent('No active session to capture on page unload', { isPageRefresh });
    }

    // Standard cleanup
    backupCurrentState();
    clearCurrentSessionId();
    logActivityEvent('Page unload handling completed', { isPageRefresh });
  };

  // Periodic sync every 2 minutes - send data and reset counter
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const baseRetryDelay = 10000; // 10 seconds base delay

    const performPeriodicSync = async () => {
      logActivityEvent('Starting 2-minute periodic sync attempt', {
        retryCount,
        maxRetries
      });

      // Only sync if we have an active session
      if (!activityState.isActive || !activityState.currentSessionStart) {
        logActivityEvent('No active session to sync in 2-minute update');
        retryCount = 0; // Reset retry count if no active session
        return;
      }

      try {
        // Calculate current session duration (should be close to 2 minutes)
        const currentSessionDuration = Math.floor((Date.now() - activityState.currentSessionStart) / 1000);

        // Safety check for negative duration (clock skew)
        if (currentSessionDuration < 0) {
          logActivityEvent('Negative session duration detected in 2-minute sync, skipping');
          retryCount = 0; // Reset retry count for invalid data
          return;
        }

        // Skip if session is too short (less than 5 seconds)
        if (currentSessionDuration < 5) {
          logActivityEvent('Session too short for 2-minute sync, skipping');
          retryCount = 0; // Reset retry count for short sessions
          return;
        }

        // Get device fingerprint for session tracking
        const { session_id, device_info } = getDeviceFingerprint();
        const userId = getCurrentUserId();

        // Check for duplicate session sync before sending
        if (!shouldSkipDuplicateSessionSync(session_id, currentSessionDuration)) {
          // Lock this session to prevent duplicate processing
          if (lockSession(activityState.currentSessionStart!)) {
            // Send the current session data using safe API call mechanism
            await executeApiCallSafely(async () => {
              await sendPeriodicSessionUpdate(
                session_id,
                device_info,
                activityState.currentSessionStart!,  // We already checked it's not null above
                userId
              );
            }, 'periodicSync');

            // Record successful session sync
            recordSuccessfulSessionSync(session_id, currentSessionDuration);

            logActivityEvent('2-minute sync completed successfully - resetting timer', {
              sessionDuration: currentSessionDuration,
              retryCount
            });

            // CRITICAL: Reset the session timer immediately after successful send
            setActivityState(prev => {
              const now = Date.now();
              const newSession: ActivitySession = {
                startTime: prev.currentSessionStart!,
                endTime: now,
                duration: currentSessionDuration,
              };

              const newState = {
                ...prev,
                totalTimeSpent: prev.totalTimeSpent + currentSessionDuration,
                activityHistory: [...prev.activityHistory, newSession],
                currentSessionStart: now, // RESET: Start new 2-minute timer from now
              };

              logActivityEvent('Session timer reset after successful 2-minute sync', {
                sentDuration: currentSessionDuration,
                newSessionStart: new Date(now).toISOString(),
                newTotalTime: newState.totalTimeSpent,
                nextSyncIn: '2 minutes'
              });

              return newState;
            });

            // Unlock the session after successful processing
            unlockSession(activityState.currentSessionStart!);

            // Reset retry count after successful sync
            retryCount = 0;
          } else {
            logActivityEvent('2-minute sync skipped - session already being processed');
            retryCount = 0; // Reset retry count for skipped sessions
          }

        } else {
          logActivityEvent('Skipped duplicate 2-minute session update');
          retryCount = 0; // Reset retry count for skipped duplicates
        }

        // Backup the state after successful or skipped sync
        backupCurrentState();

      } catch (error) {
        retryCount++;
        logActivityEvent('Error in 2-minute session sync', { 
          error: (error as Error).message,
          retryCount,
          maxRetries
        });

        // If we haven't exceeded max retries, schedule a retry
        if (retryCount < maxRetries) {
          const retryDelay = baseRetryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          logActivityEvent('Scheduling retry for 2-minute sync', {
            retryCount,
            retryDelay: `${retryDelay}ms`,
            nextRetryAt: new Date(Date.now() + retryDelay).toISOString()
          });

          setTimeout(() => {
            performPeriodicSync();
          }, retryDelay);
        } else {
          logActivityEvent('Max retries exceeded for 2-minute sync, waiting for next interval', {
            retryCount,
            maxRetries
          });
          retryCount = 0; // Reset for next interval
        }
      }
    };

    // Set up the interval
    const syncIntervalId = setInterval(performPeriodicSync, 2 * 60 * 1000); // 2 minutes

    // Log when the interval is set up
    logActivityEvent('2-minute periodic sync interval established', {
      intervalMs: 2 * 60 * 1000,
      nextSyncAt: new Date(Date.now() + 2 * 60 * 1000).toISOString()
    });

    // Cleanup function
    return () => {
      clearInterval(syncIntervalId);
      logActivityEvent('2-minute periodic sync interval cleared');
    };
  }, [activityState.isActive, activityState.currentSessionStart]); // Re-run if session state changes

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

  // Start session when component mounts
  useEffect(() => {
    logActivityEvent('UserActivityProvider mounted');

    // Check if this is a page reload and recover any emergency backup
    if (window.performance && performance.navigation.type === performance.navigation.TYPE_RELOAD) {
      logActivityEvent('Page reload detected on mount - checking for emergency backup');
      
      try {
        const emergencyBackupStr = localStorage.getItem('emergencySessionBackup');
        if (emergencyBackupStr) {
          const emergencyBackup = JSON.parse(emergencyBackupStr);
          logActivityEvent('Found emergency session backup from previous page', {
            sessionDuration: emergencyBackup.sessionDuration,
            timestamp: new Date(emergencyBackup.timestamp).toISOString()
          });

          // Update the activity state to include the recovered session
          setActivityState(prev => {
            const newSession: ActivitySession = {
              startTime: emergencyBackup.sessionStart,
              endTime: emergencyBackup.sessionEnd,
              duration: emergencyBackup.sessionDuration,
            };

            const newTotalTime = emergencyBackup.totalTimeBeforeSession + emergencyBackup.sessionDuration;

            return {
              ...prev,
              totalTimeSpent: newTotalTime,
              activityHistory: [...prev.activityHistory, newSession],
            };
          });

          // Clear the emergency backup after recovery
          localStorage.removeItem('emergencySessionBackup');
          logActivityEvent('Emergency backup recovered and cleared', {
            recoveredSessionDuration: emergencyBackup.sessionDuration
          });
        }
      } catch (error) {
        logActivityEvent('Error recovering emergency backup', { 
          error: (error as Error).message 
        });
        // Clear potentially corrupted backup
        localStorage.removeItem('emergencySessionBackup');
      }
    }

    // Check if this is a page reload by examining navigation timing
    if (window.performance && performance.navigation.type === performance.navigation.TYPE_RELOAD) {
      logActivityEvent('Page reload detected on mount - starting new session after refresh');
    }

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

  return (
    <UserActivityContext.Provider value={activityState}>
      {children}
    </UserActivityContext.Provider>
  );
};

// Function to check if a session has already been processed to prevent duplicates
const isSessionAlreadyProcessed = (sessionStart: number, sessionDuration: number): boolean => {
  try {
    const processedSessionsStr = localStorage.getItem(STORAGE_KEYS.PROCESSED_SESSIONS);
    if (!processedSessionsStr) {
      return false;
    }

    const processedSessions = JSON.parse(processedSessionsStr);
    const sessionKey = `${sessionStart}-${sessionDuration}`;
    
    return processedSessions.includes(sessionKey);
  } catch {
    return false;
  }
};

// Function to mark a session as processed
const markSessionAsProcessed = (sessionStart: number, sessionDuration: number): void => {
  try {
    const processedSessionsStr = localStorage.getItem(STORAGE_KEYS.PROCESSED_SESSIONS);
    let processedSessions: string[] = [];
    
    if (processedSessionsStr) {
      processedSessions = JSON.parse(processedSessionsStr);
    }
    
    const sessionKey = `${sessionStart}-${sessionDuration}`;
    if (!processedSessions.includes(sessionKey)) {
      processedSessions.push(sessionKey);
      
      // Keep only the last 100 processed sessions to prevent localStorage bloat
      if (processedSessions.length > 100) {
        processedSessions = processedSessions.slice(-100);
      }
      
      localStorage.setItem(STORAGE_KEYS.PROCESSED_SESSIONS, JSON.stringify(processedSessions));
    }
  } catch (error) {
    logActivityEvent('Failed to mark session as processed', { error: (error as Error).message });
  }
};

// Add proper interface for BeforeUnloadEvent with persisted property
interface ExtendedBeforeUnloadEvent extends BeforeUnloadEvent {
  persisted?: boolean;
}
