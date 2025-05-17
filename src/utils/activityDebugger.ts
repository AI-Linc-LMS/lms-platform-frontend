/**
 * Utility functions for debugging user activity tracking
 */

let activeDebugEvents: string[] = [];
const MAX_DEBUG_EVENTS = 100;

/**
 * Log a debug event with timestamp
 */
export const logActivityEvent = (event: string, data?: unknown): void => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${event}${data ? ': ' + JSON.stringify(data) : ''}`;
  
  console.log(logEntry);
  
  // Store in memory for retrieval
  activeDebugEvents.push(logEntry);
  
  // Keep array size manageable
  if (activeDebugEvents.length > MAX_DEBUG_EVENTS) {
    activeDebugEvents = activeDebugEvents.slice(-MAX_DEBUG_EVENTS);
  }
};

/**
 * Get all stored debug events
 */
export const getActivityDebugEvents = (): string[] => {
  return [...activeDebugEvents];
};

/**
 * Clear stored debug events
 */
export const clearActivityDebugEvents = (): void => {
  activeDebugEvents = [];
};

/**
 * Test activity tracking events by simulating browser actions
 */
export const simulateActivityEvent = (eventType: 'focus' | 'blur' | 'visibility' | 'unload'): void => {
  logActivityEvent(`Simulating ${eventType} event`);
  
  switch (eventType) {
    case 'focus':
      window.dispatchEvent(new Event('focus'));
      break;
    case 'blur':
      window.dispatchEvent(new Event('blur'));
      break;
    case 'visibility':
      // This is a hack to simulate visibility change - not perfect
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: function() {
          return document.visibilityState === 'visible' ? 'hidden' : 'visible';
        }
      });
      document.dispatchEvent(new Event('visibilitychange'));
      break;
    case 'unload':
      window.dispatchEvent(new Event('beforeunload'));
      break;
  }
}; 