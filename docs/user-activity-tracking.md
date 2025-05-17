# User Activity Tracking System Documentation

## Overview

This documentation explains the user activity tracking system implemented in our web application. The system monitors user engagement by tracking time spent within the application and handles various edge cases like browser closures, tab switching, and network disconnections.

## Features

- **Real-time activity tracking**: Monitors user active time in the application
- **Session management**: Tracks individual user sessions
- **Offline support**: Stores data locally when offline
- **Data recovery**: Multiple backup mechanisms to prevent data loss
- **Automatic synchronization**: Periodically sends data to the backend
- **Resilient to edge cases**: Handles browser closures, crashes, and network issues

## Technical Implementation

### 1. Core Components

- **UserActivityContext**: React context provider that manages activity state
- **useUserActivityTracking**: Hook that provides activity data to components
- **FloatingActivityTimer**: UI component for monitoring and debugging
- **ActivityTracking API Service**: Handles communication with the backend

### 2. Data Flow

1. The `UserActivityProvider` wraps the application and monitors user activity
2. User actions (or inactions) trigger state changes in the context
3. Activity data is periodically backed up to localStorage
4. Data is sent to the backend API at regular intervals and on specific events
5. If the API call fails, data is stored locally and retried later

### 3. Edge Case Handling

| Edge Case | Handling Mechanism |
|-----------|-------------------|
| Browser closure | Beacon API + localStorage backup |
| Tab switching | visibilitychange event + session recording |
| Network disconnection | Online/offline events + local storage |
| Browser crash | Periodic localStorage backups (every 10s) |
| Device shutdown | Multiple backup mechanisms with redundancy |

### 4. API Integration

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
    "time-spend": 30  // minutes spent, rounded
  }
  ```

### 5. Environment Configuration

The following environment variables must be set for the system to work correctly:

```
VITE_API_URL=https://be-app.ailinc.com
VITE_CLIENT_ID=1
```

### 6. Local Storage Keys

The system uses multiple localStorage keys for redundancy:

- `sessionBackup`: Complete session data including history
- `totalTimeBackup`: Just the total time as a separate backup
- `lastActivityState`: State when the user last interacted
- `pendingActivityData`: Data waiting to be sent to backend

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

### Console Debugging

The system logs detailed information to the browser console:

- Activity state changes
- API calls and responses
- Backup operations
- Session start/end events

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

## Best Practices

1. **Do not modify** the storage keys used by the system
2. Always wait for API confirmation before clearing local data
3. Use the floating timer's debug panel for troubleshooting
4. Check the Django admin panel to verify data is being received

## Django Admin Integration

The system integrates with Django admin, where you can view user activity logs:

- Navigate to Home > Activity > User activity logs
- Each entry shows the date, time spent, and client information
- Data is formatted as `{"date": "YYYY-MM-DD", "time-spend": minutes}` 