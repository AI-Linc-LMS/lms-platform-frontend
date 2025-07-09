# User Activity Tracking System Documentation

## Overview

This documentation explains the user activity tracking system implemented in our web application. The system monitors user engagement by tracking time spent within the application and handles various edge cases like browser closures, tab switching, network disconnections, and multi-device usage. Total activity time is automatically reset every 24 hours to provide daily tracking.

## Features

- **Real-time activity tracking**: Monitors user active time in the application
- **Session management**: Tracks individual user sessions
- **Offline support**: Stores data locally when offline
- **Data recovery**: Multiple backup mechanisms to prevent data loss
- **Automatic synchronization**: Periodically sends data to the backend
- **Resilient to edge cases**: Handles browser closures, crashes, and network issues
- **Multi-device support**: Aggregates activity across different devices and browsers
- **Account-based tracking**: Consolidates activity data per user account regardless of access point
- **Daily reset**: Automatically resets total time counter every 24 hours
- **Historical tracking**: Maintains history of past days' activity times
- **Precise timing**: Second-level accuracy in time tracking across all edge cases
- **Data validation**: Validates all time data before storage or transmission
- **Enhanced device fingerprinting**: Detailed device identification for accurate session tracking

## Technical Implementation

### 1. Core Components

- **UserActivityContext**: React context provider that manages activity state
- **useUserActivityTracking**: Hook that provides activity data to components
- **FloatingActivityTimer**: UI component for monitoring and debugging
- **ActivityTracking API Service**: Handles communication with the backend
- **Device/Browser Identification**: Tracks unique session identifiers
- **DailyReset**: Utility for handling 24-hour reset and historical tracking
- **UserActivitySync**: Utilities for accurate time calculations and validation

### 2. Data Flow

1. The `UserActivityProvider` wraps the application and monitors user activity
2. User actions (or inactions) trigger state changes in the context
3. Activity data is periodically backed up to localStorage
4. Data is sent to the backend API at regular intervals and on specific events
5. If the API call fails, data is stored locally and retried later
6. The backend aggregates activity data from multiple sources by user account
7. Every 24 hours, the total time counter is reset and the previous day's total is stored in history

### 3. Edge Case Handling

| Edge Case | Handling Mechanism |
|-----------|-------------------|
| Browser closure | Beacon API + localStorage backup with active session inclusion |
| Tab switching | visibilitychange event + session recording |
| Network disconnection | Online/offline events + local storage |
| Browser crash | Periodic localStorage backups (every 10s) with active session info |
| Device shutdown | Multiple backup mechanisms with redundancy |
| Multiple browsers | Server-side aggregation by user ID |
| Multiple devices | Server-side aggregation by user ID + device tracking |
| Concurrent sessions | Session identification with timestamps to prevent double-counting |
| Device clock skew | Time validation checks + server-side timestamp reconciliation |
| Account switching | Session isolation by authentication state |
| Day boundary crossed | Automatic detection and reset of total time |
| Timezone changes | Date comparison uses local timezone consistently |
| User active at reset time | Graceful handling with no data loss |
| Disrupted reset | Safety mechanisms to prevent double resets or missed resets |
| Session interruption | Active session time always included in backups and sync operations |
| Negative time values | Validation to prevent negative durations from clock skew |
| Unreasonably long sessions | Automatic capping of session duration to 24 hours maximum |
| Invalid data | Data validation before storage and transmission |

### 4. Daily Reset Mechanism

The system automatically resets the total time counter every 24 hours:

#### 4.1 Reset Detection
- Compares current date with the last recorded reset date
- Checks for date changes (year, month, day) in the local timezone
- Runs a verification check every minute to ensure resets are not missed

#### 4.2 Historical Storage
- Previous day's total time is stored in localStorage before reset
- Historical data is retained as a JSON object with date keys
- Provides ability to view past activity trends

#### 4.3 Reset Edge Cases
- If a user is active during the reset time, their current session is preserved
- If multiple devices are in use, each will detect the reset and update accordingly
- If reset fails on one device, other devices will still reset correctly
- Date/time manipulation by users is mitigated by server-side verification

