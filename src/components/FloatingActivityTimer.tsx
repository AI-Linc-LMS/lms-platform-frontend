import React, { useEffect, useState } from 'react';
import useUserActivityTracking from '../hooks/useUserActivityTracking';
import { calculateCurrentSessionDuration } from '../utils/userActivitySync';
import { simulateActivityEvent, getActivityDebugEvents, clearActivityDebugEvents } from '../utils/activityDebugger';

// New interface to track sync status
interface SyncStatus {
  lastSync: number | null;
  status: 'idle' | 'syncing' | 'success' | 'failed';
  message: string;
}

const FloatingActivityTimer: React.FC = () => {
  const { isActive, totalTimeSpent, currentSessionStart, formatTime, activityHistory, recoverFromLocalStorage } = useUserActivityTracking();
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showDebugging, setShowDebugging] = useState<boolean>(false);
  const [debugEvents, setDebugEvents] = useState<string[]>([]);
  const [recoveredTime, setRecoveredTime] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    status: 'idle',
    message: 'No sync yet'
  });

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
    
    console.log('API URL:', apiUrl);
    console.log('Client ID:', clientId);
    console.log('Current total time spent (seconds):', totalTimeSpent);
    
    // Format date in YYYY-MM-DD format for logging
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Log what would be sent
    console.log('Data to be sent:', {
      date: formattedDate,
      "time-spend": Math.round(totalTimeSpent / 60)
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
    
    // Prepare the data in the format required by the API
    const activityData = {
      date: formattedDate,
      "time-spend": Math.round(totalTimeSpent / 60) // Convert seconds to minutes and round
    };
    
    console.log('DIRECT API CALL');
    console.log('Endpoint:', `${apiUrl}/activity/clients/${clientId}/activity-log/`);
    console.log('Data:', activityData);
    
    // Direct API call with fetch
    fetch(`${apiUrl}/activity/clients/${clientId}/activity-log/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(activityData)
    })
    .then(response => {
      console.log('API Response Status:', response.status);
      if (response.ok) {
        setSyncStatus({
          lastSync: Date.now(),
          status: 'success',
          message: 'API call successful'
        });
      } else {
        setSyncStatus({
          lastSync: Date.now(),
          status: 'failed',
          message: `Failed: ${response.status}`
        });
      }
      return response.text();
    })
    .then(text => {
      let responseData = text;
      try {
        if (text) {
          responseData = JSON.parse(text);
        }
      } catch (e: unknown) {
        // Keep as text if not JSON
        console.log('Response is not JSON:', e);
      }
      console.log('API Response:', responseData);
    })
    .catch(error => {
      console.error('API Error:', error);
      setSyncStatus({
        lastSync: Date.now(),
        status: 'failed',
        message: 'API error'
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
        <div className="flex space-x-1">
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
          <span>Total Time</span>
        </div>
        <div className="flex justify-between">
          <div className="text-gray-800 font-mono font-bold">
            {formatTime(currentDuration)}
          </div>
          <div className="text-gray-800 font-mono font-bold">
            {formatTime(totalTimeSpent)}
          </div>
        </div>
        
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
              <div className="text-gray-500 text-center mt-1 border-t border-gray-200 pt-1">
                <span className="text-xs italic">Activity tracking {isActive ? 'running' : 'paused'}</span>
              </div>
            </div>
          </div>
          
          {showDebugging && (
            <div className="border-t border-gray-200 p-2">
              <div className="flex justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-600">Test Controls</h4>
                <button 
                  onClick={handleClearLogs}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear Logs
                </button>
              </div>
              
              <div className="flex space-x-1 mb-2">
                <button 
                  onClick={() => handleSimulateEvent('focus')}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded transition-colors"
                >
                  Focus
                </button>
                <button 
                  onClick={() => handleSimulateEvent('blur')}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded transition-colors"
                >
                  Blur
                </button>
                <button 
                  onClick={() => handleSimulateEvent('visibility')}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded transition-colors"
                >
                  Visibility
                </button>
                <button 
                  onClick={() => handleSimulateEvent('unload')}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded transition-colors"
                >
                  Unload
                </button>
              </div>
              
              <div className="mb-2 grid grid-cols-2 gap-2">
                <button 
                  onClick={handleForceSync}
                  className="bg-green-50 hover:bg-green-100 text-green-800 text-xs py-1 px-2 rounded transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                    <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                  </svg>
                  Send to Backend
                </button>
                
                <button 
                  onClick={handleDirectApiCall}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs py-1 px-2 rounded transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                    <path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0z"/>
                    <path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z"/>
                  </svg>
                  Direct API Call
                </button>
                
                <button 
                  onClick={handleRecoverFromLocalStorage}
                  className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 text-xs py-1 px-2 rounded transition-colors flex items-center justify-center col-span-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                    <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                  </svg>
                  Recover Data
                </button>
              </div>
              
              <h4 className="text-xs font-semibold text-gray-600 mb-1">Debug Logs</h4>
              <div className="bg-gray-100 rounded p-1 text-xs font-mono h-32 overflow-y-auto">
                {debugEvents.length === 0 ? (
                  <div className="text-gray-500 italic text-center p-2">No logs yet</div>
                ) : (
                  debugEvents.slice().reverse().map((event, index) => (
                    <div 
                      key={index} 
                      className={`text-[10px] whitespace-normal break-all mb-1 ${
                        event.includes('success') || event.includes('Recovered') ? 'text-green-700' : 
                        event.includes('failed') || event.includes('error') ? 'text-red-700' : 
                        event.includes('sync') || event.includes('backup') ? 'text-blue-700' : 'text-gray-800'
                      }`}
                    >
                      {event}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FloatingActivityTimer; 