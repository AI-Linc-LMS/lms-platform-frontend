/**
 * Utility functions for debugging user activity tracking
 */

let activeDebugEvents: string[] = [];
const MAX_DEBUG_EVENTS = 100;

/**
 * Log a debug event with timestamp
 * OPTIMIZED: Uses requestIdleCallback to defer logging when browser is busy
 * This prevents logging from interfering with user interactions or causing refreshes
 */
export const logActivityEvent = (event: string, data?: unknown): void => {
  // Defer logging to next event loop or idle time to prevent blocking
  // This ensures logging doesn't interfere with user experience
  const logEntry = () => {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${event}${
      data ? ": " + JSON.stringify(data) : ""
    }`;

    // Store in memory for retrieval
    activeDebugEvents.push(entry);

    // Keep array size manageable
    if (activeDebugEvents.length > MAX_DEBUG_EVENTS) {
      activeDebugEvents = activeDebugEvents.slice(-MAX_DEBUG_EVENTS);
    }
  };

  // Use requestIdleCallback if available to defer logging when browser is idle
  // This prevents logging from causing performance issues or refreshes
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const requestIdleCallback = (
      window as Window & {
        requestIdleCallback: (
          callback: () => void,
          options?: { timeout?: number }
        ) => number;
      }
    ).requestIdleCallback;
    requestIdleCallback(logEntry, { timeout: 100 });
  } else {
    // Fallback: use setTimeout to defer to next event loop
    setTimeout(logEntry, 0);
  }
};

/**
 * Get all stored debug events
 */
export const getActivityDebugEvents = (): string[] => {
  return [...activeDebugEvents];
};

/**
 * Clear all stored debug events
 */
export const clearActivityDebugEvents = (): void => {
  activeDebugEvents = [];
};

/**
 * Test activity tracking events by simulating browser actions
 */
export const simulateActivityEvent = (
  eventType: "focus" | "blur" | "visibility" | "unload"
): void => {
  logActivityEvent(`Simulating ${eventType} event`);

  switch (eventType) {
    case "focus":
      window.dispatchEvent(new Event("focus"));
      break;
    case "blur":
      window.dispatchEvent(new Event("blur"));
      break;
    case "visibility":
      // This is a hack to simulate visibility change - not perfect
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: function () {
          return document.visibilityState === "visible" ? "hidden" : "visible";
        },
      });
      document.dispatchEvent(new Event("visibilitychange"));
      break;
    case "unload":
      window.dispatchEvent(new Event("beforeunload"));
      break;
  }
};

/**
 * Force a daily reset for testing purposes
 */
export const simulateDailyReset = (): void => {
  try {
    // Get yesterday's date
    // const yesterday = new Date();
    // yesterday.setDate(yesterday.getDate() - 1);
    // // Set the last reset date to yesterday to force a reset
    // localStorage.setItem("lastActivityResetDate", yesterday.toISOString());
    // logActivityEvent("Simulated day boundary for testing daily reset", {
    //   setLastResetDateTo: yesterday.toISOString(),
    // });
    // For convenience, reload the page to trigger the reset immediately
    // window.location.reload();
  } catch (error) {
    logActivityEvent("Error simulating daily reset", {
      error: (error as Error).message,
    });
  }
};