### 5. Multi-Device & Multi-Browser Support

The system handles users accessing their accounts from multiple devices or browsers through:

#### 5.1 Session Identification
- Each device/browser session generates a unique session ID
- Persistent device IDs track the same device across multiple sessions
- Session IDs and device IDs are included in activity payloads
- Backend associates all sessions with the user's account

#### 5.2 Data Aggregation
- Backend API consolidates activity data from multiple sources
- Activity is grouped by date and user ID
- Time calculations account for overlapping sessions

#### 5.3 Conflict Resolution
- When concurrent sessions report overlapping time periods:
  - The server uses the maximum time value to avoid double-counting
  - Session start/end timestamps help resolve time conflicts
  - If sessions report activity in the same minute, it's counted only once

#### 5.4 Enhanced Device Fingerprinting
- Detailed device identification data is sent with activity logs
- Helps identify unique access points for the same account
- Includes browser type, OS, device type, screen size, color depth, timezone, and language
- Fallback mechanisms ensure device identification works even with limited browser support

### 6. Precise Time Tracking

The system ensures accurate time tracking even across various edge cases:

#### 6.1 Active Session Inclusion
- All time calculations include the current active session
- Backup procedures capture active session duration separately
- Recovery functions prioritize the most accurate data source

#### 6.2 Second-Level Precision
- Time is tracked and reported at the second level rather than rounded minutes
- API payload includes both seconds (precise) and minutes (for backward compatibility)
- Diagnostic information includes separate current session duration data

#### 6.3 Redundant Storage Mechanisms
- Multiple backup locations with different update frequencies
- Active session information stored separately from aggregate totals
- Recovery prioritizes the most accurate and recent data sources

#### 6.4 Time Validation and Safety Checks
- Validation of all time values before storage or transmission
- Prevention of negative durations from clock skew
- Capping of unreasonably long sessions (>24 hours)
- Type checking to prevent NaN or undefined values
- Consistent handling of edge cases across all time calculations

#### 6.5 Edge Case Time Handling
- Browser closing: active session time is captured and stored before the page unloads
- Focus/blur events: session time is accurately recorded when switching tabs
- Sleep/hibernate: power status changes trigger session management logic
- Network disconnections: time continues tracking locally during offline periods
- Clock changes: validation prevents issues from system time changes

### 7. API Integration

The system sends activity data to the backend API with the following details:

- **Endpoint**: `${VITE_API_URL}/activity/clients/${VITE_CLIENT_ID}/activity-log/`
- **Method**: POST
- **Headers**: 
  - Content-Type: application/json
  - Authorization: Bearer token
- **Payload Format**:
  ```json
  {
    "date": "YYYY-MM-DD",
    "time-spend-seconds": 3720,  // exact seconds for precision
    "time-spend": 62,  // minutes for backward compatibility
    "current_session_duration": 120,  // current active session in seconds
    "session_id": "session-uuid-v4-string",
    "device_id": "device-uuid-v4-string",
    "device_info": {
      "browser": "Chrome",
      "os": "Windows",
      "deviceType": "desktop",
      "screenSize": "1920x1080",
      "colorDepth": 24,
      "timezone": "America/New_York",
      "language": "en-US"
    },
    "timestamp": 1624512345678  // client timestamp for verification
  }
  ```

### 8. Environment Configuration

The following environment variables must be set for the system to work correctly:

```
VITE_API_URL=https://be-app.ailinc.com
VITE_CLIENT_ID=1
```

### 9. Local Storage Keys

The system uses multiple localStorage keys for redundancy:

- `sessionBackup`: Complete session data including history and active session
- `totalTimeBackup`: Just the total time as a separate backup
- `lastActivityState`: State when the user last interacted, including active session
- `pendingActivityData`: Data waiting to be sent to backend
- `sessionId`: Unique identifier for the current browser session
- `deviceId`: Persistent identifier for the device across sessions
- `lastActivityResetDate`: Date of the last daily reset
- `activityHistory`: Historical record of daily totals

