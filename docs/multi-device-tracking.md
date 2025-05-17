# Multi-Device and Multi-Browser User Activity Tracking

This document explains how our application handles user activity tracking across multiple devices and browsers.

## Core Implementation

We've implemented a robust system to track user activity across different devices and browsers, ensuring accurate time tracking without double-counting or data loss. Here's how it works:

### 1. Session Identification

Every device/browser creates a unique session ID when a user logs in:

- We use the `uuid` package to generate a unique identifier
- The session ID is stored in the browser's localStorage
- All activity data sent to the backend includes this session ID
- The session ID persists until the browser's localStorage is cleared

```typescript
// src/utils/deviceIdentifier.ts
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('SESSION_ID_KEY');
  
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('SESSION_ID_KEY', sessionId);
  }
  
  return sessionId;
};
```

### 2. Device Fingerprinting

We collect non-invasive device information to help identify the source of each activity log:

- Browser type (Chrome, Firefox, Safari, etc.)
- Operating system (Windows, macOS, iOS, Android, etc.)
- Device type (desktop, mobile, tablet)

```typescript
// src/utils/deviceIdentifier.ts
export const getDeviceInfo = (): { 
  browser: string;
  os: string;
  deviceType: string;
} => {
  // Device detection logic using navigator.userAgent
  // ...
}
```

### 3. Data Aggregation

The backend API aggregates activity data from all sources:

- Data is grouped by user ID, regardless of which device it came from
- Session IDs help prevent double-counting when users are active on multiple devices
- Time calculations account for overlapping sessions

### 4. API Payload

All activity data sent to the backend includes session and device information:

```json
{
  "date": "2023-07-12",
  "time-spend": 30,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_info": {
    "browser": "Chrome",
    "os": "Windows 10",
    "deviceType": "desktop"
  },
  "user_id": "user123"
}
```

## How It Works in Practice

Here's what happens when a user uses multiple devices:

1. **User logs in on laptop**: 
   - A session ID is generated for the laptop
   - Activity is tracked with this session ID
   - Data is sent to the backend every 3 minutes

2. **User then logs in on mobile**:
   - A different session ID is generated for the mobile device
   - Activity is tracked independently from the laptop
   - Data is sent with the mobile's session ID

3. **Backend aggregation**:
   - The backend API recognizes both sessions belong to the same user
   - It aggregates the time while preventing double-counting
   - If both devices report activity for the same minute, it's counted only once

4. **Handling edge cases**:
   - If the user switches devices frequently, each switch creates a clear session boundary
   - If one device goes offline, data is cached locally and synced when it comes back online
   - If the user's clock is skewed across devices, the server normalizes timestamps

## Testing

The system includes built-in tools for testing multi-device scenarios:

1. Open the floating activity timer debug panel to see the current session ID
2. Log in from multiple browsers or devices to see how the system handles concurrent sessions
3. Use the "Direct API Call" button to manually trigger syncing from each device
4. Check the backend Django admin to verify that activity data is properly aggregated

## Debugging

When debugging multi-device issues:

1. Compare session IDs across devices to ensure they're unique
2. Check the network tab to confirm data is being sent from each device
3. Verify that device information is correctly detected
4. Look for any "double-counting" in the backend data that might indicate aggregation issues

## Future Improvements

Planned enhancements to the multi-device tracking system:

1. Improved conflict resolution algorithms for highly concurrent usage
2. Real-time session awareness across devices
3. User-facing dashboard showing device activity breakdown
4. More sophisticated device fingerprinting for better identification 