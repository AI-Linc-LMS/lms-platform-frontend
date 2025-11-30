import React, { useEffect, useState } from "react";
import useUserActivityTracking from "../hooks/useUserActivityTracking";
import {
  calculateCurrentSessionDuration,
  calculateTotalTimeWithSession,
} from "../utils/userActivitySync";
import {
  simulateActivityEvent,
  getActivityDebugEvents,
  clearActivityDebugEvents,
  simulateDailyReset,
} from "../utils/activityDebugger";
import {
  getSessionId,
  getDeviceInfo,
  getDeviceId,
} from "../utils/deviceIdentifier";
import {
  getCurrentUserId,
  getAuthenticatedUserId,
} from "../utils/userIdHelper";
import {
  getHistoricalActivity,
  getNextResetTime,
  getTimeUntilNextReset,
} from "../utils/dailyReset";

// New interface to track sync status
interface SyncStatus {
  lastSync: number | null;
  status: "idle" | "syncing" | "success" | "failed";
  message: string;
}

// Storage keys for deduplication (must match UserActivityContext)
const STORAGE_KEYS = {
  LAST_SYNC_DATA: "lastSyncData",
  LAST_SYNC_TIME: "lastSyncTime",
};

const FloatingActivityTimer: React.FC = () => {
  const {
    isActive,
    totalTimeSpent,
    currentSessionStart,
    formatTime,
    activityHistory,
    recoverFromLocalStorage,
    lastResetDate,
  } = useUserActivityTracking();
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showDebugging, setShowDebugging] = useState<boolean>(false);
  const [debugEvents, setDebugEvents] = useState<string[]>([]);
  const [recoveredTime, setRecoveredTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [deviceInfo, setDeviceInfo] = useState<{
    browser: string;
    os: string;
    deviceType: string;
  } | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [historicalActivity, setHistoricalActivity] = useState<
    Record<string, number>
  >({});
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");
  const [nextResetTime, setNextResetTime] = useState<Date>(getNextResetTime());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    status: "idle",
    message: "No sync yet",
  });

  // Get session ID and device info on mount
  useEffect(() => {
    setSessionId(getSessionId());
    setDeviceInfo(getDeviceInfo());
    setAccountId(getAuthenticatedUserId());
    setDeviceId(getDeviceId());
    setHistoricalActivity(getHistoricalActivity());
    setNextResetTime(getNextResetTime());
    setTimeUntilReset(getTimeUntilNextReset());
  }, []);

  // Update time until reset every minute
  useEffect(() => {
    const resetTimer = setInterval(() => {
      setTimeUntilReset(getTimeUntilNextReset());
    }, 60000); // Update every minute

    return () => clearInterval(resetTimer);
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
        setCurrentDuration(
          calculateCurrentSessionDuration(isActive, currentSessionStart)
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, currentSessionStart]);

  // Update debug logs periodically and check for sync events
  // OPTIMIZED: Only poll when debugging is enabled, and use longer interval to reduce re-renders
  useEffect(() => {
    if (!showDebugging) return;

    // Use longer interval (5 seconds instead of 1 second) to reduce re-renders
    // This prevents the component from causing performance issues or refreshes
    const debugTimer = setInterval(() => {
      // Use requestIdleCallback to defer reading debug events when browser is idle
      const readDebugEvents = () => {
        const events = getActivityDebugEvents();
        
        // Only update state if events actually changed to prevent unnecessary re-renders
        setDebugEvents((prevEvents) => {
          if (prevEvents.length !== events.length || 
              prevEvents[prevEvents.length - 1] !== events[events.length - 1]) {
            return events;
          }
          return prevEvents; // Return previous to prevent re-render
        });

        // Check for sync-related events in the logs
        const syncEvents = events.filter(
          (event) =>
            event.includes("Sent activity data") ||
            event.includes("Failed to send activity data") ||
            event.includes("Periodic sync")
        );

        if (syncEvents.length > 0) {
          const latestSyncEvent = syncEvents[syncEvents.length - 1];

          // Update sync status only if it changed
          setSyncStatus((prevStatus) => {
            if (latestSyncEvent.includes("success") && prevStatus.status !== "success") {
              // Reset status after 3 seconds
              setTimeout(() => {
                setSyncStatus((prev) => ({ ...prev, status: "idle" }));
              }, 3000);
              return {
                lastSync: Date.now(),
                status: "success",
                message: "Last sync successful",
              };
            } else if (latestSyncEvent.includes("failed") && prevStatus.status !== "failed") {
              return {
                lastSync: Date.now(),
                status: "failed",
                message: "Sync failed",
              };
            } else if (latestSyncEvent.includes("Periodic sync") && prevStatus.status !== "syncing") {
              return {
                lastSync: Date.now(),
                status: "syncing",
                message: "Syncing...",
              };
            }
            return prevStatus; // No change, prevent re-render
          });
        }
      };

      // Defer to next event loop or use requestIdleCallback if available
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        const requestIdleCallback = (
          window as Window & {
            requestIdleCallback: (
              callback: () => void,
              options?: { timeout?: number }
            ) => number;
          }
        ).requestIdleCallback;
        requestIdleCallback(readDebugEvents, { timeout: 5000 });
      } else {
        setTimeout(readDebugEvents, 0);
      }
    }, 5000); // Changed from 1000ms to 5000ms to reduce polling frequency

    return () => clearInterval(debugTimer);
  }, [showDebugging]);

  // Test handlers
  const handleSimulateEvent = (
    eventType: "focus" | "blur" | "visibility" | "unload"
  ) => {
    simulateActivityEvent(eventType);
    setTimeout(() => setDebugEvents(getActivityDebugEvents()), 100);
  };

  const handleClearLogs = () => {
    clearActivityDebugEvents();
    setDebugEvents([]);
  };

  // Direct API call for testing (bypasses simulation)
  const handleDirectApiCall = () => {
    setSyncStatus({
      lastSync: Date.now(),
      status: "syncing",
      message: "Direct API call...",
    });

    const apiUrl = import.meta.env.VITE_API_URL;
    const clientId = import.meta.env.VITE_CLIENT_ID;

    if (!apiUrl || !clientId) {
      setSyncStatus({
        lastSync: Date.now(),
        status: "failed",
        message: "Missing API config",
      });
      return;
    }

    // Calculate accurate total time including current session
    const totalTimeInSeconds = calculateTotalTimeWithSession(
      totalTimeSpent,
      isActive,
      currentSessionStart
    );

    // Create clean API payload with total accumulated time (Today's Total)
    const activityData = {
      time_spent_seconds: totalTimeInSeconds, // This is Today's Total (11m 24s in your example)
      // "session_id": sessionId,
      // "account_id": getAuthenticatedUserId(), // User's account ID (same across all devices)
      session_id: getCurrentUserId(), // Keep for backward compatibility
      // "device_id": getDeviceId(), // Unique device/browser identifier
      date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
      device_type: deviceInfo?.deviceType || "unknown",
      // "timestamp": Date.now()
    };

    // Setup fetch options
    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authorization if available
        ...(localStorage.getItem("token")
          ? {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          : {}),
      },
      body: JSON.stringify(activityData),
    };

    // Make the API call directly using Fetch API - completely fire-and-forget
    // Don't parse response.json() to avoid any potential side effects
    fetch(`${apiUrl}/activity/clients/${clientId}/track-time/`, fetchOptions)
      .then((response) => {
        if (!response.ok) {
          // Log error but don't throw - fire-and-forget means no error propagation
          console.warn(`Activity tracking API responded with status ${response.status}`);
          return;
        }
        
        // Don't parse response - just update UI state
        // Use setTimeout to defer state updates to next event loop
        setTimeout(() => {
          try {
            // Record this sync to prevent duplicates in automatic syncs
            localStorage.setItem(
              STORAGE_KEYS.LAST_SYNC_TIME,
              Date.now().toString()
            );
            localStorage.setItem(
              STORAGE_KEYS.LAST_SYNC_DATA,
              totalTimeInSeconds.toString()
            );
          } catch {
            // Ignore storage errors
          }

          setSyncStatus({
            lastSync: Date.now(),
            status: "success",
            message: "API call successful",
          });
        }, 0);

        // Reset status after 3 seconds
        setTimeout(() => {
          setSyncStatus((prev) => ({ ...prev, status: "idle" }));
        }, 3000);
      })
      .catch((e) => {
        setSyncStatus({
          lastSync: Date.now(),
          status: "failed",
          message: `Failed: ${e.message}`,
        });
      });
  };

  // Force manual sync for testing
  const handleForceSync = () => {
    setSyncStatus({
      lastSync: Date.now(),
      status: "syncing",
      message: "Manual sync...",
    });

    // Simulate closing/opening tab to trigger API call
    simulateActivityEvent("blur");
    setTimeout(() => simulateActivityEvent("focus"), 500);

    setTimeout(() => {
      setDebugEvents(getActivityDebugEvents());
      setSyncStatus({
        lastSync: Date.now(),
        status: "success",
        message: "Manual sync completed",
      });
    }, 1000);
  };

  // Last reset info
  const renderResetInfo = () => {
    if (!lastResetDate) return null;

    return (
      <div className="mt-1 text-xs text-center">
        <div className="text-gray-500">
          Last reset: {new Date(lastResetDate).toLocaleDateString()}
        </div>
        <div className="text-gray-500 mt-1">
          Next reset:{" "}
          <span className="font-medium">
            {nextResetTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="ml-1 text-blue-500">({timeUntilReset})</span>
        </div>
      </div>
    );
  };

  // JSX for debug panel with session info
  const renderDebugPanel = () => {
    if (!showDebugging) return null;

    return (
      <div
        className="border-t border-gray-200 bg-gray-50 p-3 text-xs overflow-auto"
        style={{ maxHeight: "300px" }}
      >
        <div className="mb-3">
          <h4 className="font-semibold text-gray-700 mb-2">
            Session Information
          </h4>
          <div className="bg-white p-2 rounded border border-gray-300 mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Session ID:</span>
              <span className="text-gray-900 font-mono text-xs">
                {sessionId}
              </span>
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
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Account ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {accountId || "Anonymous"}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">Device ID:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {deviceId.slice(0, 12)}...
                  </span>
                </div>
              </>
            )}
            {lastResetDate && (
              <>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Last Reset:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {new Date(lastResetDate).toLocaleDateString()}{" "}
                    {new Date(lastResetDate).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">Next Reset:</span>
                  <span className="text-gray-900 font-mono text-xs">
                    {nextResetTime.toLocaleDateString()}{" "}
                    {nextResetTime.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">Time Until Reset:</span>
                  <span className="text-blue-600 font-mono text-xs">
                    {timeUntilReset}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Historical Activity Section */}
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-700 mb-2">
              Historical Activity
            </h4>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showHistory ? "Hide" : "Show"}
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
                        <td className="text-right py-1">
                          {formatTime(seconds)}
                        </td>
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
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => handleSimulateEvent("focus")}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs"
          >
            Focus/Blur
          </button>
          <button
            onClick={() => {
              // Test the actual visibility API
              console.log("🔍 Testing visibility change...");
              console.log(
                "Current visibility state:",
                document.visibilityState
              );
              console.log("Current active status:", isActive);

              // Simulate visibility change by dispatching the actual event
              const currentState = document.visibilityState;
              const newState =
                currentState === "visible" ? "hidden" : "visible";

              // Temporarily override the visibilityState property
              Object.defineProperty(document, "visibilityState", {
                writable: true,
                configurable: true,
                value: newState,
              });

              // Dispatch the real visibility change event
              const event = new Event("visibilitychange");
              document.dispatchEvent(event);

              console.log("✅ Dispatched visibilitychange event");
              console.log("New visibility state:", document.visibilityState);

              // Restore the original state after 3 seconds for testing
              setTimeout(() => {
                Object.defineProperty(document, "visibilityState", {
                  writable: true,
                  configurable: true,
                  value: currentState,
                });
                document.dispatchEvent(new Event("visibilitychange"));
                console.log(
                  "🔄 Restored original visibility state:",
                  document.visibilityState
                );
              }, 3000);
            }}
            className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
          >
            Test Tab Switch
          </button>
          <button
            onClick={() => handleSimulateEvent("unload")}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
          >
            Unload
          </button>
          <button
            onClick={handleDirectApiCall}
            className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs"
          >
            Direct API Call
          </button>
          <button
            onClick={handleForceSync}
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2 py-1 rounded text-xs"
          >
            Force Sync
          </button>
          <button
            onClick={() => {
              const recovered = recoverFromLocalStorage();
              setRecoveredTime(recovered);
              setTimeout(() => setRecoveredTime(null), 3000);
            }}
            className="bg-teal-100 hover:bg-teal-200 text-teal-800 px-2 py-1 rounded text-xs"
          >
            Recover Data
          </button>
          <button
            onClick={() => {
              simulateDailyReset();
              // Update reset time after simulation
              setTimeout(() => {
                setHistoricalActivity(getHistoricalActivity());
                setNextResetTime(getNextResetTime());
                setTimeUntilReset(getTimeUntilNextReset());
              }, 500);
            }}
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
            <div key={i} className="text-xs mb-1">
              {event}
            </div>
          ))}
          {debugEvents.length === 0 && (
            <div className="text-gray-500 italic">No events logged</div>
          )}
        </div>
      </div>
    );
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 bg-blue-500 text-[var(--font-light)] rounded-full w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer z-50 hover:bg-blue-600 transition-all"
        onClick={() => setIsMinimized(false)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 ${
        isExpanded ? (showDebugging ? "w-96" : "w-64") : "w-auto"
      } bg-white rounded-lg shadow-lg overflow-hidden z-50 transition-all duration-300 border border-gray-200`}
    >
      {/* Header */}
      <div className="bg-blue-500 text-[var(--font-light)] px-3 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              isActive ? "bg-green-300" : "bg-red-300"
            } animate-pulse`}
          ></div>
          <h3 className="text-sm font-medium">Activity Timer</h3>

          {/* Sync indicator */}
          {syncStatus.status !== "idle" && (
            <div className="ml-2 flex items-center text-xs">
              <div
                className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  syncStatus.status === "syncing"
                    ? "bg-yellow-300 animate-pulse"
                    : syncStatus.status === "success"
                    ? "bg-green-300"
                    : "bg-red-300"
                }`}
              ></div>
              <span className="truncate max-w-[80px]">
                {syncStatus.message}
              </span>
            </div>
          )}
        </div>

        <div className="flex">
          <button
            onClick={() => setShowDebugging(!showDebugging)}
            className="text-[var(--font-light)] hover:text-blue-100 p-1"
            title="Debug"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M6.5 0a.5.5 0 0 0 0 1H7v1.07A7.001 7.001 0 0 0 8 16a7 7 0 0 0 5.29-11.584.531.531 0 0 0 .013-.012l.354-.354.353.354a.5.5 0 1 0 .707-.707l-1.5-1.5a.5.5 0 1 0-.707.707l.354.354-.354.354a.717.717 0 0 0-.012.012A6.973 6.973 0 0 0 9 2.071V1h.5a.5.5 0 0 0 0-1h-3zm2 5.6V9a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1 0-1h3V5.6a.5.5 0 1 1 1 0z" />
            </svg>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[var(--font-light)] hover:text-blue-100 p-1"
            title="Toggle Expand"
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-[var(--font-light)] hover:text-blue-100 p-1"
            title="Minimize"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
              <path d="M15 7H1V6h14v1z" />
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

        {/* Last reset info with next reset time */}
        {lastResetDate && isExpanded && renderResetInfo()}

        {/* Recovered time indicator */}
        {recoveredTime !== null && (
          <div className="mt-1 text-xs text-center">
            <span
              className={recoveredTime > 0 ? "text-green-600" : "text-gray-500"}
            >
              {recoveredTime > 0
                ? `Recovered backup: ${formatTime(recoveredTime)}`
                : "No backup data found"}
            </span>
          </div>
        )}
      </div>

      {/* Status info */}
      {isExpanded && (
        <div className="p-3">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <span
                className={`text-sm font-medium ${
                  isActive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Session:</span>
              <span className="text-sm font-medium text-blue-600">
                {formatTime(currentDuration)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today's Total:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatTime(totalTimeSpent)}
              </span>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Last reset:</span>
                <span>
                  {lastResetDate
                    ? new Date(lastResetDate).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Next reset:</span>
                <span>{timeUntilReset}</span>
              </div>
              <div className="flex justify-between">
                <span>Sessions:</span>
                <span>{activityHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Last sync:</span>
                <span>
                  {syncStatus.lastSync
                    ? new Date(syncStatus.lastSync).toLocaleTimeString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Device ID:</span>
                <span className="font-mono text-xs">
                  {sessionId.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      {renderDebugPanel()}
    </div>
  );
};

export default FloatingActivityTimer;