## System Evaluation

### Pros

1. **Comprehensive Event Handling**: Captures a wide range of browser events (focus, blur, visibility change, page unload, etc.) for accurate tracking.

2. **Multiple Redundancy Layers**: Uses several backup strategies to minimize data loss, including localStorage backups at multiple intervals.

3. **Graceful Offline Handling**: Automatically detects when a user goes offline and stores data locally until connectivity is restored.

4. **User Privacy Respecting**: Collects only necessary activity data without personal information beyond what's needed for tracking.

5. **Cross-Device Support**: Handles users accessing from multiple devices with unique session identification.

6. **Minimal User Impact**: Operates in the background without affecting application performance or user experience.

7. **Robust Error Handling**: Includes extensive error handling and fallback mechanisms throughout the system.

8. **Detailed Logging**: Includes comprehensive logging for troubleshooting and debugging.

9. **Developer Friendliness**: The floating timer component provides real-time visibility into tracking state and debugging tools.

10. **Backend Flexibility**: Backend API structure allows for future extension and integration with analytics systems.

11. **Daily Reset Automation**: Automatically resets counters for daily tracking without user intervention.

12. **Historical Tracking**: Maintains previous activity data for trend analysis.

13. **Second-Level Accuracy**: Maintains precise timing data down to the second even across edge cases.

14. **Active Session Tracking**: Ensures active sessions are always included in calculations and backups.

15. **Data Validation**: Validates all time data to prevent inaccurate reporting from edge cases.

16. **Enhanced Device Fingerprinting**: Provides detailed device identification for accurate session tracking.

### Cons

1. **Browser Limitations**: Depends on browser APIs (localStorage, Beacon API) that have varying levels of support across browsers.

2. **LocalStorage Constraints**: LocalStorage has storage limits (typically 5-10MB) which could become an issue with extended offline usage.

3. **No Native Push Mechanism**: Lacks a native way to immediately synchronize activity between multiple active devices.

4. **JavaScript Dependency**: Requires JavaScript to be enabled; won't work if users disable JavaScript.

5. **Device Clock Reliance**: Accurate timing depends on client device clocks, though validation helps mitigate issues.

6. **Potential Data Duplication**: May send redundant data when resolving conflicts across multiple devices.

7. **API Endpoint Dependency**: Relies on stable API endpoints that must be maintained and supported.

8. **Complex State Management**: The interaction between React state and localStorage creates complexity that can be difficult to debug.

9. **Limited Security Measures**: While using authentication tokens, the system lacks advanced security features for preventing data manipulation.

10. **No Default Conflict Resolution UX**: When conflicts occur between devices, there's no user-facing notification or resolution interface.

11. **Timezone Dependency**: Daily reset relies on consistent device timezone; users changing timezones may experience irregular resets.

12. **Historical Data Growth**: The historical data could grow large over time without a cleanup mechanism.

## Debugging and Testing

### Floating Activity Timer

The application includes a floating debug panel that can be used to monitor activity tracking in real-time:

1. Click the debug icon (first button) to show detailed information
2. Use the test controls to simulate events:
   - Focus/Blur: Simulate tab switching
   - Visibility: Simulate minimizing the browser
   - Unload: Simulate closing the browser
3. Use the "Direct API Call" button to manually trigger a data sync
4. Use the "Force Sync" button to simulate a natural sync with tab switching
5. Use the "Recover Data" button to restore data from localStorage if needed
6. Use the "Simulate Reset" button to test the daily reset functionality
7. The session ID is displayed to help identify the current browser session
8. View historical activity records in the debug panel's "Historical Activity" section

### //console Debugging

The system logs detailed information to the browser //console:

- Activity state changes
- API calls and responses
- Backup operations
- Session start/end events
- Multi-device session information
- Daily reset events and historical data storage
- Active session tracking and calculations
- Time validation and safety checks
- Error handling and recovery operations

### Testing Time Accuracy

