# User Activity Tracking System Documentation

## Overview

This documentation explains the user activity tracking system implemented in our web application. The system monitors user engagement by tracking time spent within the application and handles various edge cases like browser closures, tab switching, network disconnections, and multi-device usage.

## Features

- **Real-time activity tracking**: Monitors user active time in the application
- **Session management**: Tracks individual user sessions
- **Offline support**: Stores data locally when offline
- **Data recovery**: Multiple backup mechanisms to prevent data loss
- **Automatic synchronization**: Periodically sends data to the backend
- **Resilient to edge cases**: Handles browser closures, crashes, and network issues
- **Multi-device support**: Aggregates activity across different devices and browsers
- **Account-based tracking**: Consolidates activity data per user account regardless of access point

## Technical Implementation

### 1. Core Components

- **UserActivityContext**: React context provider that manages activity state
- **useUserActivityTracking**: Hook that provides activity data to components
- **FloatingActivityTimer**: UI component for monitoring and debugging
- **ActivityTracking API Service**: Handles communication with the backend
- **Device/Browser Identification**: Tracks unique session identifiers

### 2. Data Flow

1. The `UserActivityProvider` wraps the application and monitors user activity
2. User actions (or inactions) trigger state changes in the context
3. Activity data is periodically backed up to localStorage
4. Data is sent to the backend API at regular intervals and on specific events
5. If the API call fails, data is stored locally and retried later
6. The backend aggregates activity data from multiple sources by user account

### 3. Edge Case Handling

| Edge Case | Handling Mechanism |
|-----------|-------------------|
| Browser closure | Beacon API + localStorage backup |
| Tab switching | visibilitychange event + session recording |
| Network disconnection | Online/offline events + local storage |
| Browser crash | Periodic localStorage backups (every 10s) |
| Device shutdown | Multiple backup mechanisms with redundancy |
| Multiple browsers | Server-side aggregation by user ID |
| Multiple devices | Server-side aggregation by user ID + device tracking |
| Concurrent sessions | Session identification with timestamps to prevent double-counting |
| Device clock skew | Server-side timestamp reconciliation |
| Account switching | Session isolation by authentication state |

### 4. Multi-Device & Multi-Browser Support

The system handles users accessing their accounts from multiple devices or browsers through:

#### 4.1 Session Identification
- Each device/browser session generates a unique session ID
- Session IDs are included in activity payloads
- Backend associates all sessions with the user's account

#### 4.2 Data Aggregation
- Backend API consolidates activity data from all sources
- Activity is grouped by date and user ID
- Time calculations account for overlapping sessions

#### 4.3 Conflict Resolution
- When concurrent sessions report overlapping time periods:
  - The server uses the maximum time value to avoid double-counting
  - Session start/end timestamps help resolve time conflicts
  - If sessions report activity in the same minute, it's counted only once

#### 4.4 Device Fingerprinting
- Optional device identification data is sent with activity logs
- Helps identify unique access points for the same account
- Can include browser type, OS, and other non-personally-identifiable information

### 5. API Integration

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
    "time-spend": 30,  // minutes spent, rounded
    "session_id": "uuid-v4-string",
    "device_info": {
      "browser": "Chrome",
      "os": "Windows",
      "device_type": "desktop"
    }
  }
  ```

### 6. Environment Configuration

The following environment variables must be set for the system to work correctly:

```
VITE_API_URL=https://be-app.ailinc.com
VITE_CLIENT_ID=1
```

### 7. Local Storage Keys

The system uses multiple localStorage keys for redundancy:

- `sessionBackup`: Complete session data including history
- `totalTimeBackup`: Just the total time as a separate backup
- `lastActivityState`: State when the user last interacted
- `pendingActivityData`: Data waiting to be sent to backend
- `sessionId`: Unique identifier for the current browser session

## Debugging and Testing

### Floating Activity Timer

The application includes a floating debug panel that can be used to monitor activity tracking in real-time:

1. Click the debug icon (first button) to show detailed information
2. Use the test controls to simulate events:
   - Focus/Blur: Simulate tab switching
   - Visibility: Simulate minimizing the browser
   - Unload: Simulate closing the browser
3. Use the "Direct API Call" button to manually trigger a data sync
4. Use the "Recover Data" button to restore data from localStorage if needed
5. The session ID is displayed to help identify the current browser session

### Console Debugging

The system logs detailed information to the browser console:

- Activity state changes
- API calls and responses
- Backup operations
- Session start/end events
- Multi-device session information

### Testing Multi-Device Scenarios

To test multi-device scenarios:

1. Log in to the application on multiple devices or browsers simultaneously
2. Perform activities on each device
3. Check the backend API for aggregated data
4. Verify that activity time isn't double-counted
5. Use the debug panel on each device to verify different session IDs

## Troubleshooting

### API Calls Not Showing in Network Tab

If API calls aren't visible in the network tab:

1. Check environment variables (VITE_API_URL, VITE_CLIENT_ID)
2. Use the "Direct API Call" button to force an immediate API call
3. Check the console for detailed error messages
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
3. Check browser console for errors
4. Try using the debug panel to simulate events

### Multi-Device Issues

If multi-device tracking isn't working correctly:

1. Verify the session ID is being generated and sent with activity data
2. Check that the backend is aggregating data by user ID correctly
3. Ensure authentication is consistent across devices
4. Check for clock synchronization issues between devices

## Best Practices

1. **Do not modify** the storage keys used by the system
2. Always wait for API confirmation before clearing local data
3. Use the floating timer's debug panel for troubleshooting
4. Check the Django admin panel to verify data is being received
5. Ensure proper authentication across all devices
6. Implement server-side validation to prevent manipulation of activity data

## Django Admin Integration

The system integrates with Django admin, where you can view user activity logs:

- Navigate to Home > Activity > User activity logs
- Each entry shows the date, time spent, client information, and session details
- Data is formatted as `{"date": "YYYY-MM-DD", "time-spend": minutes, "session_id": "uuid"}` 
- Admin interface can filter activity by user, date range, or device 