import React, { useEffect, useState } from 'react';
import useUserActivityTracking from '../hooks/useUserActivityTracking';
import { calculateCurrentSessionDuration } from '../utils/userActivitySync';
import { simulateActivityEvent, getActivityDebugEvents, clearActivityDebugEvents, simulateDailyReset } from '../utils/activityDebugger';
import { getSessionId, getDeviceInfo } from '../utils/deviceIdentifier';
import { getHistoricalActivity } from '../utils/dailyReset';

// New interface to track sync status
interface SyncStatus {
  lastSync: number | null;
  status: 'idle' | 'syncing' | 'success' | 'failed';
  message: string;
}

const FloatingActivityTimer: React.FC = () => {
  const { isActive, totalTimeSpent, currentSessionStart, formatTime, activityHistory, recoverFromLocalStorage, lastResetDate } = useUserActivityTracking();
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showDebugging, setShowDebugging] = useState<boolean>(false);
  const [debugEvents, setDebugEvents] = useState<string[]>([]);
  const [recoveredTime, setRecoveredTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<{browser: string, os: string, deviceType: string} | null>(null);
  const [historicalActivity, setHistoricalActivity] = useState<Record<string, number>>({});
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    status: 'idle',
    message: 'No sync yet'
  });

  // Get session ID and device info on mount
  useEffect(() => {
    setSessionId(getSessionId());
    setDeviceInfo(getDeviceInfo());
    setHistoricalActivity(getHistoricalActivity());
  }, []);

  // Update historical activity when the reset date changes
  useEffect(() => {
    if (lastResetDate) {
      setHistoricalActivity(getHistoricalActivity());
    }
  }, [lastResetDate]);

  // Update current session duration every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (isActive && currentSessionStart) {
        setCurrentDuration(calculateCurrentSessionDuration(isActive, currentSessionStart));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, currentSessionStart]);

  // Update debug logs periodically and check for sync events
  useEffect(() => {
    if (!showDebugging) return;
    
    const debugTimer = setInterval(() => {
      const events = getActivityDebugEvents();
      setDebugEvents(events);
      
      // Check for sync-related events in the logs
      const syncEvents = events.filter(event => 
        event.includes('Sent activity data') || 
        event.includes('Failed to send activity data') ||
        event.includes('Periodic sync')
      );
      
      if (syncEvents.length > 0) {
        const latestSyncEvent = syncEvents[syncEvents.length - 1];
        
        // Update sync status
        if (latestSyncEvent.includes('success')) {
          setSyncStatus({
            lastSync: Date.now(),
            status: 'success',
            message: 'Last sync successful'
          });
          
          // Reset status after 3 seconds
          setTimeout(() => {
            setSyncStatus(prev => ({ ...prev, status: 'idle' }));
          }, 3000);
        } else if (latestSyncEvent.includes('failed')) {
          setSyncStatus({
            lastSync: Date.now(),
            status: 'failed',
            message: 'Sync failed'
          });
        } else if (latestSyncEvent.includes('Periodic sync')) {
          setSyncStatus({
            lastSync: Date.now(),
            status: 'syncing',
            message: 'Syncing...'
          });
        }
      }
    }, 1000);
    
    return () => clearInterval(debugTimer);
  }, [showDebugging]);

  // Test handlers
  const handleSimulateEvent = (eventType: 'focus' | 'blur' | 'visibility' | 'unload') => {
    simulateActivityEvent(eventType);
    setTimeout(() => setDebugEvents(getActivityDebugEvents()), 100);
  };

  const handleClearLogs = () => {
    clearActivityDebugEvents();
    setDebugEvents([]);
  };

  // Force manual sync for testing
  const handleForceSync = () => {
    setSyncStatus({
      lastSync: Date.now(),
      status: 'syncing',
      message: 'Manual sync...'
    });
    
    // Check environment variables
    const apiUrl = import.meta.env.VITE_API_URL;
    const clientId = import.meta.env.VITE_CLIENT_ID;
    
    // Calculate current session duration if active
    let currentSessionDuration = 0;
    if (isActive && currentSessionStart) {
      currentSessionDuration = calculateCurrentSessionDuration(isActive, currentSessionStart);
    }
    
    // Total time including current session if active
    const totalTimeInSeconds = totalTimeSpent + currentSessionDuration;
    
    console.log('API URL:', apiUrl);
    console.log('Client ID:', clientId);
    console.log('Current total time spent (seconds):', totalTimeSpent);
    console.log('Current session duration (seconds):', currentSessionDuration);
    console.log('Total time incl. current session (seconds):', totalTimeInSeconds);
    
    // Format date in YYYY-MM-DD format for logging
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Log what would be sent
    console.log('Data to be sent:', {
      date: formattedDate,
      "time-spend-seconds": totalTimeInSeconds,
      "time-spend": Math.round(totalTimeInSeconds / 60)
    });
    
    // Simulate closing/opening tab to trigger API call
    simulateActivityEvent('blur');
    setTimeout(() => simulateActivityEvent('focus'), 500);
    
    setTimeout(() => {
      setDebugEvents(getActivityDebugEvents());
      setSyncStatus({
        lastSync: Date.now(),
        status: 'success', 
        message: 'Manual sync completed'
      });
    }, 1000);
  };

  // Direct API call for testing (bypasses simulation)
  const handleDirectApiCall = () => {
    setSyncStatus({
      lastSync: Date.now(),
      status: 'syncing',
      message: 'Direct API call...'
    });
    
    const apiUrl = import.meta.env.VITE_API_URL;
    const clientId = import.meta.env.VITE_CLIENT_ID;
    
    if (!apiUrl || !clientId) {
      console.error('Missing API URL or Client ID!');
      setSyncStatus({
        lastSync: Date.now(),
        status: 'failed',
        message: 'Missing API config'
      });
      return;
    }
    
    // Format date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Calculate current session duration if active
    let currentSessionDuration = 0;
    if (isActive && currentSessionStart) {
      currentSessionDuration = calculateCurrentSessionDuration(isActive, currentSessionStart);
    }
    
    // Total time including current session if active
    const totalTimeInSeconds = totalTimeSpent + currentSessionDuration;
    
    // Prepare the data in the format required by the API
    const activityData = {
      date: formattedDate,
      "time-spend-seconds": totalTimeInSeconds, // Send exact seconds for precision
      "time-spend": Math.round(totalTimeInSeconds / 60), // Keep minutes for backward compatibility
      session_id: sessionId,
      device_info: deviceInfo,
      current_session_duration: currentSessionDuration // Include current session separately for diagnostics
    };
    
    console.log('DIRECT API CALL');
    console.log('Endpoint:', `${apiUrl}/activity/clients/${clientId}/activity-log/`);
    console.log('Data:', activityData);
    console.log('Current session duration (seconds):', currentSessionDuration);
    console.log('Total time incl. current session (seconds):', totalTimeInSeconds);
    
    // Setup fetch options
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization if available
        ...(localStorage.getItem('token') ? {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        } : {})
      },
      body: JSON.stringify(activityData)
    };
    
    // Make the API call directly using Fetch API for better visibility in Network tab
    fetch(`${apiUrl}/activity/clients/${clientId}/activity-log/`, fetchOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('API Response:', data);
        setSyncStatus({
          lastSync: Date.now(),
          status: 'success',
          message: 'API call successful'
        });
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setSyncStatus(prev => ({ ...prev, status: 'idle' }));
        }, 3000);
      })
      .catch(e => {
        console.error('API call failed:', e);
        setSyncStatus({
          lastSync: Date.now(),
          status: 'failed',
          message: `Failed: ${e.message}`
        });
      });
  };

  // Handle recovery from localStorage
  const handleRecoverFromLocalStorage = () => {
    setSyncStatus({
      lastSync: Date.now(),
      status: 'syncing',
      message: 'Recovering data...'
    });
    
    setTimeout(() => {
      try {
        const recoveredTotalTime = recoverFromLocalStorage();
        setRecoveredTime(recoveredTotalTime);
        
        setSyncStatus({
          lastSync: Date.now(),
          status: 'success',
          message: recoveredTotalTime > 0 
            ? `Recovered ${formatTime(recoveredTotalTime)}` 
            : 'No data to recover'
        });
      } catch (error: unknown) {
        console.error('Failed to recover data:', error);
        setSyncStatus({
          lastSync: Date.now(),
          status: 'failed',
          message: 'Recovery failed'
        });
      }
    }, 500);
  };

  // JSX for debug panel with session info
  const renderDebugPanel = () => {
    if (!showDebugging) return null;

    return (
      <div className="border-t border-gray-200 bg-gray-50 p-3 text-xs overflow-auto" style={{ maxHeight: '300px' }}>
        <div className="mb-3">
          <h4 className="font-semibold text-gray-700 mb-2">Session Information</h4>
          <div className="bg-white p-2 rounded border border-gray-300 mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Session ID:</span>
              <span className="text-gray-900 font-mono text-xs">{sessionId}</span>
            </div>
            {deviceInfo && (
              <>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Browser:</span>
                  <span className="text-gray-900">{deviceInfo.browser}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">OS:</span>
                  <span className="text-gray-900">{deviceInfo.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Device Type:</span>
                  <span className="text-gray-900">{deviceInfo.deviceType}</span>
                </div>
              </>
            )}
            {lastResetDate && (
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-500">Last Reset:</span>
                <span className="text-gray-900 font-mono text-xs">
                  {new Date(lastResetDate).toLocaleDateString()} {new Date(lastResetDate).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Historical Activity Section */}
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-700 mb-2">Historical Activity</h4>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showHistory ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showHistory && Object.keys(historicalActivity).length > 0 ? (
            <div className="bg-white p-2 rounded border border-gray-300 mb-2 h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1">Date</th>
                    <th className="text-right py-1">Time Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(historicalActivity)
                    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                    .map(([date, seconds]) => (
                      <tr key={date} className="border-b border-gray-100">
                        <td className="py-1">{date}</td>
                        <td className="text-right py-1">{formatTime(seconds)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : showHistory ? (
            <div className="bg-white p-2 rounded border border-gray-300 mb-2 text-center text-gray-500">
              No historical data available
            </div>
          ) : null}
        </div>

        <h4 className="font-semibold text-gray-700 mb-2">Test Controls</h4>
        <div className="flex flex-wrap gap-1 mb-3">
          <button 
            onClick={() => handleSimulateEvent('focus')} 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs"
          >
            Focus
          </button>
          <button 
            onClick={() => handleSimulateEvent('blur')} 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs"
          >
            Blur
          </button>
          <button 
            onClick={() => handleSimulateEvent('visibility')} 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs"
          >
            Visibility
          </button>
          <button 
            onClick={() => handleSimulateEvent('unload')} 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs"
          >
            Unload
          </button>
          <button 
            onClick={handleForceSync} 
            className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
          >
            Force Sync
          </button>
          <button 
            onClick={handleDirectApiCall} 
            className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
          >
            Direct API Call
          </button>
          <button 
            onClick={handleRecoverFromLocalStorage} 
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
          >
            Recover Data
          </button>
          <button 
            onClick={() => simulateDailyReset()} 
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs"
          >
            Simulate Reset
          </button>
          <button 
            onClick={handleClearLogs} 
            className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-xs"
          >
            Clear Logs
          </button>
        </div>
        
        <h4 className="font-semibold text-gray-700 mb-2">Activity Log</h4>
        <div className="bg-black text-green-400 font-mono p-2 rounded h-40 overflow-y-auto">
          {debugEvents.map((event, i) => (
            <div key={i} className="text-xs mb-1">{event}</div>
          ))}
          {debugEvents.length === 0 && <div className="text-gray-500 italic">No events logged</div>}
        </div>
      </div>
    );
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer z-50 hover:bg-blue-600 transition-all"
        onClick={() => setIsMinimized(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
        </svg>
      </div>
    );
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 ${isExpanded ? (showDebugging ? 'w-96' : 'w-64') : 'w-auto'} bg-white rounded-lg shadow-lg overflow-hidden z-50 transition-all duration-300 border border-gray-200`}
    >
      {/* Header */}
      <div className="bg-blue-500 text-white px-3 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-300' : 'bg-red-300'} animate-pulse`}></div>
          <h3 className="text-sm font-medium">Activity Timer</h3>
          
          {/* Sync indicator */}
          {syncStatus.status !== 'idle' && (
            <div className="ml-2 flex items-center text-xs">
              <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                syncStatus.status === 'syncing' ? 'bg-yellow-300 animate-pulse' : 
                syncStatus.status === 'success' ? 'bg-green-300' : 'bg-red-300'
              }`}></div>
              <span className="truncate max-w-[80px]">{syncStatus.message}</span>
            </div>
          )}
        </div>
        
        <div className="flex">
          <button 
            onClick={() => setShowDebugging(!showDebugging)} 
            className="text-white hover:text-blue-100 p-1"
            title="Debug"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.5 0a.5.5 0 0 0 0 1H7v1.07A7.001 7.001 0 0 0 8 16a7 7 0 0 0 5.29-11.584.531.531 0 0 0 .013-.012l.354-.354.353.354a.5.5 0 1 0 .707-.707l-1.5-1.5a.5.5 0 1 0-.707.707l.354.354-.354.354a.717.717 0 0 0-.012.012A6.973 6.973 0 0 0 9 2.071V1h.5a.5.5 0 0 0 0-1h-3zm2 5.6V9a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1 0-1h3V5.6a.5.5 0 1 1 1 0z"/>
            </svg>
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-white hover:text-blue-100 p-1"
            title="Toggle Expand"
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/>
              </svg>
            )}
          </button>
          <button 
            onClick={() => setIsMinimized(true)} 
            className="text-white hover:text-blue-100 p-1"
            title="Minimize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
              <path d="M15 7H1V6h14v1z"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Timer display */}
      <div className="px-3 py-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Current Session</span>
          <span>Today's Total</span>
        </div>
        <div className="flex justify-between">
          <div className="text-gray-800 font-mono font-bold">
            {formatTime(currentDuration)}
          </div>
          <div className="text-gray-800 font-mono font-bold">
            {formatTime(totalTimeSpent)}
          </div>
        </div>
        
        {/* Last reset info */}
        {lastResetDate && isExpanded && (
          <div className="mt-1 text-xs text-center">
            <span className="text-gray-500">
              Reset: {new Date(lastResetDate).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {/* Recovered time indicator */}
        {recoveredTime !== null && (
          <div className="mt-1 text-xs text-center">
            <span className={recoveredTime > 0 ? "text-green-600" : "text-gray-500"}>
              {recoveredTime > 0 
                ? `Recovered backup: ${formatTime(recoveredTime)}`
                : "No backup data found"}
            </span>
          </div>
        )}
      </div>
      
      {/* Status info */}
      {isExpanded && (
        <>
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={isActive ? 'text-green-600' : 'text-red-600'}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Session started:</span>
                <span className="text-gray-800">
                  {currentSessionStart 
                    ? new Date(currentSessionStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : 'Not started'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sessions:</span>
                <span className="text-gray-800">{activityHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last sync:</span>
                <span className="text-gray-800">
                  {syncStatus.lastSync 
                    ? new Date(syncStatus.lastSync).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : 'Never'}
                </span>
              </div>
              {sessionId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Device ID:</span>
                  <span className="text-gray-800 font-mono text-xs" title={sessionId}>
                    {sessionId.substring(0, 8)}...
                  </span>
                </div>
              )}
              <div className="text-gray-500 text-center mt-1 border-t border-gray-200 pt-1">
                <span className="text-xs italic">Activity tracking {isActive ? 'running' : 'paused'}</span>
              </div>
            </div>
          </div>
          
          {/* Debug Panel */}
          {renderDebugPanel()}
        </>
      )}
    </div>
  );
};

export default FloatingActivityTimer; 