To verify time tracking accuracy:

1. Use the debug panel's "Direct API Call" button to send current activity data
2. Check the browser //console for detailed timing information including:
   - Base total time spent (excluding current session)
   - Current session duration in seconds
   - Combined total time in seconds
   - Validation checks and any corrections made
3. Verify that the API payload includes both exact seconds and rounded minutes
4. Test edge cases like:
   - Closing and reopening the app
   - Switching tabs and returning
   - Simulating device sleep/wake
   - Changing system clock (the system should handle this gracefully)
5. Use the network tab to verify the data sent matches what's displayed

### Testing Multi-Device Scenarios

To test multi-device scenarios:

1. Log in to the application on multiple devices or browsers simultaneously
2. Perform activities on each device
3. Check the backend API for aggregated data
4. Verify that activity time isn't double-counted
5. Use the debug panel on each device to verify different session IDs but consistent device IDs

### Testing Daily Reset

To test the daily reset functionality:

1. Monitor activity across a day boundary
2. Verify that the counter resets at midnight local time
3. Check that previous day's data is stored in the historical record
4. Confirm that the activity continues to be tracked after reset
5. Use the "Simulate Reset" button to test without waiting for midnight

## Troubleshooting

### API Calls Not Showing in Network Tab

If API calls aren't visible in the network tab:

1. Check environment variables (VITE_API_URL, VITE_CLIENT_ID)
2. Use the "Direct API Call" button to force an immediate API call
3. Check the //console for detailed error messages
4. Verify authentication token is valid

### Data Not Appearing in Backend

If data is being sent but not appearing in the backend:

1. Check the API endpoint format
2. Verify the payload format matches what the backend expects
3. Check CORS settings on the backend
4. Verify authentication is working properly

### Activity Not Being Tracked

If user activity isn't being tracked correctly:

1. Check if UserActivityProvider is wrapping the application
2. Verify event listeners are working (focus, blur, visibility)
3. Check browser //console for errors
4. Try using the debug panel to simulate events

### Multi-Device Issues

If multi-device tracking isn't working correctly:

1. Verify the session ID and device ID are being generated and sent with activity data
2. Check that the backend is aggregating data by user ID correctly
3. Ensure authentication is consistent across devices
4. Check for clock synchronization issues between devices

### Daily Reset Issues

If the daily reset isn't working correctly:

1. Check localStorage for the `lastActivityResetDate` value
2. Verify that the current date comparison logic is working
3. Check historical data storage in localStorage
4. Monitor //console logs for daily reset events
5. Try clearing localStorage and refreshing if reset is stuck

### Time Tracking Accuracy Issues

If time tracking seems inaccurate:

1. Check the //console logs for active session calculations and validation messages
2. Verify that the floating timer shows both current session and total time
3. Use the Direct API Call feature to check what's being sent to the backend
4. Look for any discrepancies between displayed time and API payload
5. Check if any browser extensions might be interfering with tab focus events
6. Verify that time validation is working correctly by checking //console logs
7. Test with different browsers to identify browser-specific issues

## Best Practices

1. **Do not modify** the storage keys used by the system
2. Always wait for API confirmation before clearing local data
3. Use the floating timer's debug panel for troubleshooting
4. Check the Django admin panel to verify data is being received
5. Ensure proper authentication across all devices
6. Implement server-side validation to prevent manipulation of activity data
7. When adding features, maintain the second-level accuracy of time tracking
8. Always include active session time in total time calculations
9. Test edge cases thoroughly when modifying timing-related code
10. Validate all time values before storage or transmission
11. Use the provided utility functions for time calculations to ensure consistency

## Django Admin Integration

The system integrates with Django admin, where you can view user activity logs:

- Navigate to Home > Activity > User activity logs
- Each entry shows the date, time spent, client information, and session details
- Data is formatted as `{"date": "YYYY-MM-DD", "time-spend": minutes, "time-spend-seconds": seconds, "session_id": "uuid"}`
- Admin interface can filter activity by user, date range, or device 