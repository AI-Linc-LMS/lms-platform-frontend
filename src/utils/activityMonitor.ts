/**
 * Activity Monitoring Utilities
 * Helper functions for debugging and monitoring the 2-minute timer system
 */

// Extend Window interface for our custom properties
declare global {
  interface Window {
    getActivityTimerStatus?: () => {
      isActive: boolean;
      message: string;
      nextSyncIn: number | null;
      currentSessionDuration: number;
      timeUntilNextSync?: number;
      nextSyncAt?: string;
    };
    timerMonitoringInterval?: number;
    activityMonitor?: {
      logStatus: () => void;
      simulateTabSwitch: () => void;
      simulateTabReturn: () => void;
      startMonitoring: (intervalSeconds?: number) => number;
      stopMonitoring: () => void;
      checkStorage: () => void;
    };
  }
}

// Helper function to log timer status to console in a readable format
export const logTimerStatus = () => {
  if (typeof window !== 'undefined' && window.getActivityTimerStatus) {
    const status = window.getActivityTimerStatus();
    console.group('🕒 Activity Timer Status');
    console.log('Session Active:', status.isActive);
    if (status.isActive) {
      console.log('Current Session Duration:', `${status.currentSessionDuration} seconds (${Math.floor(status.currentSessionDuration / 60)}:${String(status.currentSessionDuration % 60).padStart(2, '0')})`);
      console.log('Time Until Next Sync:', `${status.timeUntilNextSync} seconds`);
      console.log('Next Sync At:', status.nextSyncAt);
      console.log('Progress:', `${((status.currentSessionDuration % 120) / 120 * 100).toFixed(1)}% through 2-minute cycle`);
    } else {
      console.log('Message:', status.message);
    }
    console.groupEnd();
    return status;
  } else {
    console.warn('Activity timer status not available. Make sure UserActivityProvider is mounted.');
    return null;
  }
};

// Helper function to simulate tab switching for testing
export const simulateTabSwitch = () => {
  console.log('🔄 Simulating tab switch...');
  
  // Simulate visibility change to hidden
  Object.defineProperty(document, 'visibilityState', {
    writable: true,
    value: 'hidden'
  });
  
  // Dispatch visibility change event
  const event = new Event('visibilitychange');
  document.dispatchEvent(event);
  
  console.log('Tab switch simulated - check network tab for API calls');
};

// Helper function to simulate user returning to tab
export const simulateTabReturn = () => {
  console.log('🔄 Simulating tab return...');
  
  // Simulate visibility change to visible
  Object.defineProperty(document, 'visibilityState', {
    writable: true,
    value: 'visible'
  });
  
  // Dispatch visibility change event
  const event = new Event('visibilitychange');
  document.dispatchEvent(event);
  
  console.log('Tab return simulated - new session should start');
};

// Helper function to start monitoring (logs status every 30 seconds)
export const startTimerMonitoring = (intervalSeconds: number = 30) => {
  console.log(`🔍 Starting timer monitoring (updates every ${intervalSeconds} seconds)`);
  console.log('Use stopTimerMonitoring() to stop');
  
  const intervalId = setInterval(() => {
    logTimerStatus();
  }, intervalSeconds * 1000);
  
  // Store interval ID globally for easy stopping
  window.timerMonitoringInterval = intervalId;
  
  // Log initial status
  logTimerStatus();
  
  return intervalId;
};

// Helper function to stop monitoring
export const stopTimerMonitoring = () => {
  if (window.timerMonitoringInterval) {
    clearInterval(window.timerMonitoringInterval);
    delete window.timerMonitoringInterval;
    console.log('⏹️ Timer monitoring stopped');
  } else {
    console.log('No timer monitoring running');
  }
};

// Helper function to check localStorage for activity data
export const checkStoredActivityData = () => {
  console.group('💾 Stored Activity Data');
  
  const keys = [
    'lastActivityState',
    'pendingActivityData', 
    'sessionBackup',
    'totalTimeBackup',
    'lastActivityResetDate',
    'activityHistory',
    'lastSyncData',
    'lastSyncTime',
    'lastSessionSent',
    'processedSessions',
    'emergencySessionBackup'
  ];
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`${key}:`, parsed);
      } catch {
        console.log(`${key}:`, value);
      }
    } else {
      console.log(`${key}:`, 'Not found');
    }
  });
  
  console.groupEnd();
};

// Add these functions to window for easy console access
if (typeof window !== 'undefined') {
  window.activityMonitor = {
    logStatus: logTimerStatus,
    simulateTabSwitch,
    simulateTabReturn,
    startMonitoring: startTimerMonitoring,
    stopMonitoring: stopTimerMonitoring,
    checkStorage: checkStoredActivityData
  };
  
  console.log('🚀 Activity Monitor loaded! Use window.activityMonitor.* functions in console');
  console.log('Available functions:');
  console.log('- logStatus(): Check current timer status');
  console.log('- simulateTabSwitch(): Test tab switching');
  console.log('- simulateTabReturn(): Test returning to tab');
  console.log('- startMonitoring(30): Start monitoring every 30 seconds');
  console.log('- stopMonitoring(): Stop monitoring');
  console.log('- checkStorage(): View localStorage activity data');
}

// Export everything for module usage
export {
  logTimerStatus as default
}; 