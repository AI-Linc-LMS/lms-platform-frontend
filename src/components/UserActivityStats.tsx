import React, { useEffect, useState } from 'react';
import useUserActivityTracking from '../hooks/useUserActivityTracking';
import { calculateCurrentSessionDuration } from '../utils/userActivitySync';

interface UserActivityStatsProps {
  showDetailed?: boolean;
}

const UserActivityStats: React.FC<UserActivityStatsProps> = ({ showDetailed = false }) => {
  const { 
    isActive, 
    totalTimeSpent, 
    currentSessionStart, 
    activityHistory, 
    formatTime 
  } = useUserActivityTracking();
  
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  
  // Update current session duration every second
  useEffect(() => {
    if (!isActive || !currentSessionStart) return;
    
    const timer = setInterval(() => {
      setCurrentDuration(calculateCurrentSessionDuration(isActive, currentSessionStart));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, currentSessionStart]);
  
  return (
    <div className="bg-white rounded-lg shadow p-4 my-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">User Activity Tracking</h3>
      
      <div className="flex items-center mb-2">
        <div className={`w-3 h-3 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <p className="text-sm text-gray-600">
          {isActive ? 'User is active' : 'User is inactive'}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">Total Time</p>
          <p className="font-medium">{formatTime(totalTimeSpent)}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">Current Session</p>
          <p className="font-medium">{formatTime(currentDuration)}</p>
        </div>
      </div>
      
      {showDetailed && activityHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Session History</h4>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 text-left">Start</th>
                  <th className="p-1 text-left">End</th>
                  <th className="p-1 text-right">Duration</th>
                </tr>
              </thead>
              <tbody>
                {activityHistory.slice().reverse().map((session, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-1">{new Date(session.startTime).toLocaleTimeString()}</td>
                    <td className="p-1">
                      {session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'Active'}
                    </td>
                    <td className="p-1 text-right">{formatTime(session.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityStats; 