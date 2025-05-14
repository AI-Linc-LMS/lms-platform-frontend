import React, { useEffect, useState } from 'react';
import useUserActivityTracking from '../hooks/useUserActivityTracking';
import { calculateCurrentSessionDuration } from '../utils/userActivitySync';
import { simulateActivityEvent, getActivityDebugEvents, clearActivityDebugEvents } from '../utils/activityDebugger';

const FloatingActivityTimer: React.FC = () => {
  const { isActive, totalTimeSpent, currentSessionStart, formatTime, activityHistory } = useUserActivityTracking();
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showDebugging, setShowDebugging] = useState<boolean>(false);
  const [debugEvents, setDebugEvents] = useState<string[]>([]);

  // Update current session duration every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (isActive && currentSessionStart) {
        setCurrentDuration(calculateCurrentSessionDuration(isActive, currentSessionStart));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, currentSessionStart]);

  // Update debug logs periodically
  useEffect(() => {
    if (!showDebugging) return;
    
    const debugTimer = setInterval(() => {
      setDebugEvents(getActivityDebugEvents());
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
              
              <div className="flex space-x-1 mb-3">
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
              
              <h4 className="text-xs font-semibold text-gray-600 mb-1">Debug Logs</h4>
              <div className="bg-gray-100 rounded p-1 text-xs font-mono h-32 overflow-y-auto">
                {debugEvents.length === 0 ? (
                  <div className="text-gray-500 italic text-center p-2">No logs yet</div>
                ) : (
                  debugEvents.slice().reverse().map((event, index) => (
                    <div key={index} className="text-gray-800 text-[10px] whitespace-normal break-all mb-1">
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